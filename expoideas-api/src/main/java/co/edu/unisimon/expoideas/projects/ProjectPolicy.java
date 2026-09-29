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
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Quién puede hacer qué con un proyecto y cuándo. Lo comparten
 * {@link ProjectService} y {@link ProjectTeamService}.
 *
 * <p>A quien no puede ver un proyecto se le responde como si no existiera, igual
 * que con los archivos privados: así nadie averigua qué identificadores valen.
 */
@Component
@RequiredArgsConstructor
class ProjectPolicy {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final Clock clock;

    LocalDate today() {
        return LocalDate.now(clock);
    }

    /** La cuenta de quien hace la petición. */
    User account(String email) {
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("No existe una cuenta con el correo: " + email));
    }

    /** El proyecto con su equipo, o 404. */
    Project find(Integer id) {
        return projectRepository
                .findWithTeamById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un proyecto con ID: " + id));
    }

    /** El proyecto, si esa cuenta puede verlo; si no, como si no existiera. */
    Project findVisible(Integer id, User viewer) {
        Project project = find(id);
        boolean allowed = project.memberOf(viewer).isPresent()
                || project.getTeacher().getId().equals(viewer.getId())
                || viewer.getRole().isManagement();
        if (!allowed) {
            throw new NoSuchElementException("No existe un proyecto con ID: " + id);
        }
        return project;
    }

    void requireStudent(User user) {
        if (user.getRole() != Role.STUDENT) {
            throw new ForbiddenActionException("Solo los estudiantes inscriben proyectos");
        }
    }

    /** @throws ForbiddenActionException si no es el líder del proyecto */
    ProjectMember requireLeader(Project project, User user) {
        return project.memberOf(user)
                .filter(ProjectMember::isLeader)
                .orElseThrow(() -> new ForbiddenActionException("Solo el líder del proyecto puede hacer esto"));
    }

    /**
     * El equipo y los datos del proyecto solo se mueven mientras la inscripción
     * está abierta; después queda fijo para la evaluación.
     */
    void requireRegistrationOpen(Edition edition) {
        if (!edition.isRegistrationOpenOn(today())) {
            throw new ConflictException("Las inscripciones de " + edition.getName() + " no están abiertas");
        }
    }

    /** Cada estudiante está en un solo proyecto por cátedra en cada edición. */
    void requireNotOnAnotherTeam(Edition edition, Track track, User user, String message) {
        if (projectRepository.isAlreadyOnATeam(edition.getId(), track, user.getId())) {
            throw new ConflictException(message);
        }
    }

    /** Una invitación sin responder ya reserva su lugar en el equipo. */
    void requireFreeSeat(Project project) {
        int maxMembers = project.trackSettings().getMaxMembers();
        if (project.occupiedSeats() >= maxMembers) {
            throw new ConflictException("El equipo ya tiene el máximo de " + maxMembers + " integrantes");
        }
    }
}
