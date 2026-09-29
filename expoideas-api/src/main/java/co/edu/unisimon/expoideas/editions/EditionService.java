package co.edu.unisimon.expoideas.editions;

import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import java.time.Clock;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Alta, edición y consulta de las ediciones de la Expo. Las escribe MacondoLab;
 * leerlas es público, porque la portada anuncia cuándo abren las inscripciones.
 *
 * <p>Las reglas que cruzan campos se verifican aquí y salen como 400 con el
 * mensaje puesto en el campo que lo causó. Un nombre repetido choca con la
 * restricción única de la BD y GlobalExceptionHandler lo responde con 409.
 */
@Service
@RequiredArgsConstructor
public class EditionService {

    private final EditionRepository editionRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<EditionResponse> list() {
        LocalDate today = today();
        return editionRepository.findAllByOrderByRegistrationOpensOnDesc().stream()
                .map(edition -> EditionResponse.from(edition, today))
                .toList();
    }

    /** @throws NoSuchElementException si el id no existe */
    @Transactional(readOnly = true)
    public EditionResponse get(Integer id) {
        return EditionResponse.from(find(id), today());
    }

    @Transactional
    public EditionResponse create(EditionRequest request) {
        return save(new Edition(), request);
    }

    /** @throws NoSuchElementException si el id no existe */
    @Transactional
    public EditionResponse update(Integer id, EditionRequest request) {
        return save(find(id), request);
    }

    private Edition find(Integer id) {
        return editionRepository
                .findWithTracksById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe una edición con ID: " + id));
    }

    private EditionResponse save(Edition edition, EditionRequest request) {
        validateDates(request);
        Map<Track, TrackSettingsRequest> tracks = validateTracks(request);
        validateNoOverlap(edition, request);

        edition.setName(request.name().strip());
        edition.setRegistrationOpensOn(request.registrationOpensOn());
        edition.setRegistrationClosesOn(request.registrationClosesOn());
        edition.setSubmissionClosesOn(request.submissionClosesOn());
        tracks.forEach(
                (track, settings) -> edition.setTrackSettings(track, settings.minMembers(), settings.maxMembers()));

        // saveAndFlush: un nombre repetido falla aquí, como DataIntegrityViolationException (409).
        return EditionResponse.from(editionRepository.saveAndFlush(edition), today());
    }

    private static void validateDates(EditionRequest request) {
        if (request.registrationClosesOn().isBefore(request.registrationOpensOn())) {
            throw new InvalidFieldsException(
                    "registrationClosesOn", "Las inscripciones no pueden cerrar antes de abrir");
        }
        if (request.submissionClosesOn().isBefore(request.registrationClosesOn())) {
            throw new InvalidFieldsException(
                    "submissionClosesOn", "Las entregas no pueden cerrar antes que las inscripciones");
        }
    }

    /** Las dos cátedras, cada una una sola vez y con el mínimo por debajo del máximo. */
    private static Map<Track, TrackSettingsRequest> validateTracks(EditionRequest request) {
        Map<Track, TrackSettingsRequest> tracks = new EnumMap<>(Track.class);
        for (TrackSettingsRequest settings : request.tracks()) {
            if (settings.track() == null) {
                continue; // Lo rechaza @NotNull antes de llegar aquí.
            }
            if (tracks.put(settings.track(), settings) != null) {
                throw new InvalidFieldsException("tracks", "Cada cátedra se configura una sola vez");
            }
            if (settings.minMembers() != null
                    && settings.maxMembers() != null
                    && settings.maxMembers() < settings.minMembers()) {
                throw new InvalidFieldsException("tracks", "El máximo de integrantes no puede ser menor que el mínimo");
            }
        }
        if (!tracks.keySet().containsAll(List.of(Track.values()))) {
            throw new InvalidFieldsException("tracks", "Configura las dos cátedras: INNPRENDE I e INNPRENDE II");
        }
        return tracks;
    }

    /**
     * Dos ediciones no pueden estar vivas a la vez: si se cruzaran, un proyecto
     * no sabría a cuál se inscribe.
     */
    private void validateNoOverlap(Edition edition, EditionRequest request) {
        Edition candidate = new Edition();
        candidate.setRegistrationOpensOn(request.registrationOpensOn());
        candidate.setSubmissionClosesOn(request.submissionClosesOn());

        editionRepository.findAllByOrderByRegistrationOpensOnDesc().stream()
                .filter(other -> !Objects.equals(other.getId(), edition.getId()))
                .filter(candidate::overlaps)
                .findFirst()
                .ifPresent(other -> {
                    throw new InvalidFieldsException(
                            "registrationOpensOn", "Estas fechas se cruzan con la edición " + other.getName());
                });
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }
}
