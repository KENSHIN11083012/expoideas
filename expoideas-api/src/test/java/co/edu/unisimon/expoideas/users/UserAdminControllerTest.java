package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.support.SecuredWebMvcTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Gestión de cuentas (/admin/users): quién entra y el contrato HTTP. */
@SecuredWebMvcTest(UserAdminController.class)
class UserAdminControllerTest {

    private static final String EMAIL = "luis@unisimon.edu.co";
    private static final String RESET = "{\"newPassword\":\"Segura#2026\",\"confirmPassword\":\"Segura#2026\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserManagementService managementService;

    @Test
    @WithMockUser(username = EMAIL, roles = "ADMIN")
    void adminManagesAccounts() throws Exception {
        // Las rutas piden MACONDOLAB: el administrador entra por la jerarquía de roles.
        when(managementService.list()).thenReturn(List.of());
        when(managementService.update(eq(EMAIL), eq(5), any())).thenReturn(response(5, Role.JUDGE));

        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/admin/users/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"JUDGE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("JUDGE"));
        mockMvc.perform(post("/api/v1/admin/users/5/password-reset").contentType(MediaType.APPLICATION_JSON).content(RESET))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/v1/admin/users/5")).andExpect(status().isNoContent());

        verify(managementService).update(EMAIL, 5, new UserUpdateRequest(Role.JUDGE, null, null, null));
        verify(managementService).resetPassword(EMAIL, 5, new PasswordResetRequest("Segura#2026", "Segura#2026"));
        verify(managementService).delete(EMAIL, 5);
    }

    @Test
    @WithMockUser(username = EMAIL, roles = "MACONDOLAB")
    void macondoLabManagesAccountsButDoesNotDelete() throws Exception {
        when(managementService.create(eq(EMAIL), any())).thenReturn(response(8, Role.JUDGE));

        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Marta","lastName":"Ríos","email":"marta@empresa.com",
                                 "password":"Temporal#2026","role":"JUDGE"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(8));
        mockMvc.perform(post("/api/v1/admin/users/5/password-reset").contentType(MediaType.APPLICATION_JSON).content(RESET))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/v1/admin/users/5"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("No tienes permiso para realizar esta acción"));

        verify(managementService, never()).delete(any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"STUDENT", "TEACHER", "JUDGE"})
    void otherRolesDoNotReachManagement(String role) throws Exception {
        mockMvc.perform(get("/api/v1/admin/users").with(user(EMAIL).roles(role)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
        mockMvc.perform(post("/api/v1/admin/users").with(user(EMAIL).roles(role))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/admin/users/1/password-reset").with(user(EMAIL).roles(role))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(RESET))
                .andExpect(status().isForbidden());

        verifyNoInteractions(managementService);
    }

    @Test
    void withoutSessionIs401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isUnauthorized());

        verifyNoInteractions(managementService);
    }

    @Test
    @WithMockUser(username = EMAIL, roles = "MACONDOLAB")
    void roleRulesAre403WithTheReason() throws Exception {
        when(managementService.update(eq(EMAIL), eq(1), any())).thenThrow(new ForbiddenActionException(
                "Solo un administrador puede modificar cuentas de administración o de MacondoLab."));

        mockMvc.perform(put("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"STUDENT\"}"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail")
                        .value("Solo un administrador puede modificar cuentas de administración o de MacondoLab."));
    }

    @Test
    @WithMockUser(username = EMAIL, roles = "MACONDOLAB")
    void createValidatesTheBody() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Marta\",\"lastName\":\"Ríos\",\"email\":\"marta@empresa.com\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.role").value("El rol es obligatorio"))
                .andExpect(jsonPath("$.fields.password").exists());

        verifyNoInteractions(managementService);
    }

    @Test
    @WithMockUser(username = EMAIL, roles = "MACONDOLAB")
    void unknownRoleIs400() throws Exception {
        mockMvc.perform(put("/api/v1/admin/users/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"MENTOR\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(managementService);
    }

    @Test
    @WithMockUser(username = EMAIL, roles = "ADMIN")
    void nonNumericIdIs400() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/users/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        verifyNoInteractions(managementService);
    }

    private static UserResponse response(int id, Role role) {
        return new UserResponse(id, "Marta", "Ríos", "marta@empresa.com", role, null, null,
                null, null, null, null, null, null, List.of());
    }
}
