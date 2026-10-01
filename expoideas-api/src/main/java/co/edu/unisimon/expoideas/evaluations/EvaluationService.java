package co.edu.unisimon.expoideas.evaluations;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.editions.Track;
import co.edu.unisimon.expoideas.evaluations.EvaluationRequest.ScoreRequest;
import co.edu.unisimon.expoideas.evaluations.ProjectEvaluationsResponse.PendingJuror;
import co.edu.unisimon.expoideas.notifications.EvaluationReminderEvent;
import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.projects.ProjectPolicy;
import co.edu.unisimon.expoideas.projects.ProjectRepository;
import co.edu.unisimon.expoideas.users.User;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Evaluación con rúbrica. Cada jurado asignado califica el proyecto con la
 * rúbrica de su cátedra y puede corregir lo que guardó. La nota de un jurado es
 * el promedio simple de los criterios; la del proyecto, el promedio de sus
 * jurados. Las notas las ven el profesor del grupo y la gestión; cada jurado,
 * solo la suya.
 *
 * <p>Si la gestión quita a un jurado, su evaluación se conserva pero deja de
 * contar; vuelve a contar si lo asignan otra vez.
 *
 * <p>Los listados de gestión piden la nota de muchos proyectos de una vez
 * ({@link #gradesOf}); la gestión también puede recordar por correo a los
 * jurados lo que les falta ({@link #remind}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final RubricRepository rubricRepository;
    private final EvaluationRepository evaluationRepository;
    private final ProjectRepository projectRepository;
    private final ProjectPolicy policy;
    private final EvaluatorRule evaluatorRule;
    private final ApplicationEventPublisher events;

    /** @throws NoSuchElementException si esa cátedra todavía no tiene rúbrica */
    @Transactional(readOnly = true)
    public RubricResponse rubric(Track track) {
        return rubricRepository
                .findByTrack(track)
                .map(RubricResponse::from)
                .orElseThrow(() -> new NoSuchElementException("Esa cátedra todavía no tiene rúbrica"));
    }

    /** La evaluación de quien consulta, si ya la guardó. */
    @Transactional(readOnly = true)
    public Optional<EvaluationResponse> mine(Integer projectId, String email) {
        User juror = policy.account(email);
        requireEvaluator(projectId, juror);
        return evaluationRepository
                .findByProjectIdAndJurorId(projectId, juror.getId())
                .map(EvaluationResponse::from);
    }

    /** Todo lo que quien consulta ya calificó, para saber qué le falta. */
    @Transactional(readOnly = true)
    public List<EvaluationResponse> allMine(String email) {
        User juror = policy.account(email);
        return evaluationRepository.findByJurorIdOrderByUpdatedAtDesc(juror.getId()).stream()
                .map(EvaluationResponse::from)
                .toList();
    }

    /**
     * Guarda o corrige la evaluación de quien tiene la sesión.
     *
     * @throws ForbiddenActionException si no es jurado de ese proyecto
     * @throws InvalidFieldsException   si falta un criterio, un nivel no es de su criterio o
     *                                  falta la observación de un nivel por debajo de 3.0
     */
    @Transactional
    public EvaluationResponse save(Integer projectId, String email, EvaluationRequest request) {
        User juror = policy.account(email);
        Project project = requireEvaluator(projectId, juror);
        Rubric rubric = rubricRepository
                .findByTrack(project.getTrack())
                .orElseThrow(() -> new ConflictException("Esta cátedra todavía no tiene rúbrica"));
        Evaluation evaluation = evaluationRepository
                .findByProjectIdAndJurorId(projectId, juror.getId())
                .orElseGet(() -> Evaluation.of(project, juror));

        if (request.isAbsent()) {
            evaluation.markAbsent();
        } else {
            apply(rubric, request.scoresOrEmpty(), evaluation);
        }

        Evaluation saved = evaluationRepository.save(evaluation);
        log.info(
                "Proyecto {}: el usuario ID {} guardó su evaluación ({})",
                projectId,
                juror.getId(),
                saved.isAbsent() ? "no asistió" : saved.grade());
        return EvaluationResponse.from(saved);
    }

    /**
     * La nota del proyecto y el detalle de cada jurado.
     *
     * @throws ForbiddenActionException si no es el profesor del grupo ni de la gestión
     */
    @Transactional(readOnly = true)
    public ProjectEvaluationsResponse results(Integer projectId, String email) {
        User viewer = policy.account(email);
        Project project = policy.findVisible(projectId, viewer);
        boolean allowed = project.getTeacher().getId().equals(viewer.getId())
                || viewer.getRole().isManagement();
        if (!allowed) {
            throw new ForbiddenActionException("Solo el profesor del grupo o la gestión ven las calificaciones");
        }

        List<User> jurors = evaluatorRule.evaluatorsOf(project);
        List<Evaluation> counted = counted(evaluationRepository.findByProjectIdOrderByCreatedAtAsc(projectId), jurors);
        Set<Integer> done = counted.stream()
                .map(evaluation -> evaluation.getJuror().getId())
                .collect(Collectors.toSet());

        ProjectGrade grade = ProjectGrade.of(counted, jurors.size());
        return new ProjectEvaluationsResponse(
                projectId,
                grade.grade(),
                grade.scale(),
                jurors.size(),
                counted.stream().map(EvaluationResponse::from).toList(),
                jurors.stream()
                        .filter(juror -> !done.contains(juror.getId()))
                        .map(PendingJuror::from)
                        .toList());
    }

    /** La nota de cada proyecto de la lista, por su id, con dos consultas para todos. */
    @Transactional(readOnly = true)
    public Map<Integer, ProjectGrade> gradesOf(Collection<Project> projects) {
        if (projects.isEmpty()) {
            return Map.of();
        }
        Map<Integer, List<User>> jurorsByProject = evaluatorRule.evaluatorsByProject(projects);
        Map<Integer, List<Evaluation>> evaluationsByProject = evaluationsByProject(projects);

        Map<Integer, ProjectGrade> grades = new HashMap<>();
        for (Project project : projects) {
            List<User> jurors = jurorsByProject.getOrDefault(project.getId(), List.of());
            List<Evaluation> counted = counted(evaluationsByProject.getOrDefault(project.getId(), List.of()), jurors);
            grades.put(project.getId(), ProjectGrade.of(counted, jurors.size()));
        }
        return grades;
    }

    /**
     * Escribe a cada jurado de esa cátedra y edición que tenga proyectos sin
     * calificar, con la lista de lo que le falta. Los correos salen tras el
     * commit, en otro hilo.
     */
    @Transactional(readOnly = true)
    public ReminderResponse remind(Integer editionId, Track track) {
        List<Project> projects = projectRepository.search(editionId, track, null, null, null, null);
        Map<Integer, List<User>> jurorsByProject = evaluatorRule.evaluatorsByProject(projects);
        Map<Integer, List<Evaluation>> evaluationsByProject = evaluationsByProject(projects);

        Map<Integer, User> jurors = new LinkedHashMap<>();
        Map<Integer, List<String>> pendingTitles = new LinkedHashMap<>();
        int pendingProjects = 0;
        for (Project project : projects) {
            Set<Integer> done = evaluationsByProject.getOrDefault(project.getId(), List.of()).stream()
                    .map(evaluation -> evaluation.getJuror().getId())
                    .collect(Collectors.toSet());
            boolean pending = false;
            for (User juror : jurorsByProject.getOrDefault(project.getId(), List.of())) {
                if (!done.contains(juror.getId())) {
                    jurors.putIfAbsent(juror.getId(), juror);
                    pendingTitles
                            .computeIfAbsent(juror.getId(), id -> new ArrayList<>())
                            .add(project.getTitle());
                    pending = true;
                }
            }
            if (pending) {
                pendingProjects++;
            }
        }

        pendingTitles.forEach((jurorId, titles) -> {
            User juror = jurors.get(jurorId);
            events.publishEvent(new EvaluationReminderEvent(juror.getEmail(), juror.fullName(), titles));
        });
        log.info(
                "Edición {} / {}: recordatorio de evaluación a {} jurados por {} proyectos",
                editionId,
                track,
                pendingTitles.size(),
                pendingProjects);
        return new ReminderResponse(pendingTitles.size(), pendingProjects);
    }

    private Map<Integer, List<Evaluation>> evaluationsByProject(Collection<Project> projects) {
        List<Integer> ids = projects.stream().map(Project::getId).toList();
        return evaluationRepository.findByProjectIdInOrderByCreatedAtAsc(ids).stream()
                .collect(Collectors.groupingBy(
                        evaluation -> evaluation.getProject().getId(), LinkedHashMap::new, Collectors.toList()));
    }

    /** Solo cuentan las evaluaciones de quienes siguen asignados. */
    private static List<Evaluation> counted(List<Evaluation> evaluations, List<User> jurors) {
        Set<Integer> jurorIds = jurors.stream().map(User::getId).collect(Collectors.toSet());
        return evaluations.stream()
                .filter(evaluation -> jurorIds.contains(evaluation.getJuror().getId()))
                .toList();
    }

    /** El proyecto, si esa cuenta lo ve y además lo califica. A quien no lo ve, como si no existiera. */
    private Project requireEvaluator(Integer projectId, User user) {
        Project project = policy.findVisible(projectId, user);
        if (!evaluatorRule.isEvaluator(project, user)) {
            throw new ForbiddenActionException("Solo los jurados asignados califican este proyecto");
        }
        return project;
    }

    /** Valida lo que llegó contra la rúbrica y, si todo cuadra, lo pone en la evaluación. */
    private void apply(Rubric rubric, List<ScoreRequest> scores, Evaluation evaluation) {
        Map<Integer, ScoreRequest> byCriterion = new HashMap<>();
        Map<String, String> errors = new LinkedHashMap<>();
        for (ScoreRequest score : scores) {
            if (byCriterion.put(score.criterionId(), score) != null) {
                errors.put(field(score.criterionId(), "levelId"), "Este criterio llegó más de una vez");
            }
        }

        Map<RubricCriterion, RubricLevel> chosen = new LinkedHashMap<>();
        Map<Integer, String> comments = new HashMap<>();
        for (RubricCriterion criterion : rubric.getCriteria()) {
            ScoreRequest score = byCriterion.remove(criterion.getId());
            if (score == null) {
                errors.putIfAbsent(field(criterion.getId(), "levelId"), "Elige un nivel para este criterio");
                continue;
            }
            Optional<RubricLevel> level = criterion.level(score.levelId());
            if (level.isEmpty()) {
                errors.putIfAbsent(field(criterion.getId(), "levelId"), "Ese nivel no es de este criterio");
                continue;
            }
            String comment = comment(score);
            if (level.get().isFailing() && comment == null) {
                errors.put(
                        field(criterion.getId(), "comment"),
                        "Explica la calificación: la observación es obligatoria por debajo de 3.0");
            }
            chosen.put(criterion, level.get());
            comments.put(criterion.getId(), comment);
        }
        if (!byCriterion.isEmpty()) {
            errors.put("scores", "Hay criterios que no son de la rúbrica de esta cátedra");
        }
        if (!errors.isEmpty()) {
            throw new InvalidFieldsException(errors);
        }

        chosen.forEach((criterion, level) -> evaluation.score(criterion, level, comments.get(criterion.getId())));
    }

    /** Sin espacios alrededor; vacía es lo mismo que no escribirla. */
    private static String comment(ScoreRequest score) {
        if (score.comment() == null || score.comment().isBlank()) {
            return null;
        }
        return score.comment().strip();
    }

    /** El campo de un criterio, como lo espera la app: {@code scores.<criterio>.<campo>}. */
    private static String field(Integer criterionId, String name) {
        return "scores." + criterionId + "." + name;
    }
}
