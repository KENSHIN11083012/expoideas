package co.edu.unisimon.expoideas.deliverables;

import co.edu.unisimon.expoideas.editions.Track;
import co.edu.unisimon.expoideas.projects.Project;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cuántos entregables obligatorios lleva cada proyecto. Lo usan las vistas de
 * gestión y de los docentes para ver de un vistazo quién va completo.
 *
 * <p>Se resuelve con dos consultas para toda la lista, no una por proyecto.
 */
@Service
@RequiredArgsConstructor
public class DeliverableProgressService {

    /**
     * @param required  entregables obligatorios que pide la cátedra
     * @param delivered de esos, cuántos tienen al menos un archivo
     */
    public record Progress(int required, int delivered) {

        public boolean complete() {
            return delivered >= required;
        }
    }

    private static final Progress NONE = new Progress(0, 0);

    private final DeliverableTypeRepository typeRepository;
    private final DeliverableRepository deliverableRepository;

    /** Progreso de cada proyecto de la lista, por su id. */
    @Transactional(readOnly = true)
    public Map<Integer, Progress> of(Collection<Project> projects) {
        if (projects.isEmpty()) {
            return Map.of();
        }

        Map<String, Integer> requiredByTrack = new HashMap<>();
        typeRepository
                .countRequiredByTrack()
                .forEach(row -> requiredByTrack.put(key(row.getEditionId(), row.getTrack()), row.getTotal()));

        Map<Integer, Integer> deliveredByProject = new HashMap<>();
        List<Integer> ids = projects.stream().map(Project::getId).toList();
        deliverableRepository
                .countRequiredDelivered(ids)
                .forEach(row -> deliveredByProject.put(row.getProjectId(), row.getTotal()));

        Map<Integer, Progress> progress = new HashMap<>();
        for (Project project : projects) {
            int required = requiredByTrack.getOrDefault(key(project.getEdition().getId(), project.getTrack()), 0);
            int delivered = deliveredByProject.getOrDefault(project.getId(), 0);
            progress.put(project.getId(), required == 0 ? NONE : new Progress(required, Math.min(delivered, required)));
        }
        return progress;
    }

    private static String key(Integer editionId, Track track) {
        return editionId + ":" + track;
    }
}
