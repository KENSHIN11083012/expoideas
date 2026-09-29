package co.edu.unisimon.expoideas.deliverables;

import co.edu.unisimon.expoideas.files.PrivateFileAccessRule;
import co.edu.unisimon.expoideas.files.StoredFile;
import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.users.User;
import co.edu.unisimon.expoideas.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Los entregables son archivos privados: los abre el equipo del proyecto y su
 * docente. La gestión ya tiene permiso por su rol y el propietario, por serlo.
 *
 * <p>Los jurados se sumarán en la fase de evaluación, con los proyectos que les
 * toquen.
 */
@Component
@RequiredArgsConstructor
class DeliverableAccessRule implements PrivateFileAccessRule {

    private final DeliverableRepository deliverableRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean canRead(StoredFile file, String email) {
        return deliverableRepository
                .findByFileId(file.getId())
                .map(Deliverable::getProject)
                .flatMap(project -> userRepository.findByEmail(email).map(viewer -> belongsTo(project, viewer)))
                .orElse(false);
    }

    private static boolean belongsTo(Project project, User viewer) {
        return project.memberOf(viewer).isPresent()
                || project.getTeacher().getId().equals(viewer.getId());
    }
}
