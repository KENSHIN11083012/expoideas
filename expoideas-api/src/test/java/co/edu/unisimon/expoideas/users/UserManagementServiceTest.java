package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.catalogs.AcademicProgram;
import co.edu.unisimon.expoideas.catalogs.AcademicProgramRepository;
import co.edu.unisimon.expoideas.catalogs.Campus;
import co.edu.unisimon.expoideas.catalogs.CampusRepository;
import co.edu.unisimon.expoideas.catalogs.CatalogLookup;
import co.edu.unisimon.expoideas.catalogs.Faculty;
import co.edu.unisimon.expoideas.catalogs.FacultyRepository;
import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.files.FileService;
import co.edu.unisimon.expoideas.files.StoredFile;
import co.edu.unisimon.expoideas.support.TestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static co.edu.unisimon.expoideas.users.OnboardingStep.CHANGE_PASSWORD;
import static co.edu.unisimon.expoideas.users.OnboardingStep.DATA_CONSENT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    private static final String ADMIN_EMAIL = "luis@unisimon.edu.co";
    private static final String MACONDOLAB_EMAIL = "coordinacion@unisimon.edu.co";

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

    private UserManagementService service;

    private final Faculty engineering = new Faculty(10, "Ingeniería");
    private final Faculty law = new Faculty(20, "Derecho");

    private User admin;
    private User student;

    @BeforeEach
    void setUp() {
        CatalogLookup lookup = new CatalogLookup(campusRepository, facultyRepository, academicProgramRepository);
        service = new UserManagementService(
                userRepository, new AffiliationResolver(lookup), new PasswordUpdater(passwordEncoder), fileService);

        admin = TestData.user(1, ADMIN_EMAIL, Role.ADMIN);
        User macondolab = TestData.user(2, MACONDOLAB_EMAIL, Role.MACONDOLAB);
        student = TestData.user(3, "ana@unisimon.edu.co", Role.STUDENT);
        for (User user : new User[] {admin, macondolab, student}) {
            lenient().when(userRepository.findWithProfileByEmail(user.getEmail())).thenReturn(Optional.of(user));
            lenient().when(userRepository.findWithProfileById(user.getId())).thenReturn(Optional.of(user));
        }
        lenient().when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hash-nuevo");
        lenient().when(campusRepository.findById(1)).thenReturn(Optional.of(new Campus(1, "Barranquilla")));
        lenient().when(facultyRepository.findById(10)).thenReturn(Optional.of(engineering));
        lenient().when(facultyRepository.findById(20)).thenReturn(Optional.of(law));
        lenient().when(academicProgramRepository.findById(100))
                .thenReturn(Optional.of(new AcademicProgram(100, "Ingeniería de Sistemas", engineering)));
    }

    @Nested
    class Roles {

        @Test
        void macondoLabMakesAStudentAJudge() {
            assertThat(service.update(MACONDOLAB_EMAIL, 3, withRole(Role.JUDGE)).role()).isEqualTo(Role.JUDGE);
        }

        @Test
        void macondoLabCannotModifyAnAdmin() {
            assertThatThrownBy(() -> service.update(MACONDOLAB_EMAIL, 1, withRole(Role.ADMIN)))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessageContaining("Solo un administrador puede modificar");
        }

        @Test
        void macondoLabCannotGrantManagementRoles() {
            assertThatThrownBy(() -> service.update(MACONDOLAB_EMAIL, 3, withRole(Role.MACONDOLAB)))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessageContaining("Solo un administrador puede asignar");
            assertThat(student.getRole()).isEqualTo(Role.STUDENT);
        }

        @Test
        void adminGrantsMacondoLab() {
            assertThat(service.update(ADMIN_EMAIL, 3, withRole(Role.MACONDOLAB)).role()).isEqualTo(Role.MACONDOLAB);
        }

        @Test
        void nobodyChangesTheirOwnRole() {
            assertThatThrownBy(() -> service.update(ADMIN_EMAIL, 1, withRole(Role.STUDENT)))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessage("No puedes cambiar tu propio rol.");
        }

        @Test
        void sendingTheSameRoleIsNotAChange() {
            assertThat(service.update(ADMIN_EMAIL, 1, withRole(Role.ADMIN)).role()).isEqualTo(Role.ADMIN);
        }
    }

    @Nested
    class Affiliation {

        @Test
        void rolesWithoutAffiliationDoNotTakeOne() {
            assertThatThrownBy(() -> service.update(ADMIN_EMAIL, 1, affiliation(null, 10, null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("no lleva adscripción");
        }

        @Test
        void onlyAProgramTakesTheFacultyFromIt() {
            UserResponse updated = service.update(ADMIN_EMAIL, 3, affiliation(null, null, 100));

            assertThat(updated.facultyId()).isEqualTo(10);
            assertThat(updated.academicProgramId()).isEqualTo(100);
        }

        @Test
        void aFacultyReplacesTheWholeAffiliation() {
            student.setFaculty(engineering);

            UserResponse updated = service.update(ADMIN_EMAIL, 3, affiliation(1, 20, null));

            assertThat(updated.campus()).isEqualTo("Barranquilla");
            assertThat(updated.faculty()).isEqualTo("Derecho");
            assertThat(updated.academicProgram()).isNull();
        }

        private static UserUpdateRequest affiliation(Integer campus, Integer faculty, Integer program) {
            return new UserUpdateRequest(null, campus, faculty, program);
        }
    }

    @Nested
    class Creation {

        @Test
        void externalJudgeMayUseAPersonalEmailAndHasNoAffiliation() {
            UserResponse created = service.create(MACONDOLAB_EMAIL, newAccount("marta@empresa.com", Role.JUDGE, null, null));

            assertThat(created.email()).isEqualTo("marta@empresa.com");
            assertThat(created.role()).isEqualTo(Role.JUDGE);
            assertThat(created.facultyId()).isNull();
        }

        @Test
        void startsWithATemporaryPasswordAndWithoutConsent() {
            UserResponse created = service.create(ADMIN_EMAIL, newAccount("pedro@consultora.co", Role.JUDGE, null, null));

            assertThat(created.pendingSteps()).containsExactly(CHANGE_PASSWORD, DATA_CONSENT);
        }

        @Test
        void studentRequiresInstitutionalEmailAndAffiliation() {
            assertThatThrownBy(() -> service.create(MACONDOLAB_EMAIL, newAccount("ana@gmail.com", Role.STUDENT, null, null)))
                    .isInstanceOfSatisfying(InvalidFieldsException.class,
                            ex -> assertThat(ex.getFields()).containsOnlyKeys("email", "campusId", "facultyId"));
            verify(userRepository, never()).save(any());
        }

        @Test
        void teacherIsCreatedWithAffiliation() {
            UserResponse created = service.create(MACONDOLAB_EMAIL, newAccount("pedro@unisimon.edu.co", Role.TEACHER, 1, 10));

            assertThat(created.role()).isEqualTo(Role.TEACHER);
            assertThat(created.faculty()).isEqualTo("Ingeniería");
        }

        @Test
        void macondoLabCannotCreateManagementAccounts() {
            assertThatThrownBy(() -> service.create(MACONDOLAB_EMAIL, newAccount("otro@unisimon.edu.co", Role.ADMIN, null, null)))
                    .isInstanceOf(ForbiddenActionException.class);
            verify(userRepository, never()).save(any());
        }

        @Test
        void takenEmailIsAConflict() {
            when(userRepository.existsByEmail("marta@empresa.com")).thenReturn(true);

            assertThatThrownBy(() -> service.create(ADMIN_EMAIL, newAccount("marta@empresa.com", Role.JUDGE, null, null)))
                    .isInstanceOf(ConflictException.class);
        }

        private static UserCreateRequest newAccount(String email, Role role, Integer campus, Integer faculty) {
            return new UserCreateRequest("Marta", "Ríos", email, "Temporal#2026", role, campus, faculty, null);
        }
    }

    @Nested
    class PasswordReset {

        @Test
        void macondoLabCannotResetAnAdmin() {
            assertThatThrownBy(() -> service.resetPassword(MACONDOLAB_EMAIL, 1, newPassword()))
                    .isInstanceOf(ForbiddenActionException.class);
            assertThat(admin.getPasswordHash()).isEqualTo("hash-actual");
        }

        @Test
        void ownPasswordIsNotResetThroughManagement() {
            assertThatThrownBy(() -> service.resetPassword(ADMIN_EMAIL, 1, newPassword()))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessageContaining("Seguridad");
        }

        @Test
        void resetPasswordIsTemporary() {
            service.resetPassword(MACONDOLAB_EMAIL, 3, newPassword());

            assertThat(student.getPasswordHash()).isEqualTo("hash-nuevo");
            assertThat(student.isMustChangePassword()).isTrue();
        }

        private static PasswordResetRequest newPassword() {
            return new PasswordResetRequest("Nueva#2026", "Nueva#2026");
        }
    }

    @Nested
    class Deletion {

        @Test
        void nobodyDeletesTheirOwnAccount() {
            assertThatThrownBy(() -> service.delete(ADMIN_EMAIL, 1))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessage("No puedes eliminar tu propia cuenta.");
            verify(userRepository, never()).delete(any());
        }

        @Test
        void deletingAnAccountDeletesItsFilesFirst() {
            student.setPhoto(StoredFile.builder().uuid("foto").build());

            service.delete(ADMIN_EMAIL, 3);

            InOrder order = inOrder(fileService, userRepository);
            order.verify(fileService).deleteAllOwnedBy(student);
            order.verify(userRepository).delete(student);
            assertThat(student.getPhoto()).isNull();
        }
    }

    private static UserUpdateRequest withRole(Role role) {
        return new UserUpdateRequest(role, null, null, null);
    }
}
