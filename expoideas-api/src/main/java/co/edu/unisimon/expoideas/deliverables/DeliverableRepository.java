package co.edu.unisimon.expoideas.deliverables;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliverableRepository extends JpaRepository<Deliverable, Integer> {

    @EntityGraph(attributePaths = {"type", "file", "uploadedBy"})
    List<Deliverable> findByProjectIdOrderByUploadedAtAsc(Integer projectId);

    int countByProjectIdAndTypeId(Integer projectId, Integer typeId);

    /** Si ya hay archivos subidos para ese entregable: entonces no se puede borrar. */
    boolean existsByTypeId(Integer typeId);

    @EntityGraph(attributePaths = {"project", "project.members", "project.members.user", "project.teacher", "file"})
    Optional<Deliverable> findWithProjectById(Integer id);

    /** Para autorizar la descarga: de qué proyecto es el archivo. */
    @EntityGraph(attributePaths = {"project", "project.members", "project.members.user", "project.teacher"})
    Optional<Deliverable> findByFileId(Integer fileId);
}
