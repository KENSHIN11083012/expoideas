package co.edu.unisimon.expoideas.deliverables;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.files.FileService;
import co.edu.unisimon.expoideas.files.FileVisibility;
import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.projects.ProjectDeletedEvent;
import co.edu.unisimon.expoideas.projects.ProjectPolicy;
import co.edu.unisimon.expoideas.users.User;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Los archivos que un equipo sube para los entregables de su cátedra.
 *
 * <p>Sube el equipo, no el docente, y solo hasta el cierre de entregas. Los
 * archivos son privados: los abren el equipo, su docente y la gestión (ver
 * {@link DeliverableAccessRule}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeliverableService {

    private final DeliverableRepository deliverableRepository;
    private final DeliverableTypeRepository typeRepository;
    private final FileService fileService;
    private final ProjectPolicy policy;

    /** Los entregables de la cátedra con lo que el proyecto lleva subido. */
    @Transactional(readOnly = true)
    public List<DeliverableGroupResponse> list(Integer projectId, String email) {
        Project project = policy.findVisible(projectId, policy.account(email));
        Map<Integer, List<Deliverable>> byType =
                deliverableRepository.findByProjectIdOrderByUploadedAtAsc(projectId).stream()
                        .collect(Collectors.groupingBy(
                                deliverable -> deliverable.getType().getId(), LinkedHashMap::new, Collectors.toList()));

        return typeRepository
                .findByEditionIdAndTrackOrderBySortOrderAscIdAsc(
                        project.getEdition().getId(), project.getTrack())
                .stream()
                .map(type -> DeliverableGroupResponse.of(type, byType.getOrDefault(type.getId(), List.of())))
                .toList();
    }

    /**
     * Sube un archivo para un entregable.
     *
     * @throws ConflictException      si el plazo cerró o el entregable ya llegó a su tope de archivos
     * @throws InvalidFieldsException si el archivo no cumple el formato o el tamaño
     */
    @Transactional
    public List<DeliverableGroupResponse> upload(Integer projectId, Integer typeId, MultipartFile file, String email) {
        User uploader = policy.account(email);
        Project project = policy.findVisible(projectId, uploader);
        policy.requireTeamMember(project, uploader);
        policy.requireSubmissionOpen(project.getEdition());

        DeliverableType type = typeRepository
                .findById(typeId)
                .filter(candidate -> candidate
                                .getEdition()
                                .getId()
                                .equals(project.getEdition().getId())
                        && candidate.getTrack() == project.getTrack())
                .orElseThrow(() -> new NoSuchElementException("No existe un entregable con ID: " + typeId));

        int uploaded = deliverableRepository.countByProjectIdAndTypeId(projectId, typeId);
        if (uploaded >= type.getMaxFiles()) {
            throw new ConflictException(
                    type.getMaxFiles() == 1
                            ? "\"" + type.getName()
                                    + "\" admite un solo archivo. Quita el que subiste para reemplazarlo"
                            : "\"" + type.getName() + "\" admite hasta " + type.getMaxFiles() + " archivos");
        }

        Deliverable deliverable = new Deliverable();
        deliverable.setProject(project);
        deliverable.setType(type);
        deliverable.setUploadedBy(uploader);
        deliverable.setFile(fileService.store(file, type.getKind().formats(), FileVisibility.PRIVATE, uploader));
        deliverableRepository.save(deliverable);
        log.info("Proyecto {}: archivo subido para el entregable {}", projectId, type.getName());

        return list(projectId, email);
    }

    /** Quita un archivo subido. Lo puede hacer cualquiera del equipo, no solo quien lo subió. */
    @Transactional
    public List<DeliverableGroupResponse> delete(Integer projectId, Integer deliverableId, String email) {
        User actor = policy.account(email);
        Project project = policy.findVisible(projectId, actor);
        policy.requireTeamMember(project, actor);
        policy.requireSubmissionOpen(project.getEdition());

        Deliverable deliverable = deliverableRepository
                .findWithProjectById(deliverableId)
                .filter(candidate -> candidate.getProject().getId().equals(projectId))
                .orElseThrow(() -> new NoSuchElementException("No existe un archivo con ID: " + deliverableId));

        deliverableRepository.delete(deliverable);
        fileService.delete(deliverable.getFile());
        return list(projectId, email);
    }

    /**
     * Al eliminarse una inscripción se van sus archivos: la base los borraría en
     * cascada, pero el contenido en disco quedaría huérfano.
     */
    @EventListener
    @Transactional(propagation = Propagation.MANDATORY)
    public void onProjectDeleted(ProjectDeletedEvent event) {
        List<Deliverable> deliverables = deliverableRepository.findByProjectIdOrderByUploadedAtAsc(event.projectId());
        deliverableRepository.deleteAll(deliverables);
        deliverableRepository.flush();
        deliverables.forEach(deliverable -> fileService.delete(deliverable.getFile()));
    }
}
