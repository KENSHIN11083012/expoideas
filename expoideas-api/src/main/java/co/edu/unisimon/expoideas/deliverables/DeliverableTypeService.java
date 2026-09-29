package co.edu.unisimon.expoideas.deliverables;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.editions.Edition;
import co.edu.unisimon.expoideas.editions.EditionRepository;
import co.edu.unisimon.expoideas.editions.Track;
import java.util.List;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Los entregables que pide cada cátedra. Los escribe MacondoLab; leerlos pide
 * sesión, porque los consulta el equipo al subir sus archivos.
 *
 * <p>Un entregable con archivos subidos no se borra: se perderían las evidencias
 * de los proyectos que ya lo entregaron.
 */
@Service
@RequiredArgsConstructor
public class DeliverableTypeService {

    private final DeliverableTypeRepository typeRepository;
    private final DeliverableRepository deliverableRepository;
    private final EditionRepository editionRepository;

    @Transactional(readOnly = true)
    public List<DeliverableTypeResponse> list(Integer editionId, Track track) {
        return typeRepository.findByEditionIdAndTrackOrderBySortOrderAscIdAsc(editionId, track).stream()
                .map(DeliverableTypeResponse::from)
                .toList();
    }

    @Transactional
    public DeliverableTypeResponse create(DeliverableTypeRequest request) {
        Edition edition = editionRepository
                .findWithTracksById(request.editionId())
                .orElseThrow(() -> new NoSuchElementException("No existe una edición con ID: " + request.editionId()));
        if (edition.track(request.track()).isEmpty()) {
            throw new InvalidFieldsException("track", "Esa cátedra no está configurada en la edición");
        }

        DeliverableType type = new DeliverableType();
        type.setEdition(edition);
        type.setTrack(request.track());
        return save(type, request);
    }

    /** La edición y la cátedra no cambian; el resto sí. */
    @Transactional
    public DeliverableTypeResponse update(Integer id, DeliverableTypeRequest request) {
        return save(find(id), request);
    }

    /** @throws ConflictException si algún proyecto ya subió archivos para ese entregable */
    @Transactional
    public void delete(Integer id) {
        DeliverableType type = find(id);
        if (deliverableRepository.existsByTypeId(id)) {
            throw new ConflictException(
                    "No puedes eliminar \"" + type.getName() + "\": ya hay proyectos que lo entregaron");
        }
        typeRepository.delete(type);
    }

    private DeliverableType find(Integer id) {
        return typeRepository
                .findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un entregable con ID: " + id));
    }

    private DeliverableTypeResponse save(DeliverableType type, DeliverableTypeRequest request) {
        type.setName(request.name().strip());
        type.setDescription(
                request.description() == null ? null : request.description().strip());
        type.setKind(request.kind());
        type.setRequired(request.required());
        type.setMaxFiles(request.maxFiles());
        type.setSortOrder(request.sortOrder());
        // saveAndFlush: un nombre repetido en la misma cátedra falla aquí, con 409.
        return DeliverableTypeResponse.from(typeRepository.saveAndFlush(type));
    }
}
