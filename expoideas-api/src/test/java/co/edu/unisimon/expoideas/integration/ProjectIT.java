package co.edu.unisimon.expoideas.integration;

import static org.assertj.core.api.Assertions.assertThat;

import co.edu.unisimon.expoideas.users.Role;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * Inscripción de proyectos y equipo contra MySQL: quién inscribe, quién invita,
 * quién acepta y qué pasa cuando la inscripción está cerrada.
 */
class ProjectIT extends IntegrationTest {

    /** Edición que ya terminó, para probar los plazos. */
    private static Integer closedEditionId;

    private static final String TRACK = "INNPRENDE_I";

    // ── Inscripción y equipo ────────────────────────────────────────────────

    @Test
    void theLeaderRegistersAProjectAndInvitesAClassmate() {
        Team team = newTeam();

        Response project =
                post("/api/v1/projects", team.leaderToken(), projectBody(team)).expect(201);
        int projectId = project.json("$.id");
        List<String> roles = project.json("$.members[*].teamRole");
        List<String> statuses = project.json("$.members[*].status");
        assertThat(roles).containsExactly("LEADER");
        assertThat(statuses).containsExactly("ACCEPTED");
        assertThat((Integer) project.json("$.maxMembers")).isEqualTo(3);

        post("/api/v1/projects/" + projectId + "/invitations", team.leaderToken(), Map.of("email", team.memberEmail()))
                .expect(201);

        Response invitations = get("/api/v1/invitations", team.memberToken()).expect(200);
        List<String> titles = invitations.json("$[*].projectTitle");
        assertThat(titles).containsExactly("Proyecto de prueba");
        int invitationId = invitations.json("$[0].id");

        Response accepted = post("/api/v1/invitations/" + invitationId + "/acceptance", team.memberToken(), null)
                .expect(200);
        List<String> acceptedStatuses = accepted.json("$.members[*].status");
        assertThat(acceptedStatuses).containsExactly("ACCEPTED", "ACCEPTED");

        List<Integer> mine =
                get("/api/v1/projects/mine", team.memberToken()).expect(200).json("$[*].id");
        assertThat(mine).containsExactly(projectId);
    }

    @Test
    void anInvitationCanBeDeclinedAndSentAgain() {
        Team team = newTeam();
        int projectId = createProject(team);

        invite(projectId, team, team.memberEmail());
        int invitationId =
                get("/api/v1/invitations", team.memberToken()).expect(200).json("$[0].id");

        post("/api/v1/invitations/" + invitationId + "/rejection", team.memberToken(), null)
                .expect(204);

        List<Integer> pending =
                get("/api/v1/invitations", team.memberToken()).expect(200).json("$[*].id");
        assertThat(pending).isEmpty();

        List<String> team_ = get("/api/v1/projects/" + projectId, team.leaderToken())
                .expect(200)
                .json("$.members[*].teamRole");
        assertThat(team_).containsExactly("LEADER");

        // El líder puede volver a invitar a la misma persona.
        invite(projectId, team, team.memberEmail());
    }

    @Test
    void eachStudentHasOneProjectPerTrack() {
        Team team = newTeam();
        createProject(team);

        post("/api/v1/projects", team.leaderToken(), projectBody(team)).expect(409);
    }

    @Test
    void anAcceptedMemberCannotJoinAnotherTeamOfTheSameTrack() {
        Team first = newTeam();
        int firstProject = createProject(first);
        invite(firstProject, first, first.memberEmail());
        int invitationId =
                get("/api/v1/invitations", first.memberToken()).expect(200).json("$[0].id");
        post("/api/v1/invitations/" + invitationId + "/acceptance", first.memberToken(), null)
                .expect(200);

        Team second = newTeam();
        int secondProject = createProject(second);
        Response rejected = post(
                        "/api/v1/projects/" + secondProject + "/invitations",
                        second.leaderToken(),
                        Map.of("email", first.memberEmail()))
                .expect(400);
        assertThat(rejected.json("$.fields.email").toString()).contains("ya tiene un proyecto");
    }

