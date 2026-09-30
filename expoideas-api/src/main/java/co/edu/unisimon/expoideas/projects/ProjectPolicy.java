package co.edu.unisimon.expoideas.projects;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.editions.Edition;
import co.edu.unisimon.expoideas.editions.Track;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import co.edu.unisimon.expoideas.users.UserRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Quién puede hacer qué con un proyecto y cuándo. Lo comparten {@link ProjectService},
 * {@link ProjectTeamService} y el módulo de entregables.
 *
 * <p>A quien no puede ver un proyecto se le responde como si no existiera, igual
 * que con los archivos privados: así nadie averigua qué identificadores valen.
 */
@Component
@RequiredArgsConstructor
public class ProjectPolicy {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TrackApprovalRepository approvalRepository;
    private final Clock clock;

    /** Quién más puede ver un proyecto, según otros módulos (los jurados asignados). Puede estar vacía. */
    private final List<ProjectVisibilityRule> visibilityRules;

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    /** La cuenta de quien hace la petición. */
    public User account(String email) {
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("No existe una cuenta con el correo: " + email));
    }

    /** El proyecto con su equipo, o 404. */
    public Project find(Integer id) {
        return projectRepository
                .findWithTeamById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un proyecto con ID: " + id));
    }

    /** El proyecto, si esa cuenta puede verlo; si no, como si no existiera. */
    public Project findVisible(Integer id, User viewer) {
        Project project = find(id);
        if (!canView(project, viewer)) {
            throw new NoSuchElementException("No existe un proyecto con ID: " + id);
        }
        return project;
    }

    /** Si esa cuenta ve el proyecto: el equipo, el profesor del grupo, la gestión y quien digan las reglas. */
    public boolean canView(Project project, User viewer) {
        return project.memberOf(viewer).isPresent()
                || project.getTeacher().getId().equals(viewer.getId())
                || viewer.getRole().isManagement()
                || visibilityRules.stream().anyMatch(rule -> rule.canView(project, viewer));
    }

    public void requireStudent(User user) {
        if (user.getRole() != Role.STUDENT) {
            throw new ForbiddenActionException("Solo los estudiantes inscriben proyectos");
        }
    }

    /** @throws ForbiddenActionException si no es el líder del proyecto */
    public ProjectMember requireLeader(Project project, User user) {
        return project.memberOf(user)
                .filter(ProjectMember::isLeader)
                .orElseThrow(() -> new ForbiddenActionException("Solo el líder del proyecto puede hacer esto"));
    }

    /**
     * El equipo y los datos del proyecto solo se mueven mientras la inscripción
     * está abierta; después queda fijo para la evaluación.
     */
    public void requireRegistrationOpen(Edition edition) {
        if (!edition.isRegistrationOpenOn(today())) {
            throw new ConflictException("Las inscripciones de " + edition.getName() + " no están abiertas");
        }
    }

    /**
     * Quien sube o quita entregables tiene que estar en el equipo de verdad: una
     * invitación sin responder no basta.
     *
     * @throws ForbiddenActionException si no es integrante aceptado
     */
    public ProjectMember requireTeamMember(Project project, User user) {
        return project.memberOf(user)
                .filter(ProjectMember::isAccepted)
                .orElseThrow(() -> new ForbiddenActionException("Solo el equipo del proyecto puede hacer esto"));
    }

    /** Los entregables se suben hasta el cierre de entregas de la edición. */
    public void requireSubmissionOpen(Edition edition) {
        if (!edition.isSubmissionOpenOn(today())) {
            throw new ConflictException("El plazo de entregas de " + edition.getName() + " ya cerró");
        }
    }

    /**
     * Igual, pero un entregable puede tener su propio cierre (las fotos de la
     * sustentación se suben después del cierre general). Si {@code closesOn} es
     * null, vale el de la edición.
     */
    public void requireSubmissionOpen(Edition edition, LocalDate closesOn) {
        if (closesOn == null) {
            requireSubmissionOpen(edition);
            return;
        }
        LocalDate today = today();
        if (today.isBefore(edition.getRegistrationOpensOn()) || today.isAfter(closesOn)) {
            throw new ConflictException("El plazo de este entregable cerró el " + closesOn);
        }
    }

    /** Cada estudiante está en un solo proyecto por cátedra en cada edición. */
    public void requireNotOnAnotherTeam(Edition edition, Track track, User user, String message) {
        if (projectRepository.isAlreadyOnATeam(edition.getId(), track, user.getId())) {
            throw new ConflictException(message);
        }
    }

    /**
     * Si esa persona puede entrar en un proyecto de esa cátedra en esa edición:
     * nadie cursa INNPRENDE I y II a la vez, y en II hay que haber aprobado I.
     *
     * @throws ConflictException        si ya está aceptada en un proyecto de la otra cátedra
     * @throws ForbiddenActionException si le falta la aprobación de la cátedra anterior
     */
    public void requireEligibleFor(User user, Edition edition, Track track) {
        if (projectRepository.isOnATeamOfAnotherTrack(edition.getId(), track, user.getId())) {
            throw new ConflictException("No se puede estar en INNPRENDE I y en INNPRENDE II en la misma edición");
        }
        if (track == Track.INNPRENDE_II
                && !approvalRepository.existsByUserIdAndTrack(user.getId(), Track.INNPRENDE_I)) {
            throw new ForbiddenActionException("Para inscribirse en INNPRENDE II hay que haber aprobado INNPRENDE I");
        }
    }

    /** El resultado se pone cuando ya no entran más entregas. */
    public void requireSubmissionClosed(Edition edition) {
        if (!today().isAfter(edition.getSubmissionClosesOn())) {
            throw new ConflictException("El resultado se registra después del cierre de entregas ("
                    + edition.getSubmissionClosesOn() + ")");
        }
    }

    /** @throws ForbiddenActionException si no es el profesor del grupo ni de la gestión */
    public void requireTeacherOrManagement(Project project, User user) {
        boolean allowed = project.getTeacher().getId().equals(user.getId())
                || user.getRole().isManagement();
        if (!allowed) {
            throw new ForbiddenActionException("Solo el profesor del grupo o la gestión registran el resultado");
        }
    }

    /** Una invitación sin responder ya reserva su lugar en el equipo. */
    public void requireFreeSeat(Project project) {
        int maxMembers = project.trackSettings().getMaxMembers();
        if (project.occupiedSeats() >= maxMembers) {
            throw new ConflictException("El equipo ya tiene el máximo de " + maxMembers + " integrantes");
        }
    }
}
