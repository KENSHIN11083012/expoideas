package co.edu.unisimon.expoideas.integration;

import static org.assertj.core.api.Assertions.assertThat;

import co.edu.unisimon.expoideas.support.TestData;
import co.edu.unisimon.expoideas.users.Role;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/**
 * Entregables contra MySQL: MacondoLab configura qué pide cada cátedra y el
 * equipo sube, descarga y quita sus archivos hasta el cierre de entregas.
 */
class DeliverableIT extends IntegrationTest {

    private static final String TRACK = "INNPRENDE_I";

    // ── Configuración de los entregables ────────────────────────────────────

    @Test
    void macondoLabConfiguresWhatEachTrackAsks() {
        String macondolab = loginAs(Role.MACONDOLAB);

        int posterId = createType(macondolab, "Póster " + System.nanoTime(), "DOCUMENT", true, 1);

        List<Integer> ids = get("/api/v1/deliverable-types?editionId=" + openEdition() + "&track=" + TRACK, macondolab)
                .expect(200)
                .json("$[*].id");
        assertThat(ids).contains(posterId);

        Map<String, Object> changed = typeBody("Póster final " + System.nanoTime(), "ANY", false, 3);
        Response updated = put("/api/v1/deliverable-types/" + posterId, macondolab, changed)
                .expect(200);
        assertThat(updated.json("$.maxFiles").toString()).isEqualTo("3");
        assertThat((Boolean) updated.json("$.required")).isFalse();

        delete("/api/v1/deliverable-types/" + posterId, macondolab).expect(204);
    }

    @Test
    void onlyManagementConfiguresDeliverables() {
        Map<String, Object> body = typeBody("Póster " + System.nanoTime(), "DOCUMENT", true, 1);

        post("/api/v1/deliverable-types", loginAs(Role.STUDENT), body).expect(403);
        post("/api/v1/deliverable-types", loginAs(Role.TEACHER), body).expect(403);
        post("/api/v1/deliverable-types", null, body).expect(401);
        // Leerlos sí pide sesión, pero de cualquier rol.
        get("/api/v1/deliverable-types?editionId=" + openEdition() + "&track=" + TRACK, null)
                .expect(401);
    }

    // ── Subida y descarga ───────────────────────────────────────────────────

    @Test
    void theTeamUploadsDownloadsAndRemovesItsFiles() {
        String macondolab = loginAs(Role.MACONDOLAB);
        int typeId = createType(macondolab, "Póster " + System.nanoTime(), "DOCUMENT", true, 1);
        Team team = newTeam();
        int projectId = createProject(team);

        Response pending = get("/api/v1/projects/" + projectId + "/deliverables", team.leaderToken())
                .expect(200);
        List<Boolean> complete = pending.json("$[?(@.type.id == " + typeId + ")].complete");
        assertThat(complete).containsExactly(false);

        Response uploaded = uploadPdf(projectId, typeId, team.leaderToken()).expect(200);
        List<Boolean> done = uploaded.json("$[?(@.type.id == " + typeId + ")].complete");
        assertThat(done).containsExactly(true);
        List<String> names = uploaded.json("$[?(@.type.id == " + typeId + ")].files[*].fileName");
        assertThat(names).containsExactly("poster.pdf");

        String fileId = ((List<String>) uploaded.json("$[?(@.type.id == " + typeId + ")].files[*].fileId")).getFirst();
        // El archivo es privado: lo abren el equipo y el docente, no cualquiera.
        get("/api/v1/files/" + fileId, team.leaderToken()).expect(200);
        get("/api/v1/files/" + fileId, login(team.teacherEmail(), PASSWORD)).expect(200);
        get("/api/v1/files/" + fileId, loginAs(Role.MACONDOLAB)).expect(200);
        get("/api/v1/files/" + fileId, loginAs(Role.STUDENT)).expect(404);
        get("/api/v1/files/" + fileId, null).expect(404);

        int deliverableId = ((List<Integer>) uploaded.json("$[?(@.type.id == " + typeId + ")].files[*].id")).getFirst();
        delete("/api/v1/projects/" + projectId + "/deliverables/" + deliverableId, team.leaderToken())
                .expect(200);
        get("/api/v1/files/" + fileId, team.leaderToken()).expect(404);
    }

    @Test
    void aDeliverableThatTakesOneFileDoesNotTakeTwo() {
        String macondolab = loginAs(Role.MACONDOLAB);
        int typeId = createType(macondolab, "Póster " + System.nanoTime(), "DOCUMENT", true, 1);
        Team team = newTeam();
        int projectId = createProject(team);

        uploadPdf(projectId, typeId, team.leaderToken()).expect(200);
        Response second = uploadPdf(projectId, typeId, team.leaderToken()).expect(409);
        assertThat(second.json("$.detail").toString()).contains("un solo archivo");
    }