    @Test
    void theTeamCannotExceedTheMaximum() {
        Team team = newTeam();
        int projectId = createProject(team);

        // El máximo de la cátedra es 3 y el líder ya ocupa un lugar.
        invite(projectId, team, team.memberEmail());
        invite(projectId, team, createAccount(Role.STUDENT));

        Response full = post(
                        "/api/v1/projects/" + projectId + "/invitations",
                        team.leaderToken(),
                        Map.of("email", createAccount(Role.STUDENT)))
                .expect(409);
        assertThat(full.json("$.detail").toString()).contains("máximo de 3");
    }

    @Test
    void onlyStudentsWithAnAccountAreInvited() {
        Team team = newTeam();
        int projectId = createProject(team);

        Response unknown = post(
                        "/api/v1/projects/" + projectId + "/invitations",
                        team.leaderToken(),
                        Map.of("email", "nadie@unisimon.edu.co"))
                .expect(400);
        assertThat(unknown.json("$.fields.email").toString()).contains("No hay una cuenta");

        Response teacher = post(
                        "/api/v1/projects/" + projectId + "/invitations",
                        team.leaderToken(),
                        Map.of("email", team.teacherEmail()))
                .expect(400);
        assertThat(teacher.json("$.fields.email").toString()).contains("estudiantes");
    }

    // ── Permisos ────────────────────────────────────────────────────────────

    @Test
    void onlyTheLeaderEditsTheProjectAndInvites() {
        Team team = newTeam();
        int projectId = createProject(team);
        invite(projectId, team, team.memberEmail());
        int invitationId =
                get("/api/v1/invitations", team.memberToken()).expect(200).json("$[0].id");
        post("/api/v1/invitations/" + invitationId + "/acceptance", team.memberToken(), null)
                .expect(200);

        Map<String, Object> changed = projectBody(team);
        changed.put("title", "Otro título");
        put("/api/v1/projects/" + projectId, team.memberToken(), changed).expect(403);
        post(
                        "/api/v1/projects/" + projectId + "/invitations",
                        team.memberToken(),
                        Map.of("email", createAccount(Role.STUDENT)))
                .expect(403);

        put("/api/v1/projects/" + projectId, team.leaderToken(), changed).expect(200);
        String title = get("/api/v1/projects/" + projectId, team.memberToken())
                .expect(200)
                .json("$.title");
        assertThat(title).isEqualTo("Otro título");
    }

    @Test
    void theProjectIsVisibleToItsTeacherAndManagementButNotToOtherStudents() {
        Team team = newTeam();
        int projectId = createProject(team);

        get("/api/v1/projects/" + projectId, login(team.teacherEmail(), PASSWORD))
                .expect(200);
        get("/api/v1/projects/" + projectId, loginAs(Role.MACONDOLAB)).expect(200);
        get("/api/v1/projects/" + projectId, loginAs(Role.STUDENT)).expect(404);
        get("/api/v1/projects/" + projectId, null).expect(401);
    }

    @Test
    void aMemberLeavesButTheLeaderCannot() {
        Team team = newTeam();
        int projectId = createProject(team);
        invite(projectId, team, team.memberEmail());
        int invitationId =
                get("/api/v1/invitations", team.memberToken()).expect(200).json("$[0].id");
        post("/api/v1/invitations/" + invitationId + "/acceptance", team.memberToken(), null)
                .expect(200);

        int memberId = idOf(team.memberEmail());
        int leaderId = idOf(team.leaderEmail());

        delete("/api/v1/projects/" + projectId + "/members/" + leaderId, team.leaderToken())
                .expect(403);
        delete("/api/v1/projects/" + projectId + "/members/" + memberId, team.memberToken())
                .expect(204);

        List<String> roles = get("/api/v1/projects/" + projectId, team.leaderToken())
                .expect(200)
                .json("$.members[*].teamRole");
        assertThat(roles).containsExactly("LEADER");
    }

    @Test
    void theLeaderDeletesTheRegistration() {
        Team team = newTeam();
        int projectId = createProject(team);

        delete("/api/v1/projects/" + projectId, loginAs(Role.STUDENT)).expect(404);
        delete("/api/v1/projects/" + projectId, team.leaderToken()).expect(204);
        get("/api/v1/projects/" + projectId, team.leaderToken()).expect(404);
    }

