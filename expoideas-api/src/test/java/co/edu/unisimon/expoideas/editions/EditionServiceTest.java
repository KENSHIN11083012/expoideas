package co.edu.unisimon.expoideas.editions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.support.TestData;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import co.edu.unisimon.expoideas.users.UserRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Reglas de las ediciones: orden de las fechas, las dos cátedras y sin cruces. */
@ExtendWith(MockitoExtension.class)
class EditionServiceTest {

    /** Hoy, para todas las pruebas: en plena inscripción de la edición de ejemplo. */
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 5);

    private static final LocalDate OPENS = LocalDate.of(2026, 11, 3);
    private static final LocalDate REGISTRATION_CLOSES = LocalDate.of(2026, 11, 14);
    private static final LocalDate SUBMISSION_CLOSES = LocalDate.of(2026, 11, 28);

    @Mock
    private EditionRepository editionRepository;

    @Mock
    private UserRepository userRepository;

    private EditionService service;

    @BeforeEach
    void createService() {
        Clock clock = Clock.fixed(TODAY.atStartOfDay(ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
        service = new EditionService(editionRepository, userRepository, clock);
    }

    // ── Alta ────────────────────────────────────────────────────────────────

    @Test
    void createsAnEditionWithBothTracks() {
        when(editionRepository.findAllByOrderByRegistrationOpensOnDesc()).thenReturn(List.of());
        when(editionRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));

        EditionResponse created = service.create(request(3, 5));

        assertThat(created.name()).isEqualTo("Expoideas 2026-2");
        assertThat(created.registrationOpen()).isTrue();
        assertThat(created.submissionOpen()).isTrue();
        assertThat(created.tracks())
                .containsExactlyInAnyOrder(
                        new TrackSettingsResponse(Track.INNPRENDE_I, 3, 5, null),
                        new TrackSettingsResponse(Track.INNPRENDE_II, 3, 5, null));
    }

    @Test
    void theNameIsTrimmed() {
        when(editionRepository.findAllByOrderByRegistrationOpensOnDesc()).thenReturn(List.of());
        when(editionRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));

        EditionResponse created = service.create(new EditionRequest(
                "  Expoideas 2026-2  ", OPENS, REGISTRATION_CLOSES, SUBMISSION_CLOSES, tracks(2, 4)));

        assertThat(created.name()).isEqualTo("Expoideas 2026-2");
    }

    @Test
    void anEditionThatEndedIsClosed() {
        when(editionRepository.findAllByOrderByRegistrationOpensOnDesc()).thenReturn(List.of());
        when(editionRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));

        EditionResponse created = service.create(new EditionRequest(
                "Expoideas 2026-1",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 30),
                LocalDate.of(2026, 5, 30),
                tracks(2, 4)));

        assertThat(created.registrationOpen()).isFalse();
        assertThat(created.submissionOpen()).isFalse();
    }

    @Test
    void whileOnlySubmissionsAreOpenRegistrationIsClosed() {
        when(editionRepository.findAllByOrderByRegistrationOpensOnDesc()).thenReturn(List.of());
        when(editionRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));

        EditionResponse created = service.create(new EditionRequest(
                "Expoideas 2026-2",
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31), // La inscripción cerró antes de hoy.
                SUBMISSION_CLOSES,
                tracks(2, 4)));

        assertThat(created.registrationOpen()).isFalse();
        assertThat(created.submissionOpen()).isTrue();
    }

    // ── Validaciones ────────────────────────────────────────────────────────

    @Test
    void registrationCannotCloseBeforeItOpens() {
        EditionRequest request =
                new EditionRequest("Expoideas", OPENS, OPENS.minusDays(1), SUBMISSION_CLOSES, tracks(2, 4));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(InvalidFieldsException.class)
                .hasMessageContaining("registrationClosesOn");

        verify(editionRepository, never()).saveAndFlush(any());
    }

    @Test
    void submissionsCannotCloseBeforeRegistration() {
        EditionRequest request = new EditionRequest(
                "Expoideas", OPENS, REGISTRATION_CLOSES, REGISTRATION_CLOSES.minusDays(1), tracks(2, 4));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(InvalidFieldsException.class)
                .hasMessageContaining("submissionClosesOn");
    }

    @Test
    void bothTracksAreRequired() {
        EditionRequest request = new EditionRequest(
                "Expoideas",
                OPENS,
                REGISTRATION_CLOSES,
                SUBMISSION_CLOSES,
                List.of(new TrackSettingsRequest(Track.INNPRENDE_I, 2, 4)));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(InvalidFieldsException.class)
                .hasMessageContaining("Configura las dos cátedras");
    }

    @Test
    void aTrackCannotBeConfiguredTwice() {
        EditionRequest request = new EditionRequest(
                "Expoideas",
                OPENS,
                REGISTRATION_CLOSES,
                SUBMISSION_CLOSES,
                List.of(
                        new TrackSettingsRequest(Track.INNPRENDE_I, 2, 4),
                        new TrackSettingsRequest(Track.INNPRENDE_I, 3, 6)));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(InvalidFieldsException.class)
                .hasMessageContaining("una sola vez");
    }

    @Test
    void theMaximumCannotBeBelowTheMinimum() {
        EditionRequest request = new EditionRequest(
                "Expoideas",
                OPENS,
                REGISTRATION_CLOSES,
                SUBMISSION_CLOSES,
                List.of(
                        new TrackSettingsRequest(Track.INNPRENDE_I, 5, 2),
                        new TrackSettingsRequest(Track.INNPRENDE_II, 2, 4)));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(InvalidFieldsException.class)
                .hasMessageContaining("no puede ser menor que el mínimo");
    }

    @Test
    void twoEditionsCannotOverlap() {
        when(editionRepository.findAllByOrderByRegistrationOpensOnDesc())
                .thenReturn(List.of(existing(7, "Expoideas 2026-1", OPENS.minusDays(10), OPENS.plusDays(5))));

        assertThatThrownBy(() -> service.create(request(2, 4)))
                .isInstanceOf(InvalidFieldsException.class)
                .hasMessageContaining("Expoideas 2026-1");

        verify(editionRepository, never()).saveAndFlush(any());
    }

    @Test
    void anEditionDoesNotOverlapWithItself() {
        Edition existing = existing(7, "Expoideas 2026-2", OPENS, SUBMISSION_CLOSES);
        when(editionRepository.findWithTracksById(7)).thenReturn(Optional.of(existing));
        when(editionRepository.findAllByOrderByRegistrationOpensOnDesc()).thenReturn(List.of(existing));
        when(editionRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));

        EditionResponse updated = service.update(7, request(2, 6));

        assertThat(updated.id()).isEqualTo(7);
        assertThat(updated.tracks())
                .allSatisfy(track -> assertThat(track.maxMembers()).isEqualTo(6));
    }

    @Test
    void editingAnEditionThatDoesNotExistIs404() {
        when(editionRepository.findWithTracksById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99, request(2, 4)))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("99");
    }

    // ── Datos de apoyo ──────────────────────────────────────────────────────

    private static EditionRequest request(int minMembers, int maxMembers) {
        return new EditionRequest(
                "Expoideas 2026-2", OPENS, REGISTRATION_CLOSES, SUBMISSION_CLOSES, tracks(minMembers, maxMembers));
    }

    private static List<TrackSettingsRequest> tracks(int minMembers, int maxMembers) {
        return List.of(
                new TrackSettingsRequest(Track.INNPRENDE_I, minMembers, maxMembers),
                new TrackSettingsRequest(Track.INNPRENDE_II, minMembers, maxMembers));
    }

    /** Una edición ya guardada, con sus dos cátedras. */
    private static Edition existing(int id, String name, LocalDate opens, LocalDate submissionCloses) {
        Edition edition = new Edition();
        edition.setId(id);
        edition.setName(name);
        edition.setRegistrationOpensOn(opens);
        edition.setRegistrationClosesOn(submissionCloses.minusDays(7));
        edition.setSubmissionClosesOn(submissionCloses);
        edition.setTrackSettings(Track.INNPRENDE_I, 2, 4);
        edition.setTrackSettings(Track.INNPRENDE_II, 2, 4);
        return edition;
    }

    @Test
    void managementPublishesAndHidesTheGradesOfATrack() {
        Edition edition = existing(7, "Expoideas 2026-2", OPENS, SUBMISSION_CLOSES);
        User coordination = TestData.user(1, "coordinacion@unisimon.edu.co", Role.MACONDOLAB);
        when(editionRepository.findWithTracksById(7)).thenReturn(Optional.of(edition));
        when(userRepository.findByEmail("coordinacion@unisimon.edu.co")).thenReturn(Optional.of(coordination));

        EditionResponse published = service.publishGrades(7, Track.INNPRENDE_I, "coordinacion@unisimon.edu.co");

        assertThat(published.tracks())
                .filteredOn(track -> track.track() == Track.INNPRENDE_I)
                .singleElement()
                .satisfies(track -> assertThat(track.gradesPublishedAt()).isEqualTo(TODAY.atStartOfDay()));
        assertThat(published.tracks())
                .filteredOn(track -> track.track() == Track.INNPRENDE_II)
                .singleElement()
                .satisfies(track -> assertThat(track.gradesPublishedAt()).isNull());
        assertThat(edition.track(Track.INNPRENDE_I).orElseThrow().getGradesPublishedBy())
                .isSameAs(coordination);

        EditionResponse hidden = service.hideGrades(7, Track.INNPRENDE_I);

        assertThat(hidden.tracks())
                .allSatisfy(track -> assertThat(track.gradesPublishedAt()).isNull());
    }

    /** Los dos extremos de cada plazo cuentan: el último día todavía se puede. */
    @Test
    void theLastDayOfEachWindowStillCounts() {
        Edition edition = existing(1, "Expoideas", OPENS, SUBMISSION_CLOSES);
        assertThat(edition.isRegistrationOpenOn(TODAY)).isTrue();
        assertThat(edition.isRegistrationOpenOn(OPENS.minusDays(1))).isFalse();
        assertThat(edition.isSubmissionOpenOn(SUBMISSION_CLOSES)).isTrue();
        assertThat(edition.isSubmissionOpenOn(SUBMISSION_CLOSES.plusDays(1))).isFalse();
    }
}
