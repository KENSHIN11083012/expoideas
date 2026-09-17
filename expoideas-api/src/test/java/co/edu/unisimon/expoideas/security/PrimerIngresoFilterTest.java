package co.edu.unisimon.expoideas.security;

import co.edu.unisimon.expoideas.controller.AdminUsuarioController;
import co.edu.unisimon.expoideas.controller.MasterDataController;
import co.edu.unisimon.expoideas.controller.UsuarioController;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.entity.RolUsuario;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.service.MasterDataService;
import co.edu.unisimon.expoideas.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.hamcrest.Matchers.contains;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Con pasos de primer ingreso pendientes, la API solo deja resolverlos; el
 * resto responde 403 con {@code pendientes}, sea cual sea el rol.
 */
@WebMvcTest(controllers = { UsuarioController.class, AdminUsuarioController.class, MasterDataController.class })
@Import(SecurityConfig.class)
class PrimerIngresoFilterTest {

    private static final String CORREO = "coordinacion@unisimon.edu.co";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean private UsuarioService usuarioService;
    @MockitoBean private MasterDataService masterDataService;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;

    /** Sesión de una cuenta MacondoLab recién creada: contraseña temporal y sin consentimiento. */
    private static RequestPostProcessor cuentaNueva() {
        return user(new CuentaAutenticada(Usuario.builder()
                .correoInstitucional(CORREO).password("hash").rol(RolUsuario.macondolab)
                .debeCambiarPassword(true).autorizaDatos(false).build()));
    }

    private static RequestPostProcessor cuentaAlDia() {
        return user(new CuentaAutenticada(Usuario.builder()
                .correoInstitucional(CORREO).password("hash").rol(RolUsuario.macondolab)
                .autorizaDatos(true).build()));
    }

    @Test
    void conPendientesLaGestionResponde403ConLosPasos() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users").with(cuentaNueva()))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Antes de continuar, completa tu primer ingreso."))
                .andExpect(jsonPath("$.pendientes", contains("cambiarPassword", "autorizarDatos")));
        mockMvc.perform(put("/api/v1/usuarios/me").with(cuentaNueva())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombres\":\"Carla\",\"apellidos\":\"Díaz\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/categorias").with(cuentaNueva())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Textil\"}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(usuarioService, masterDataService);
    }

    @Test
    void conPendientesPuedeResolverlos() throws Exception {
        when(usuarioService.obtenerPerfilPropio(CORREO)).thenReturn(UsuarioResponseDTO.builder().id(3).build());

        mockMvc.perform(get("/api/v1/usuarios/me").with(cuentaNueva()))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/usuarios/me/password").with(cuentaNueva())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordActual\":\"Temporal#2026\",\"passwordNueva\":\"Propia#2026\",\"confirmacionPassword\":\"Propia#2026\"}"))
                .andExpect(status().isNoContent());
        mockMvc.perform(put("/api/v1/usuarios/me/autorizacion-datos").with(cuentaNueva())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autorizaDatos\":true}"))
                .andExpect(status().isNoContent());

        verify(usuarioService).cambiarPasswordPropio(eq(CORREO), any());
        verify(usuarioService).autorizarDatosPropio(CORREO);
    }

    @Test
    void conPendientesLoPublicoSigueSiendoPublico() throws Exception {
        when(masterDataService.listarSedes()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/sedes").with(cuentaNueva()))
                .andExpect(status().isOk());
    }

    @Test
    void autorizarDatosExigeAceptar() throws Exception {
        mockMvc.perform(put("/api/v1/usuarios/me/autorizacion-datos").with(cuentaNueva())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autorizaDatos\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.autorizaDatos").value("Debes autorizar el tratamiento de tus datos para usar la plataforma"));

        verifyNoInteractions(usuarioService);
    }

    @Test
    void cuentaAlDiaUsaLaPlataformaNormalmente() throws Exception {
        when(usuarioService.listarUsuarios()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/users").with(cuentaAlDia()))
                .andExpect(status().isOk());
    }

    @Test
    void conPendientesLasReglasDeRolSiguenAplicando() throws Exception {
        // Resolver el primer ingreso no abre rutas que el rol no tiene.
        RequestPostProcessor juradoNuevo = user(new CuentaAutenticada(Usuario.builder()
                .correoInstitucional("marta@empresa.com").password("hash").rol(RolUsuario.jurado)
                .debeCambiarPassword(true).build()));

        mockMvc.perform(put("/api/v1/usuarios/me/autorizacion-datos").with(juradoNuevo)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autorizaDatos\":true}"))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/sedes").with(juradoNuevo)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Cúcuta\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.pendientes").exists());
    }
}