    // ── Plazos y datos ──────────────────────────────────────────────────────

    @Test
    void nothingIsRegisteredWhileTheEditionIsClosed() {
        Team team = newTeam();
        Map<String, Object> body = projectBody(team);
        body.put("editionId", closedEdition());

        Response closed = post("/api/v1/projects", team.leaderToken(), body).expect(409);
        assertThat(closed.json("$.detail").toString()).contains("no están abiertas");
    }

    @Test
    void theTeacherMustBeATeacherAccount() {
        Team team = newTeam();
        Map<String, Object> body = projectBody(team);
        body.put("teacherId", idOf(team.leaderEmail()));

        Response rejected = post("/api/v1/projects", team.leaderToken(), body).expect(400);
        assertThat(rejected.json("$.fields.teacherId").toString()).contains("docente");
    }

    @Test
    void teachersAreListedForTheForm() {
        Team team = newTeam();

        List<Integer> ids =
                get("/api/v1/teachers", team.leaderToken()).expect(200).json("$[*].id");
        assertThat(ids).contains(idOf(team.teacherEmail()));

        get("/api/v1/teachers", null).expect(401);
    }

    @Test
    void managementDoesNotRegisterProjects() {
        Team team = newTeam();

        post("/api/v1/projects", loginAs(Role.MACONDOLAB), projectBody(team)).expect(403);
        post("/api/v1/projects", login(team.teacherEmail(), PASSWORD), projectBody(team))
                .expect(403);
    }

    // ── Datos de apoyo ──────────────────────────────────────────────────────

    /** Líder, compañero y docente recién creados, con sus sesiones. */
    private record Team(
            String leaderEmail, String leaderToken, String memberEmail, String memberToken, String teacherEmail) {}

    private Team newTeam() {
        String leader = createAccount(Role.STUDENT);
        String member = createAccount(Role.STUDENT);
        String teacher = createAccount(Role.TEACHER);
        return new Team(leader, login(leader, PASSWORD), member, login(member, PASSWORD), teacher);
    }

    private Map<String, Object> projectBody(Team team) {
        Map<String, Object> body = new HashMap<>();
        body.put("editionId", openEdition());
        body.put("track", TRACK);
        body.put("title", "Proyecto de prueba");
        body.put("summary", "Una propuesta de valor de prueba para la inscripción.");
        body.put("sectorId", firstSectorId());
        body.put("teacherId", idOf(team.teacherEmail()));
        return body;
    }

    private int createProject(Team team) {
        return post("/api/v1/projects", team.leaderToken(), projectBody(team))
                .expect(201)
                .json("$.id");
    }

    private void invite(int projectId, Team team, String email) {
        post("/api/v1/projects/" + projectId + "/invitations", team.leaderToken(), Map.of("email", email))
                .expect(201);
    }

    private int firstSectorId() {
        List<Integer> ids = get("/api/v1/sectors", null).expect(200).json("$[*].id");
        return ids.getFirst();
    }

    private int closedEdition() {
        if (closedEditionId == null) {
            closedEditionId = createEdition(
                    "Expoideas cerrada " + System.nanoTime(),
                    LocalDate.of(2020, 1, 1),
                    LocalDate.of(2020, 2, 1),
                    LocalDate.of(2020, 3, 1));
        }
        return closedEditionId;
    }

    private int createEdition(String name, LocalDate opens, LocalDate registrationCloses, LocalDate submissionCloses) {
        return post(
                        "/api/v1/editions",
                        loginAs(Role.MACONDOLAB),
                        Map.of(
                                "name",
                                name,
                                "registrationOpensOn",
                                opens.toString(),
                                "registrationClosesOn",
                                registrationCloses.toString(),
                                "submissionClosesOn",
                                submissionCloses.toString(),
                                "tracks",
                                List.of(
                                        Map.of("track", "INNPRENDE_I", "minMembers", 1, "maxMembers", 3),
                                        Map.of("track", "INNPRENDE_II", "minMembers", 2, "maxMembers", 4))))
                .expect(201)
                .json("$.id");
    }
}
