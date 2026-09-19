package co.edu.unisimon.expoideas.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.support.SecuredWebMvcTest;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.UserAccountService;
import co.edu.unisimon.expoideas.users.UserResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Login y registro: públicos, con la validación del cuerpo. */
@SecuredWebMvcTest(AuthController.class)
class AuthControllerTest {

    private static final String EMAIL = "ana@unisimon.edu.co";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private UserAccountService accountService;

    // ── Login ───────────────────────────────────────────────────────────────

    @Test
    void wrongCredentialsAre401WithTheSameMessage() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + EMAIL + "\",\"password\":\"Mala#2026\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Credenciales inválidas"));
    }

    @Test
    void loginRequiresBothFields() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.password").exists());

        verifyNoInteractions(authService);
    }

    // ── Registro ────────────────────────────────────────────────────────────

    @Test
    void validRegistrationIs201() throws Exception {
        when(accountService.register(any()))
                .thenReturn(new UserResponse(
                        1,
                        "Ana",
                        "Pérez",
                        EMAIL,
                        Role.STUDENT,
                        null,
                        null,
                        1,
                        "Barranquilla",
                        2,
                        "Ingeniería",
                        null,
                        null,
                        List.of()));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration(EMAIL, "Segura#2026", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void registrationRequiresDataConsent() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration(EMAIL, "Segura#2026", false)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Datos inválidos"))
                .andExpect(jsonPath("$.fields.dataConsent").exists());

        verifyNoInteractions(accountService);
    }

    @Test
    void registrationRequiresAnInstitutionalEmail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration("ana@gmail.com", "Segura#2026", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").value("El correo debe terminar en @unisimon.edu.co"));
    }

    @Test
    void registrationRequiresAStrongPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration(EMAIL, "123456", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.password").exists());
    }

    @Test
    void registrationRequiresCampusAndFacultyButNotProgram() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Ana","lastName":"Pérez","email":"%s","password":"Segura#2026","dataConsent":true}
                                """.formatted(EMAIL)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.campusId").exists())
                .andExpect(jsonPath("$.fields.facultyId").exists())
                .andExpect(jsonPath("$.fields.academicProgramId").doesNotExist());

        verifyNoInteractions(accountService);
    }

    @Test
    void malformedJsonIs400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("El cuerpo de la petición no es un JSON válido"));
    }

    @Test
    void takenEmailIs409() throws Exception {
        when(accountService.register(any()))
                .thenThrow(new ConflictException("El correo institucional ya está registrado."));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration(EMAIL, "Segura#2026", true)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("El correo institucional ya está registrado."));
    }

    /** Registro válido salvo lo que se varíe: sede 1, facultad 2 y sin programa. */
    private static String registration(String email, String password, boolean dataConsent) {
        return """
                {"firstName":"Ana","lastName":"Pérez","email":"%s","password":"%s","dataConsent":%s,"campusId":1,"facultyId":2}
                """.formatted(email, password, dataConsent);
    }
}
