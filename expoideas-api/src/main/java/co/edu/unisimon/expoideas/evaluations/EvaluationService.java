package co.edu.unisimon.expoideas.evaluations;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.editions.Track;
import co.edu.unisimon.expoideas.evaluations.EvaluationRequest.ScoreRequest;
import co.edu.unisimon.expoideas.evaluations.ProjectEvaluationsResponse.PendingJuror;
import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.projects.ProjectPolicy;
import co.edu.unisimon.expoideas.users.User;
import java.math.BigDecimal;
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
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final RubricRepository rubricRepository;
    private final EvaluationRepository evaluationRepository;
    private final ProjectPolicy policy;
    private final EvaluatorRule evaluatorRule;

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
        Set<Integer> jurorIds = jurors.stream().map(User::getId).collect(Collectors.toSet());
        // Solo cuentan las de quienes siguen asignados.
        List<Evaluation> counted = evaluationRepository.findByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .filter(evaluation -> jurorIds.contains(evaluation.getJuror().getId()))
                .toList();
        Set<Integer> done = counted.stream()
                .map(evaluation -> evaluation.getJuror().getId())
                .collect(Collectors.toSet());

        Optional<BigDecimal> grade =
                GradeScale.average(counted.stream().map(Evaluation::grade).toList());
        return new ProjectEvaluationsResponse(
                projectId,
                grade.orElse(null),
                grade.map(GradeScale::of).orElse(null),
                jurors.size(),
                counted.stream().map(EvaluationResponse::from).toList(),
                jurors.stream()
                        .filter(juror -> !done.contains(juror.getId()))
                        .map(PendingJuror::from)
                        .toList());
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
