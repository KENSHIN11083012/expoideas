package co.edu.unisimon.expoideas.controller;

import co.edu.unisimon.expoideas.dto.CambiarPasswordDTO;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.dto.UsuarioUpdateDTO;
import co.edu.unisimon.expoideas.exception.CamposInvalidosException;
import co.edu.unisimon.expoideas.exception.ConflictException;
import co.edu.unisimon.expoideas.security.JwtService;
import co.edu.unisimon.expoideas.security.SecurityConfig;
import co.edu.unisimon.expoideas.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reglas de acceso y contratos HTTP sobre usuarios, con la SecurityConfig real y
 * sin base de datos.
 */
@WebMvcTest(controllers = { UsuarioController.class, AdminUsuarioController.class })
@Import(SecurityConfig.class)
class UsuarioControllerSecurityTest {

    private static final String CORREO = "ana@unisimon.edu.co";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UsuarioService usuarioService;

    // Dependencias de SecurityConfig y JwtAuthenticationFilter. Sin header
    // Authorization el filtro no las usa: la sesión la pone @WithMockUser.
    @MockitoBean
    private JwtService jwtService;
    @MockitoBean
    private UserDetailsService userDetailsService;

    // ── Sin sesión: 401 con Problem Details ────────────────────────────────

    @Test
    void sinSesionEs401() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.detail").value("Debes iniciar sesión para acceder a este recurso"));

