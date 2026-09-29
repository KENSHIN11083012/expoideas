package co.edu.unisimon.expoideas.projects;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.editions.Track;
import co.edu.unisimon.expoideas.support.SecuredWebMvcTest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Proyectos e invitaciones: todo pide sesión, y cada error sale en su formato. */
@SecuredWebMvcTest({ProjectController.class, InvitationController.class})
class ProjectControllerTest {

    private static final String BODY = """
            {
              "editionId": 1,
              "track": "INNPRENDE_I",
              "title": "BioSensor",
              "summary": "Sensores para detectar plagas antes de que se vean.",
              "sectorId": 3,
              "teacherId": 7
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private ProjectTeamService teamService;

    @Test
    @WithMockUser(username = "ana@unisimon.edu.co", roles = "STUDENT")
    void aStudentRegistersAProject() throws Exception {
        when(projectService.create(eq("ana@unisimon.edu.co"), any())).thenReturn(response());

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.track").value("INNPRENDE_I"))
                .andExpect(jsonPath("$.members[0].teamRole").value("LEADER"))
                .andExpect(jsonPath("$.maxMembers").value(5));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void aProjectWithoutItsDataIs400() throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.title").value("El título es obligatorio"))
                .andExpect(jsonPath("$.fields.editionId").exists())
                .andExpect(jsonPath("$.fields.sectorId").exists())
                .andExpect(jsonPath("$.fields.teacherId").exists());

        verifyNoInteractions(projectService);
    }

    @Test
    void withoutASessionNothingIsVisible() throws Exception {
        mockMvc.perform(get("/api/v1/projects/mine")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/projects/10")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/invitations")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(projectService, teamService);
    }

    @Test
    @WithMockUser(roles = "MACONDOLAB")
    void managementIsStoppedByTheServiceNotByTheRoute() throws Exception {
        when(projectService.create(any(), any()))
                .thenThrow(new ForbiddenActionException("Solo los estudiantes inscriben proyectos"));

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Solo los estudiantes inscriben proyectos"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void aProjectThatCannotBeSeenIs404() throws Exception {
        when(projectService.get(eq(10), any()))
                .thenThrow(new NoSuchElementException("No existe un proyecto con ID: 10"));

        mockMvc.perform(get("/api/v1/projects/10"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("No existe un proyecto con ID: 10"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void aClosedEditionIs409() throws Exception {
        when(projectService.create(any(), any()))
                .thenThrow(new ConflictException("Las inscripciones de Expoideas 2026-2 no están abiertas"));

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Las inscripciones de Expoideas 2026-2 no están abiertas"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void anInvitationToSomeoneWithoutAnAccountComesBackOnTheField() throws Exception {
        when(teamService.invite(eq(10), any(), any()))
                .thenThrow(new InvalidFieldsException("email", "No hay una cuenta registrada con ese correo"));

        mockMvc.perform(post("/api/v1/projects/10/invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nadie@unisimon.edu.co\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").value("No hay una cuenta registrada con ese correo"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void invitationsAreAnsweredAndMembersLeave() throws Exception {
        when(teamService.listMine(any()))
                .thenReturn(List.of(new InvitationResponse(
                        4, 10, "BioSensor", "Expoideas 2026-2", Track.INNPRENDE_I, "Ana Pérez", LocalDateTime.now())));
        when(teamService.accept(eq(4), any())).thenReturn(response());

        mockMvc.perform(get("/api/v1/invitations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].projectTitle").value("BioSensor"))
                .andExpect(jsonPath("$[0].leader").value("Ana Pérez"));
        mockMvc.perform(post("/api/v1/invitations/4/acceptance")).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/invitations/4/rejection")).andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/v1/projects/10/members/2")).andExpect(status().isNoContent());
    }

    private static ProjectResponse response() {
        return new ProjectResponse(
                10,
                1,
                "Expoideas 2026-2",
                Track.INNPRENDE_I,
                "BioSensor",
                "Sensores para detectar plagas antes de que se vean.",
                3,
                "Agroindustria y alimentos",
                7,
                "Carlos Mendoza",
                true,
                2,
                5,
                List.of(new MemberResponse(
                        1, "Ana Pérez", "ana@unisimon.edu.co", MemberRole.LEADER, MembershipStatus.ACCEPTED)),
                LocalDateTime.now());
    }
}
