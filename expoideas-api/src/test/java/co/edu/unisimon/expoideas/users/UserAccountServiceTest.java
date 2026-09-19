package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.catalogs.AcademicProgram;
import co.edu.unisimon.expoideas.catalogs.AcademicProgramRepository;
import co.edu.unisimon.expoideas.catalogs.Campus;
import co.edu.unisimon.expoideas.catalogs.CampusRepository;
import co.edu.unisimon.expoideas.catalogs.CatalogLookup;
import co.edu.unisimon.expoideas.catalogs.Faculty;
import co.edu.unisimon.expoideas.catalogs.FacultyRepository;
import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.files.FileFormat;
import co.edu.unisimon.expoideas.files.FileService;
import co.edu.unisimon.expoideas.files.FileVisibility;
import co.edu.unisimon.expoideas.files.StoredFile;
import co.edu.unisimon.expoideas.support.TestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceTest {

    private static final String EMAIL = "ana@unisimon.edu.co";

    @Mock
    private UserRepository userRepository;

    @Mock
    private CampusRepository campusRepository;

    @Mock
    private FacultyRepository facultyRepository;

    @Mock
    private AcademicProgramRepository academicProgramRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private FileService fileService;

    private UserAccountService service;

    private final Campus barranquilla = new Campus(1, "Barranquilla");
    private final Faculty engineering = new Faculty(10, "Ingeniería");
    private final Faculty law = new Faculty(20, "Derecho");
    private final AcademicProgram systems = new AcademicProgram(100, "Ingeniería de Sistemas", engineering);

    private User ana;

    @BeforeEach
    void setUp() {
        CatalogLookup lookup = new CatalogLookup(campusRepository, facultyRepository, academicProgramRepository);
        service = new UserAccountService(
                userRepository, new AffiliationResolver(lookup), new PasswordUpdater(passwordEncoder), fileService);

        lenient().when(campusRepository.findById(1)).thenReturn(Optional.of(barranquilla));
        lenient().when(facultyRepository.findById(10)).thenReturn(Optional.of(engineering));
        lenient().when(facultyRepository.findById(20)).thenReturn(Optional.of(law));
        lenient().when(academicProgramRepository.findById(100)).thenReturn(Optional.of(systems));
        lenient().when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hash-nuevo");

        ana = TestData.user(1, EMAIL, Role.STUDENT);
        lenient().when(userRepository.findWithProfileByEmail(EMAIL)).thenReturn(Optional.of(ana));
    }

    @Nested
    class Registration {

        @Test
        void storesAffiliationAsAStudentWithConsent() {
            UserResponse created = service.register(registration(" ana@unisimon.edu.co ", 1, 10, 100));

            assertThat(created.email()).isEqualTo(EMAIL);
            assertThat(created.firstName()).isEqualTo("Ana");
            assertThat(created.role()).isEqualTo(Role.STUDENT);
            assertThat(created.campusId()).isEqualTo(1);
            assertThat(created.faculty()).isEqualTo("Ingeniería");
            assertThat(created.academicProgram()).isEqualTo("Ingeniería de Sistemas");
            assertThat(created.pendingSteps()).isEmpty();
        }

        @Test
        void programIsOptional() {
            UserResponse created = service.register(registration(EMAIL, 1, 20, null));

            assertThat(created.facultyId()).isEqualTo(20);
            assertThat(created.academicProgramId()).isNull();
        }

        @Test
        void programFromAnotherFacultyIsAFieldError() {
            assertThatThrownBy(() -> service.register(registration(EMAIL, 1, 20, 100)))
                    .isInstanceOfSatisfying(InvalidFieldsException.class, ex -> assertThat(ex.getFields())
                            .containsEntry("academicProgramId", "El programa académico no pertenece a la facultad seleccionada."));
            verify(userRepository, never()).save(any());
        }

        @Test
        void missingFacultyIsNotFound() {
            when(facultyRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.register(registration(EMAIL, 1, 99, null)))
                    .isInstanceOf(NoSuchElementException.class);
        }

        @Test
        void takenEmailIsAConflict() {
            when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

            assertThatThrownBy(() -> service.register(registration(EMAIL, 1, 10, null)))
                    .isInstanceOf(ConflictException.class);
        }

        private static RegistrationRequest registration(String email, Integer campus, Integer faculty, Integer program) {
            return new RegistrationRequest(" Ana ", "Pérez", email, TestData.PASSWORD, campus, faculty, program, true);
        }
    }

    @Nested
    class Profile {

        @Test
        void canRemoveTheProgram() {
            ana.setFaculty(engineering);
            ana.setAcademicProgram(systems);

            UserResponse updated = service.updateProfile(EMAIL, new ProfileUpdateRequest(" Ana ", "Pérez", 1, 20, null));

            assertThat(updated.firstName()).isEqualTo("Ana");
            assertThat(updated.faculty()).isEqualTo("Derecho");
            assertThat(updated.academicProgram()).isNull();
        }

        @Test
        void studentMustKeepCampusAndFaculty() {
            assertThatThrownBy(() -> service.updateProfile(EMAIL, new ProfileUpdateRequest("Ana", "Pérez", null, null, null)))
                    .isInstanceOfSatisfying(InvalidFieldsException.class,
                            ex -> assertThat(ex.getFields()).containsOnlyKeys("campusId", "facultyId"));
        }

        @Test
        void adminProfileIgnoresAffiliation() {
            ana.setRole(Role.ADMIN);

            UserResponse updated = service.updateProfile(EMAIL, new ProfileUpdateRequest("Luis", "Gómez", 1, 10, 100));

            assertThat(updated.firstName()).isEqualTo("Luis");
            assertThat(updated.campusId()).isNull();
            assertThat(updated.facultyId()).isNull();
            verifyNoInteractions(campusRepository, facultyRepository, academicProgramRepository);
        }
    }

    @Nested
    class Photo {

        private final MockMultipartFile image = new MockMultipartFile("file", "yo.png", "image/png", TestData.PNG);

        @Test
        void firstPhotoIsStoredAsAPublicImage() {
            when(fileService.store(image, FileFormat.IMAGES, FileVisibility.PUBLIC, ana)).thenReturn(file("nueva"));

            assertThat(service.updatePhoto(EMAIL, image).photoId()).isEqualTo("nueva");
            verify(fileService, never()).delete(any());
        }

        @Test
        void replacingThePhotoDeletesThePreviousOneAfterStoringTheNew() {
            StoredFile previous = file("anterior");
            ana.setPhoto(previous);
            when(fileService.store(any(), any(), any(), any())).thenReturn(file("nueva"));

            assertThat(service.updatePhoto(EMAIL, image).photoId()).isEqualTo("nueva");

            InOrder order = inOrder(fileService);
            order.verify(fileService).store(any(), any(), any(), any());
            order.verify(fileService).delete(previous);
        }

        @Test
        void deletingThePhotoRemovesIt() {
            StoredFile photo = file("actual");
            ana.setPhoto(photo);

            service.deletePhoto(EMAIL);

            assertThat(ana.getPhoto()).isNull();
            verify(fileService).delete(photo);
        }

        @Test
        void deletingWithoutAPhotoDoesNothing() {
            service.deletePhoto(EMAIL);

            verify(fileService, never()).delete(any());
        }

        private static StoredFile file(String uuid) {
            return StoredFile.builder().uuid(uuid).storagePath(uuid + ".png").build();
        }
    }

    @Nested
    class Password {

        @Test
        void changingItClearsTheTemporaryFlag() {
            ana.setMustChangePassword(true);
            when(passwordEncoder.matches("Temporal#2026", "hash-actual")).thenReturn(true);

            service.changePassword(EMAIL, new PasswordChangeRequest("Temporal#2026", "Propia#2026", "Propia#2026"));

            assertThat(ana.isMustChangePassword()).isFalse();
            assertThat(ana.getPasswordHash()).isEqualTo("hash-nuevo");
        }

        @Test
        void wrongCurrentPasswordIsAFieldError() {
            assertThatThrownBy(() -> service.changePassword(EMAIL, new PasswordChangeRequest("Mala#2026", "Nueva#2026", "Nueva#2026")))
                    .isInstanceOfSatisfying(InvalidFieldsException.class, ex -> assertThat(ex.getFields())
                            .containsEntry("currentPassword", "La contraseña actual es incorrecta."));
            assertThat(ana.getPasswordHash()).isEqualTo("hash-actual");
        }

        @Test
        void confirmationMustMatch() {
            when(passwordEncoder.matches("Vieja#2026", "hash-actual")).thenReturn(true);

            assertThatThrownBy(() -> service.changePassword(EMAIL, new PasswordChangeRequest("Vieja#2026", "Nueva#2026", "Otra#2026")))
                    .isInstanceOfSatisfying(InvalidFieldsException.class,
                            ex -> assertThat(ex.getFields()).containsOnlyKeys("confirmPassword"));
        }

        @Test
        void newPasswordMustDifferFromTheCurrentOne() {
            when(passwordEncoder.matches("Igual#2026", "hash-actual")).thenReturn(true);

            assertThatThrownBy(() -> service.changePassword(EMAIL, new PasswordChangeRequest("Igual#2026", "Igual#2026", "Igual#2026")))
                    .isInstanceOfSatisfying(InvalidFieldsException.class,
                            ex -> assertThat(ex.getFields()).containsOnlyKeys("newPassword"));
        }
    }

    @Nested
    class DataConsent {

        @Test
        void isRecordedWithItsDate() {
            ana.setDataConsent(false);

            service.giveDataConsent(EMAIL);

            assertThat(ana.isDataConsent()).isTrue();
            assertThat(ana.getDataConsentAt()).isNotNull();
        }

        @Test
        void givingItAgainKeepsTheOriginalDate() {
            LocalDateTime original = LocalDateTime.of(2026, 9, 1, 10, 0);
            ana.setDataConsentAt(original);

            service.giveDataConsent(EMAIL);

            assertThat(ana.getDataConsentAt()).isEqualTo(original);
        }
    }
}