        verifyNoInteractions(usuarioService);
    }

    @Test
    void tokenInvalidoEs401() throws Exception {
        // El JwtService mockeado no reconoce el token: el filtro deja pasar sin sesión.
        mockMvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer basura"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(usuarioService);
    }

    // ── Rutas sobre otros usuarios: ya no existen fuera de /admin ──────────

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void emprendedorNoPuedeEditarNiBorrarOtroUsuario() throws Exception {
        mockMvc.perform(put("/api/v1/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correoInstitucional\":\"yo@unisimon.edu.co\",\"password\":\"Hack3d!!\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("El recurso solicitado no existe"));
        mockMvc.perform(delete("/api/v1/usuarios/1")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/usuarios/1")).andExpect(status().isNotFound());

        verifyNoInteractions(usuarioService);
    }

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void emprendedorNoPuedeUsarRutasDeAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("No tienes permiso para realizar esta acción"));
        mockMvc.perform(put("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"admin\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/v1/admin/users/1")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/usuarios/admin/reset-password").param("email", "otro@unisimon.edu.co")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordNueva\":\"Segura#2026\",\"confirmacionPassword\":\"Segura#2026\"}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(usuarioService);
    }

    // ── Administración ─────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = CORREO, roles = "ADMIN")
    void adminGestionaUsuarios() throws Exception {
        when(usuarioService.listarUsuarios()).thenReturn(List.of());
        when(usuarioService.actualizarDesdeAdmin(eq(5), any()))
                .thenReturn(UsuarioResponseDTO.builder().id(5).rol("mentor").build());

        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/admin/users/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"mentor\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("mentor"));
        mockMvc.perform(delete("/api/v1/admin/users/5")).andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/usuarios/admin/reset-password").param("email", "otro@unisimon.edu.co")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordNueva\":\"Segura#2026\",\"confirmacionPassword\":\"Segura#2026\"}"))
                .andExpect(status().isNoContent());

        verify(usuarioService).eliminarUsuario(5);
        verify(usuarioService).restablecerPasswordAdmin(eq("otro@unisimon.edu.co"), any(CambiarPasswordDTO.class));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ADMIN")
    void resetSinCorreoEs400ConElParametro() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/admin/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordNueva\":\"Segura#2026\",\"confirmacionPassword\":\"Segura#2026\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Falta el parámetro obligatorio \"email\""));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ADMIN")
    void idNoNumericoEs400() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/users/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        verify(usuarioService, never()).eliminarUsuario(any());
    }

    // ── /usuarios/me ───────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void perfilPropioUsaElCorreoDeLaSesion() throws Exception {
        when(usuarioService.obtenerPerfilPropio(CORREO))
                .thenReturn(UsuarioResponseDTO.builder().id(7).correoInstitucional(CORREO).build());

        mockMvc.perform(get("/api/v1/usuarios/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void actualizarPerfilPropioUsaElCorreoDeLaSesion() throws Exception {
        mockMvc.perform(put("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombres\":\"Ana\",\"apellidos\":\"Pérez\",\"sedeId\":1,\"facultadId\":2,\"programaAcademicoId\":null}"))
                .andExpect(status().isOk());

        verify(usuarioService).actualizarPerfilPropio(eq(CORREO), eq(new UsuarioUpdateDTO("Ana", "Pérez", 1, 2, null)));
    }

    @Test
    @WithMockUser(username = "luis@unisimon.edu.co", roles = "ADMIN")
    void perfilSinAdscripcionPasaLaValidacionDelDto() throws Exception {
        // Que la exija o no depende del rol: lo decide el servicio, no el DTO.
        mockMvc.perform(put("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombres\":\"Luis\",\"apellidos\":\"Gómez\"}"))
                .andExpect(status().isOk());

        verify(usuarioService).actualizarPerfilPropio(
                eq("luis@unisimon.edu.co"), eq(new UsuarioUpdateDTO("Luis", "Gómez", null, null, null)));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void adscripcionIncompletaEs400ConCampos() throws Exception {
        when(usuarioService.actualizarPerfilPropio(eq(CORREO), any()))
                .thenThrow(new CamposInvalidosException(Map.of("facultadId", "La facultad es obligatoria")));

        mockMvc.perform(put("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombres\":\"Ana\",\"apellidos\":\"Pérez\",\"sedeId\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Datos inválidos"))
                .andExpect(jsonPath("$.campos.facultadId").value("La facultad es obligatoria"));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void programaDeOtraFacultadEs400() throws Exception {
        when(usuarioService.actualizarPerfilPropio(eq(CORREO), any()))
                .thenThrow(new IllegalArgumentException("El programa académico no pertenece a la facultad seleccionada."));

        mockMvc.perform(put("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombres\":\"Ana\",\"apellidos\":\"Pérez\",\"sedeId\":1,\"facultadId\":2,\"programaAcademicoId\":9}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("El programa académico no pertenece a la facultad seleccionada."));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void cambiarPasswordPropioEs204() throws Exception {
        mockMvc.perform(put("/api/v1/usuarios/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordActual\":\"Vieja#2026\",\"passwordNueva\":\"Nueva#2026\",\"confirmacionPassword\":\"Nueva#2026\"}"))
                .andExpect(status().isNoContent());

        verify(usuarioService).cambiarPasswordPropio(eq(CORREO), any(CambiarPasswordDTO.class));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void passwordActualIncorrectaEs400() throws Exception {
        doThrow(new IllegalArgumentException("La contraseña actual es incorrecta."))
                .when(usuarioService).cambiarPasswordPropio(eq(CORREO), any());

        mockMvc.perform(put("/api/v1/usuarios/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordActual\":\"Mala#2026\",\"passwordNueva\":\"Nueva#2026\",\"confirmacionPassword\":\"Nueva#2026\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("La contraseña actual es incorrecta."));
    }

    // ── Registro ───────────────────────────────────────────────────────────

    @Test
    void registroExigeConsentimiento() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro(CORREO, "Segura#2026", false)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Datos inválidos"))
                .andExpect(jsonPath("$.campos.autorizaDatos").exists());

        verifyNoInteractions(usuarioService);
    }

    @Test
    void registroExigeCorreoInstitucional() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro("ana@gmail.com", "Segura#2026", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.correoInstitucional").exists());
    }

    @Test
    void registroExigeContrasenaSegura() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro(CORREO, "123456", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.password").exists());
    }

    @Test
    void registroConJsonMalFormadoEs400() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombres\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("El cuerpo de la petición no es un JSON válido"));
    }

    @Test
    void registroConCorreoRepetidoEs409() throws Exception {
        when(usuarioService.registrarUsuario(any()))
                .thenThrow(new ConflictException("El correo institucional ya está registrado."));

        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro(CORREO, "Segura#2026", true)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("El correo institucional ya está registrado."));
    }

    @Test
    void registroValidoCreaYDevuelveElUsuario() throws Exception {
        when(usuarioService.registrarUsuario(any()))
                .thenReturn(UsuarioResponseDTO.builder().id(1).correoInstitucional(CORREO).rol("emprendedor").build());

        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro(CORREO, "Segura#2026", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.rol").value("emprendedor"));
    }

    @Test
    void registroExigeSedeYFacultadPeroNoPrograma() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombres":"Ana","apellidos":"Pérez","correoInstitucional":"%s","password":"Segura#2026","autorizaDatos":true}
                                """.formatted(CORREO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.sedeId").exists())
                .andExpect(jsonPath("$.campos.facultadId").exists())
                .andExpect(jsonPath("$.campos.programaAcademicoId").doesNotExist());

        verifyNoInteractions(usuarioService);
    }

    /** Registro válido salvo lo que se varíe: sede 1, facultad 2 y sin programa. */
    private static String registro(String correo, String password, boolean autorizaDatos) {
        return """
                {"nombres":"Ana","apellidos":"Pérez","correoInstitucional":"%s","password":"%s","autorizaDatos":%s,"sedeId":1,"facultadId":2}
                """.formatted(correo, password, autorizaDatos);
    }
}
