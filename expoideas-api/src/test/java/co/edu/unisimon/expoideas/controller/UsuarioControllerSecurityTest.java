package co.edu.unisimon.expoideas.controller;

import co.edu.unisimon.expoideas.dto.CambiarPasswordDTO;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.dto.UsuarioUpdateDTO;
import co.edu.unisimon.expoideas.exception.AccionNoPermitidaException;
import co.edu.unisimon.expoideas.exception.CamposInvalidosException;
import co.edu.unisimon.expoideas.exception.ConflictException;
import co.edu.unisimon.expoideas.security.JwtService;
import co.edu.unisimon.expoideas.security.SecurityConfig;
import co.edu.unisimon.expoideas.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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
    void healthCheckNoPideSesion() throws Exception {
        // En este slice no hay Actuator: 404 (y no 401) prueba que la regla deja pasar sin sesión.
        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/actuator/health"))
                .andExpect(status().isUnauthorized());
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
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void estudianteNoPuedeEditarNiBorrarOtroUsuario() throws Exception {
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
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void estudianteNoPuedeUsarRutasDeGestion() throws Exception {
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

    // ── Gestión de cuentas ─────────────────────────────────────────────────

    @Test
    @WithMockUser(username = CORREO, roles = "ADMIN")
    void adminGestionaUsuarios() throws Exception {
        // Las rutas de gestión piden MACONDOLAB: el administrador entra por la jerarquía de roles.
        when(usuarioService.listarUsuarios()).thenReturn(List.of());
        when(usuarioService.actualizarDesdeAdmin(eq(CORREO), eq(5), any()))
                .thenReturn(UsuarioResponseDTO.builder().id(5).rol("jurado").build());

        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/admin/users/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"jurado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("jurado"));
        mockMvc.perform(delete("/api/v1/admin/users/5")).andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/usuarios/admin/reset-password").param("email", "otro@unisimon.edu.co")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordNueva\":\"Segura#2026\",\"confirmacionPassword\":\"Segura#2026\"}"))
                .andExpect(status().isNoContent());

        verify(usuarioService).eliminarUsuario(CORREO, 5);
        verify(usuarioService).restablecerPasswordAdmin(eq(CORREO), eq("otro@unisimon.edu.co"), any(CambiarPasswordDTO.class));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "MACONDOLAB")
    void macondoLabGestionaCuentasPeroNoElimina() throws Exception {
        when(usuarioService.listarUsuarios()).thenReturn(List.of());
        when(usuarioService.crearDesdeGestion(eq(CORREO), any()))
                .thenReturn(UsuarioResponseDTO.builder().id(8).rol("jurado").build());

        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombres":"Marta","apellidos":"Ríos","correoInstitucional":"marta@empresa.com",
                                 "password":"Temporal#2026","rol":"jurado"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(8));
        mockMvc.perform(put("/api/v1/admin/users/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"docente\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/usuarios/admin/reset-password").param("email", "otro@unisimon.edu.co")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordNueva\":\"Segura#2026\",\"confirmacionPassword\":\"Segura#2026\"}"))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/v1/admin/users/5"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("No tienes permiso para realizar esta acción"));

        verify(usuarioService, never()).eliminarUsuario(any(), any());
    }

    @Test
    void docentesYJuradosNoEntranALaGestion() throws Exception {
        for (String rol : List.of("DOCENTE", "JURADO", "ESTUDIANTE")) {
            mockMvc.perform(get("/api/v1/admin/users").with(user(CORREO).roles(rol)))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/v1/admin/users").with(user(CORREO).roles(rol))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }

        verifyNoInteractions(usuarioService);
    }

    @Test
    @WithMockUser(username = CORREO, roles = "MACONDOLAB")
    void reglaDeRolesEs403ConElMotivo() throws Exception {
        when(usuarioService.actualizarDesdeAdmin(eq(CORREO), eq(1), any()))
                .thenThrow(new AccionNoPermitidaException("Solo un administrador puede modificar cuentas de administración o de MacondoLab."));

        mockMvc.perform(put("/api/v1/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombres\":\"Luis\"}"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Solo un administrador puede modificar cuentas de administración o de MacondoLab."));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "MACONDOLAB")
    void crearCuentaValidaElCuerpo() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombres\":\"Marta\",\"apellidos\":\"Ríos\",\"correoInstitucional\":\"marta@empresa.com\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.rol").value("El rol es obligatorio"))
                .andExpect(jsonPath("$.campos.password").exists());

        verifyNoInteractions(usuarioService);
    }

    @Test
    @WithMockUser(username = CORREO, roles = "MACONDOLAB")
    void rolInexistenteEs400() throws Exception {
        mockMvc.perform(put("/api/v1/admin/users/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"emprendedor\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(usuarioService);
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

        verify(usuarioService, never()).eliminarUsuario(any(), any());
    }

    // ── /usuarios/me ───────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void perfilPropioUsaElCorreoDeLaSesion() throws Exception {
        when(usuarioService.obtenerPerfilPropio(CORREO))
                .thenReturn(UsuarioResponseDTO.builder().id(7).correoInstitucional(CORREO).build());

        mockMvc.perform(get("/api/v1/usuarios/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
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
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
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
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
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
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void cambiarPasswordPropioEs204() throws Exception {
        mockMvc.perform(put("/api/v1/usuarios/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordActual\":\"Vieja#2026\",\"passwordNueva\":\"Nueva#2026\",\"confirmacionPassword\":\"Nueva#2026\"}"))
                .andExpect(status().isNoContent());

        verify(usuarioService).cambiarPasswordPropio(eq(CORREO), any(CambiarPasswordDTO.class));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void passwordActualIncorrectaEs400() throws Exception {
        doThrow(new IllegalArgumentException("La contraseña actual es incorrecta."))
                .when(usuarioService).cambiarPasswordPropio(eq(CORREO), any());

        mockMvc.perform(put("/api/v1/usuarios/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordActual\":\"Mala#2026\",\"passwordNueva\":\"Nueva#2026\",\"confirmacionPassword\":\"Nueva#2026\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("La contraseña actual es incorrecta."));
    }

    // ── Foto de perfil ─────────────────────────────────────────────────────

    private static final MockMultipartFile FOTO = new MockMultipartFile(
            "archivo", "yo.png", "image/png", new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });

    @Test
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void subirFotoPropiaConMultipart() throws Exception {
        when(usuarioService.actualizarFotoPropia(eq(CORREO), any()))
                .thenReturn(UsuarioResponseDTO.builder().id(7).fotoId("0b0f3f7e-8c1a-4c55-9d3e-2f1a6b7c8d9e").build());

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/v1/usuarios/me/foto").file(FOTO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fotoId").value("0b0f3f7e-8c1a-4c55-9d3e-2f1a6b7c8d9e"));

        verify(usuarioService).actualizarFotoPropia(eq(CORREO), any());
    }

    @Test
    void subirFotoSinSesionEs401() throws Exception {
        mockMvc.perform(multipart(HttpMethod.PUT, "/api/v1/usuarios/me/foto").file(FOTO))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(usuarioService);
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void subirFotoSinArchivoEs400() throws Exception {
        mockMvc.perform(multipart(HttpMethod.PUT, "/api/v1/usuarios/me/foto").param("otro", "x"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Falta el archivo \"archivo\""));

        verifyNoInteractions(usuarioService);
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void subirFotoComoJsonEs415() throws Exception {
        mockMvc.perform(put("/api/v1/usuarios/me/foto")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://sitio-externo.com/foto.png\"}"))
                .andExpect(status().isUnsupportedMediaType());

        verifyNoInteractions(usuarioService);
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void formatoNoPermitidoEs400EnElCampo() throws Exception {
        when(usuarioService.actualizarFotoPropia(eq(CORREO), any()))
                .thenThrow(new CamposInvalidosException(Map.of("archivo", "Formato no permitido. Usa un archivo JPG, PNG o WEBP.")));

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/v1/usuarios/me/foto").file(FOTO))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.archivo").value("Formato no permitido. Usa un archivo JPG, PNG o WEBP."));
    }

    @Test
    @WithMockUser(username = CORREO, roles = "ESTUDIANTE")
    void quitarFotoPropiaEs204() throws Exception {
        mockMvc.perform(delete("/api/v1/usuarios/me/foto"))
                .andExpect(status().isNoContent());

        verify(usuarioService).eliminarFotoPropia(CORREO);
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
                .thenReturn(UsuarioResponseDTO.builder().id(1).correoInstitucional(CORREO).rol("estudiante").build());

        mockMvc.perform(post("/api/v1/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro(CORREO, "Segura#2026", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.rol").value("estudiante"));
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
