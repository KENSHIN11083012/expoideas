package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.config.JwtService;
import com.dattapro.dattapro_api.config.SecurityConfig;
import com.dattapro.dattapro_api.dto.ProgramaAcademicoRequestDTO;
import com.dattapro.dattapro_api.dto.ProgramaAcademicoResponseDTO;
import com.dattapro.dattapro_api.service.MasterDataService;
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
import java.util.NoSuchElementException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Programas académicos: la facultad viaja como facultadId y es obligatoria.
 */
@WebMvcTest(controllers = MasterDataController.class)
@Import(SecurityConfig.class)
class ProgramaAcademicoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MasterDataService masterDataService;

    @MockitoBean
    private JwtService jwtService;
    @MockitoBean
    private UserDetailsService userDetailsService;
    @MockitoBean
    private AuthenticationProvider authenticationProvider;

    @Test
    void listadoEsPublicoEIncluyeLaFacultad() throws Exception {
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
    void sinFacultadEs400() throws Exception {
        mockMvc.perform(post("/api/v1/programas-academicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Derecho\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.facultadId").exists());

        verifyNoInteractions(masterDataService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void facultadInexistenteEs404() throws Exception {
        when(masterDataService.crearProgramaAcademico(any()))
                .thenThrow(new NoSuchElementException("No existe una facultad con ID: 999"));

        mockMvc.perform(post("/api/v1/programas-academicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Derecho\",\"facultadId\":999}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "EMPRENDEDOR")
    void soloAdminCreaProgramas() throws Exception {
        mockMvc.perform(post("/api/v1/programas-academicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Derecho\",\"facultadId\":3}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(masterDataService);
    }
}
