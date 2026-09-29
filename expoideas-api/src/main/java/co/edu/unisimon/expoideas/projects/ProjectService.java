package co.edu.unisimon.expoideas.projects;

import co.edu.unisimon.expoideas.catalogs.CatalogLookup;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.editions.Edition;
import co.edu.unisimon.expoideas.editions.EditionRepository;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import co.edu.unisimon.expoideas.users.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inscripción de proyectos: alta, edición y consulta. El equipo lo maneja
 * {@link ProjectTeamService}.
 *
 * <p>Inscribe un estudiante, que queda como líder del proyecto, y solo mientras
 * la inscripción de esa edición está abierta.
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final EditionRepository editionRepository;
    private final UserRepository userRepository;
    private final CatalogLookup catalogLookup;
    private final ProjectPolicy policy;
    private final ApplicationEventPublisher events;

    /** Los proyectos de esa cuenta, incluidos aquellos a los que la invitaron. */
    @Transactional(readOnly = true)
    public List<ProjectResponse> listMine(String email) {
        User user = policy.account(email);
        LocalDate today = policy.today();
        return projectRepository.findAllOfMember(user.getId()).stream()
                .map(project -> ProjectResponse.from(project, today))
                .toList();
    }

    /**
     * Un proyecto para su equipo, su docente o la gestión.
     *
     * @throws NoSuchElementException si no existe o quien pregunta no puede verlo
     */
    @Transactional(readOnly = true)
    public ProjectResponse get(Integer id, String email) {
        User viewer = policy.account(email);
        return ProjectResponse.from(policy.findVisible(id, viewer), policy.today());
    }

    @Transactional
    public ProjectResponse create(String email, ProjectRequest request) {
        User leader = policy.account(email);
        policy.requireStudent(leader);

        Edition edition = editionRepository
                .findWithTracksById(request.editionId())
                .orElseThrow(() -> new NoSuchElementException("No existe una edición con ID: " + request.editionId()));
        if (edition.track(request.track()).isEmpty()) {
            throw new InvalidFieldsException("track", "Esa cátedra no está configurada en la edición");
        }
        policy.requireRegistrationOpen(edition);
        policy.requireNotOnAnotherTeam(
                edition, request.track(), leader, "Ya tienes un proyecto inscrito en esta cátedra");

        Project project = new Project();
        project.setEdition(edition);
        project.setTrack(request.track());
        apply(project, request);
        project.addMember(leader, MemberRole.LEADER, MembershipStatus.ACCEPTED);

        return ProjectResponse.from(projectRepository.save(project), policy.today());
    }

    /** Solo el líder, y solo mientras la inscripción sigue abierta. La cátedra no cambia. */
    @Transactional
    public ProjectResponse update(Integer id, String email, ProjectRequest request) {
        User actor = policy.account(email);
        Project project = policy.findVisible(id, actor);
        policy.requireLeader(project, actor);
        policy.requireRegistrationOpen(project.getEdition());

        apply(project, request);
        return ProjectResponse.from(projectRepository.save(project), policy.today());
    }

    /**
     * Borra la inscripción con su equipo y sus entregables. Solo el líder y solo
     * con la inscripción abierta.
     */
    @Transactional
    public void delete(Integer id, String email) {
        User actor = policy.account(email);
        Project project = policy.findVisible(id, actor);
        policy.requireLeader(project, actor);
        policy.requireRegistrationOpen(project.getEdition());

        // Los módulos que cuelgan del proyecto se llevan lo suyo antes del borrado.
        events.publishEvent(new ProjectDeletedEvent(project.getId()));
        projectRepository.delete(project);
    }

    /** Lo que sí se puede cambiar después de inscribir. */
    private void apply(Project project, ProjectRequest request) {
        project.setTitle(request.title().strip());
        project.setSummary(request.summary().strip());
        project.setSector(catalogLookup.sector(request.sectorId()));
        project.setTeacher(teacher(request.teacherId()));
    }

    private User teacher(Integer id) {
        return userRepository
                .findById(id)
                .filter(candidate -> candidate.getRole() == Role.TEACHER)
                .orElseThrow(() -> new InvalidFieldsException("teacherId", "Selecciona un docente de la lista"));
    }
}