    @Test
    void theFormatIsCheckedAgainstTheContentNotTheName() {
        String macondolab = loginAs(Role.MACONDOLAB);
        int typeId = createType(macondolab, "Fotos " + System.nanoTime(), "IMAGE", true, 3);
        Team team = newTeam();
        int projectId = createProject(team);

        Response rejected = putOrPostFile(
                        projectId, typeId, team.leaderToken(), "foto.jpg", MediaType.IMAGE_JPEG, TestData.PDF)
                .expect(400);
        assertThat(rejected.json("$.fields.file").toString()).contains("Formato no permitido");

        putOrPostFile(projectId, typeId, team.leaderToken(), "foto.jpg", MediaType.IMAGE_JPEG, TestData.JPEG)
                .expect(200);
    }

    @Test
    void onlyTheTeamUploads() {
        String macondolab = loginAs(Role.MACONDOLAB);
        int typeId = createType(macondolab, "Póster " + System.nanoTime(), "DOCUMENT", true, 1);
        Team team = newTeam();
        int projectId = createProject(team);

        // El docente ve el proyecto, pero no sube por el equipo.
        uploadPdf(projectId, typeId, login(team.teacherEmail(), PASSWORD)).expect(403);
        // Alguien de fuera ni siquiera sabe que existe.
        uploadPdf(projectId, typeId, loginAs(Role.STUDENT)).expect(404);
        // Una invitación sin responder tampoco basta.
        post("/api/v1/projects/" + projectId + "/invitations", team.leaderToken(), Map.of("email", team.memberEmail()))
                .expect(201);
        uploadPdf(projectId, typeId, team.memberToken()).expect(403);
    }

    @Test
    void aDeliverableWithFilesCannotBeDeleted() {
        String macondolab = loginAs(Role.MACONDOLAB);
        int typeId = createType(macondolab, "Evidencia " + System.nanoTime(), "ANY", true, 2);
        Team team = newTeam();
        int projectId = createProject(team);
        uploadPdf(projectId, typeId, team.leaderToken()).expect(200);

        Response refused =
                delete("/api/v1/deliverable-types/" + typeId, macondolab).expect(409);
        assertThat(refused.json("$.detail").toString()).contains("ya hay proyectos que lo entregaron");
    }

    @Test
    void deletingTheProjectTakesItsFilesAlong() {
        String macondolab = loginAs(Role.MACONDOLAB);
        int typeId = createType(macondolab, "Póster " + System.nanoTime(), "DOCUMENT", true, 1);
        Team team = newTeam();
        int projectId = createProject(team);
        Response uploaded = uploadPdf(projectId, typeId, team.leaderToken()).expect(200);
        String fileId = ((List<String>) uploaded.json("$[?(@.type.id == " + typeId + ")].files[*].fileId")).getFirst();

        delete("/api/v1/projects/" + projectId, team.leaderToken()).expect(204);

        get("/api/v1/files/" + fileId, team.leaderToken()).expect(404);
        get("/api/v1/projects/" + projectId + "/deliverables", team.leaderToken())
                .expect(404);
    }

    // ── Datos de apoyo ──────────────────────────────────────────────────────

    private record Team(
            String leaderEmail, String leaderToken, String memberEmail, String memberToken, String teacherEmail) {}

    private Team newTeam() {
        String leader = createAccount(Role.STUDENT);
        String member = createAccount(Role.STUDENT);
        String teacher = createAccount(Role.TEACHER);
        return new Team(leader, login(leader, PASSWORD), member, login(member, PASSWORD), teacher);
    }

    private int createProject(Team team) {
        Map<String, Object> body = new HashMap<>();
        body.put("editionId", openEdition());
        body.put("track", TRACK);
        body.put("title", "Proyecto con entregables");
        body.put("summary", "Una propuesta de valor de prueba.");
        body.put(
                "sectorId",
                ((List<Integer>) get("/api/v1/sectors", null).expect(200).json("$[*].id")).getFirst());
        body.put("teacherId", idOf(team.teacherEmail()));
        return post("/api/v1/projects", team.leaderToken(), body).expect(201).json("$.id");
    }

    private int createType(String token, String name, String kind, boolean required, int maxFiles) {
        return post("/api/v1/deliverable-types", token, typeBody(name, kind, required, maxFiles))
                .expect(201)
                .json("$.id");
    }

    private Map<String, Object> typeBody(String name, String kind, boolean required, int maxFiles) {
        Map<String, Object> body = new HashMap<>();
        body.put("editionId", openEdition());
        body.put("track", TRACK);
        body.put("name", name);
        body.put("description", "Entregable de prueba");
        body.put("kind", kind);
        body.put("required", required);
        body.put("maxFiles", maxFiles);
        body.put("sortOrder", 1);
        return body;
    }

    private Response uploadPdf(int projectId, int typeId, String token) {
        return putOrPostFile(projectId, typeId, token, "poster.pdf", MediaType.APPLICATION_PDF, TestData.PDF);
    }

    private Response putOrPostFile(
            int projectId, int typeId, String token, String filename, MediaType type, byte[] content) {
        return postFile(
                "/api/v1/projects/" + projectId + "/deliverables?deliverableTypeId=" + typeId,
                token,
                "file",
                filename,
                type,
                content);
    }
}
