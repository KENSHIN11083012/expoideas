package co.edu.unisimon.expoideas.controller;

import co.edu.unisimon.expoideas.dto.CatalogoRequestDTO;
import co.edu.unisimon.expoideas.dto.CatalogoResponseDTO;
import co.edu.unisimon.expoideas.dto.ProgramaAcademicoRequestDTO;
import co.edu.unisimon.expoideas.dto.ProgramaAcademicoResponseDTO;
import co.edu.unisimon.expoideas.security.JwtService;
import co.edu.unisimon.expoideas.security.SecurityConfig;
import co.edu.unisimon.expoideas.service.MasterDataService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Catálogos maestros: lectura pública; la estructura institucional la escribe el
 * administrador y la clasificación, MacondoLab. Validación y conflictos.
 */
@WebMvcTest(controllers = MasterDataController.class)
@Import(SecurityConfig.class)
class MasterDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MasterDataService masterDataService;

    @MockitoBean
    private JwtService jwtService;
    @MockitoBean
    private UserDetailsService userDetailsService;

    // ── Catálogos simples ──────────────────────────────────────────────────

    @Test
    void listadoDeSedesEsPublico() throws Exception {
        when(masterDataService.listarSedes()).thenReturn(List.of(new CatalogoResponseDTO(1, "Barranquilla")));

        mockMvc.perform(get("/api/v1/sedes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nombre").value("Barranquilla"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCreaYEditaSede() throws Exception {
        when(masterDataService.crearSede(new CatalogoRequestDTO("Cúcuta")))
                .thenReturn(new CatalogoResponseDTO(2, "Cúcuta"));
        when(masterDataService.actualizarSede(eq(2), any()))
                .thenReturn(new CatalogoResponseDTO(2, "Cúcuta Centro"));

        mockMvc.perform(post("/api/v1/sedes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Cúcuta\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2));
        mockMvc.perform(put("/api/v1/sedes/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Cúcuta Centro\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Cúcuta Centro"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void nombreVacioEs400() throws Exception {
        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nombre").value("El nombre es obligatorio"));

        verifyNoInteractions(masterDataService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void nombreRepetidoEs409() throws Exception {
        when(masterDataService.crearKeyword(any()))
                .thenThrow(new DataIntegrityViolationException("Duplicate entry 'fintech' for key 'nombre'"));

        mockMvc.perform(post("/api/v1/keywords")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"fintech\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Ya existe un registro con esos datos"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void catalogoInexistenteEs404() throws Exception {
        when(masterDataService.actualizarFacultad(eq(99), any()))
                .thenThrow(new NoSuchElementException("No existe una facultad con ID: 99"));

        mockMvc.perform(put("/api/v1/facultades/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Ingeniería\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("No existe una facultad con ID: 99"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void noHayBorradoDeCatalogos() throws Exception {
        mockMvc.perform(delete("/api/v1/sedes/1"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.detail").value("Método HTTP no soportado para este recurso"));
    }

    @Test
    @WithMockUser(roles = "MACONDOLAB")
    void macondoLabEscribeClasificacionPeroNoEstructura() throws Exception {
        when(masterDataService.crearCategoria(new CatalogoRequestDTO("Gastronomía")))
                .thenReturn(new CatalogoResponseDTO(4, "Gastronomía"));

        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Gastronomía\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/sedes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Cúcuta\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/programas-academicos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Derecho\",\"facultadId\":3}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ESTUDIANTE")
    void estudianteNoEscribeCatalogos() throws Exception {
        mockMvc.perform(post("/api/v1/sedes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Cúcuta\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/categorias/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Fintech\"}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(masterDataService);
    }

    @Test
    void escribirCatalogosSinSesionEs401() throws Exception {
        mockMvc.perform(post("/api/v1/sedes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Cúcuta\"}"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(masterDataService);
    }

    // ── Programas académicos ───────────────────────────────────────────────

    @Test
    void listadoDeProgramasIncluyeLaFacultad() throws Exception {
        when(masterDataService.listarProgramasAcademicos())
                .thenReturn(List.of(new ProgramaAcademicoResponseDTO(1, "Ingeniería de Sistemas", 2, "Ingeniería")));

        mockMvc.perform(get("/api/v1/programas-academicos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].facultadId").value(2))
                .andExpect(jsonPath("$[0].facultad").value("Ingeniería"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCreaProgramaConFacultad() throws Exception {
        when(masterDataService.crearProgramaAcademico(new ProgramaAcademicoRequestDTO("Derecho", 3)))
                .thenReturn(new ProgramaAcademicoResponseDTO(9, "Derecho", 3, "Ciencias Jurídicas"));

        mockMvc.perform(post("/api/v1/programas-academicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Derecho\",\"facultadId\":3}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.facultadId").value(3));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void programaSinFacultadEs400() throws Exception {
        mockMvc.perform(post("/api/v1/programas-academicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Derecho\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.facultadId").exists());

        verifyNoInteractions(masterDataService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void programaConFacultadInexistenteEs404() throws Exception {
        when(masterDataService.crearProgramaAcademico(any()))
                .thenThrow(new NoSuchElementException("No existe una facultad con ID: 999"));

        mockMvc.perform(post("/api/v1/programas-academicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Derecho\",\"facultadId\":999}"))
                .andExpect(status().isNotFound());
    }
}
