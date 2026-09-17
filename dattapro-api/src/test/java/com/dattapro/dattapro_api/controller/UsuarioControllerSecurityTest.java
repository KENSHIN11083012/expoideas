package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.config.JwtService;
import com.dattapro.dattapro_api.config.SecurityConfig;
import com.dattapro.dattapro_api.dto.UsuarioResponseDTO;
import com.dattapro.dattapro_api.dto.UsuarioUpdateDTO;
import com.dattapro.dattapro_api.entity.Usuario;
import com.dattapro.dattapro_api.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reglas de acceso sobre usuarios, con la SecurityConfig real y sin base de datos.
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
    @MockitoBean
    private AuthenticationProvider authenticationProvider;

    // ── Rutas sobre otros usuarios: ya no existen fuera de /admin ──────────

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void emprendedorNoPuedeEditarNiBorrarOtroUsuario() throws Exception {
        mockMvc.perform(put("/api/v1/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correoInstitucional\":\"yo@unisimon.edu.co\",\"password\":\"Hack3d!!\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/usuarios/1")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/usuarios/1")).andExpect(status().isNotFound());

        verifyNoInteractions(usuarioService);
    }

    @Test
    @WithMockUser(username = CORREO, roles = "EMPRENDEDOR")
    void emprendedorNoPuedeListarUsuarios() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"admin\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/v1/admin/users/1")).andExpect(status().isForbidden());

        verify(usuarioService, never()).listarUsuarios();
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ADMIN")
    void adminPuedeListarUsuarios() throws Exception {
        when(usuarioService.listarUsuarios()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
    }

    // ── /usuarios/me ───────────────────────────────────────────────────────

    @Test
    void perfilPropioExigeSesion() throws Exception {
        int status = mockMvc.perform(get("/api/v1/usuarios/me")).andReturn().getResponse().getStatus();

        assertThat(status).isIn(401, 403);
        verifyNoInteractions(usuarioService);
    }

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
                        .content("{\"nombres\":\"Ana\",\"apellidos\":\"Pérez\"}"))
                .andExpect(status().isOk());

        verify(usuarioService).actualizarPerfilPropio(eq(CORREO), eq(new UsuarioUpdateDTO("Ana", "Pérez")));
    }

    // ── Registro ───────────────────────────────────────────────────────────

    @Test
    void registroExigeConsentimiento() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro(CORREO, "Segura#2026", false)))
                .andExpect(status().isBadRequest())
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
                .andExpect(status().isBadRequest());
    }

    @Test
    void registroValidoCrea() throws Exception {
        when(usuarioService.registrarUsuario(any()))
                .thenReturn(Usuario.builder().id(1).correoInstitucional(CORREO).build());

        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro(CORREO, "Segura#2026", true)))
                .andExpect(status().isCreated());
    }

    private static String registro(String correo, String password, boolean autorizaDatos) {
        return """
                {"nombres":"Ana","apellidos":"Pérez","correoInstitucional":"%s","password":"%s","autorizaDatos":%s}
                """.formatted(correo, password, autorizaDatos);
    }
}
