package co.edu.unisimon.expoideas.reports;

import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.deliverables.DeliverableProgressService;
import co.edu.unisimon.expoideas.deliverables.DeliverableProgressService.Progress;
import co.edu.unisimon.expoideas.editions.Track;
import co.edu.unisimon.expoideas.evaluations.EvaluationService;
import co.edu.unisimon.expoideas.evaluations.ProjectGrade;
import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.projects.ProjectPolicy;
import co.edu.unisimon.expoideas.projects.ProjectRepository;
import co.edu.unisimon.expoideas.projects.ProjectResult;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * El directorio de proyectos inscritos, para la gestión y para los docentes.
 *
 * <p>MacondoLab y el administrador ven todos y filtran como quieran; un docente
 * ve solo los proyectos que lo nombraron, sin importar qué pida. Los estudiantes
 * tienen su propia vista (/api/v1/projects/mine).
 */
@Service
@RequiredArgsConstructor
public class ProjectDirectoryService {

    private final ProjectRepository projectRepository;
    private final DeliverableProgressService progressService;
    private final EvaluationService evaluationService;
    private final ProjectPolicy policy;

    @Transactional(readOnly = true)
    public List<ProjectSummaryResponse> list(String email, ProjectFilter filter) {
        List<Project> projects = find(email, filter);
        Map<Integer, Progress> progress = progressService.of(projects);
        Map<Integer, ProjectGrade> grades = evaluationService.gradesOf(projects);
        return projects.stream()
                .map(project -> ProjectSummaryResponse.of(
                        project,
                        progress.getOrDefault(project.getId(), new Progress(0, 0)),
                        grades.getOrDefault(project.getId(), ProjectGrade.NONE)))
                .toList();
    }

    /** Los mismos proyectos del listado, en CSV, para trabajarlos en una hoja de cálculo. */
    @Transactional(readOnly = true)
    public String export(String email, ProjectFilter filter) {
        return ProjectCsv.of(list(email, filter));
    }

    /** Nombre del archivo exportado, con la fecha de hoy en Colombia. */
    public String exportFilename() {
        return "proyectos-" + policy.today() + ".csv";
    }

    private List<Project> find(String email, ProjectFilter filter) {
        User viewer = policy.account(email);
        Integer teacherId = filter.teacherId();

        if (viewer.getRole() == Role.TEACHER) {
            // Un docente ve los suyos, pida lo que pida.
            teacherId = viewer.getId();
        } else if (!viewer.getRole().isManagement()) {
            throw new ForbiddenActionException("Esta vista es de la gestión y de los profesores");
        }

        return projectRepository.search(
                filter.editionId(),
                filter.track(),
                teacherId,
                filter.sectorId(),
                filter.result(),
                blankToNull(filter.search()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    /** Filtros del listado; cualquiera puede venir vacío. */
    public record ProjectFilter(
            Integer editionId, Track track, Integer teacherId, Integer sectorId, ProjectResult result, String search) {}
}
