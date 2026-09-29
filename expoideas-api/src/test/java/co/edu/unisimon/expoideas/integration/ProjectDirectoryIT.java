package co.edu.unisimon.expoideas.integration;

import static org.assertj.core.api.Assertions.assertThat;

import co.edu.unisimon.expoideas.users.Role;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

/**
 * Listado de proyectos para la gestión y los docentes: quién ve qué, los
 * filtros y la exportación a CSV.
 */
class ProjectDirectoryIT extends IntegrationTest {

    @Test
    void managementSeesEveryProjectAndFiltersIt() {
        Fixture first = newProject("Proyecto de gestión A " + System.nanoTime());
        Fixture second = newProject("Proyecto de gestión B " + System.nanoTime());
        String macondolab = loginAs(Role.MACONDOLAB);

        List<String> all = get("/api/v1/projects", macondolab).expect(200).json("$[*].title");
        assertThat(all).contains(first.title(), second.title());

        List<String> byTeacher = get("/api/v1/projects?teacherId=" + idOf(first.teacherEmail()), macondolab)
                .expect(200)
                .json("$[*].title");
        assertThat(byTeacher).containsExactly(first.title());

        List<String> bySearch = get("/api/v1/projects?search=" + second.title().substring(0, 18), macondolab)
                .expect(200)
                .json("$[*].title");
        assertThat(bySearch).contains(second.title());

        List<String> byOtherTrack = get("/api/v1/projects?track=INNPRENDE_II", macondolab)
                .expect(200)
                .json("$[*].title");
        assertThat(byOtherTrack).doesNotContain(first.title());
    }

    @Test
    void aTeacherOnlySeesTheProjectsThatNameThem() {
        Fixture mine = newProject("Proyecto del docente " + System.nanoTime());
        Fixture other = newProject("Proyecto de otro docente " + System.nanoTime());

        String teacher = login(mine.teacherEmail(), PASSWORD);
        List<String> titles = get("/api/v1/projects", teacher).expect(200).json("$[*].title");
        assertThat(titles).containsExactly(mine.title());

        // Pedir los de otro docente no cambia nada: sigue viendo los suyos.
        List<String> forced = get("/api/v1/projects?teacherId=" + idOf(other.teacherEmail()), teacher)
                .expect(200)
                .json("$[*].title");
        assertThat(forced).containsExactly(mine.title());
    }

    @Test
    void studentsAndVisitorsDoNotGetTheDirectory() {
        get("/api/v1/projects", loginAs(Role.STUDENT)).expect(403);
        get("/api/v1/projects", loginAs(Role.JUDGE)).expect(403);
        get("/api/v1/projects", null).expect(401);
    }

    @Test
    void theSummaryCountsTheTeamAndTheDeliverables() {
        Fixture project = newProject("Proyecto con conteo " + System.nanoTime());
        String macondolab = loginAs(Role.MACONDOLAB);

        Response summary = get("/api/v1/projects?search=" + project.title().substring(0, 18), macondolab)
                .expect(200);
        List<Integer> members = summary.json("$[?(@.title == '" + project.title() + "')].members");
        List<String> leaders = summary.json("$[?(@.title == '" + project.title() + "')].leader");
        assertThat(members).containsExactly(1);
        assertThat(leaders).containsExactly("Prueba STUDENT");
    }

    @Test
    void theListIsExportedAsCsvForASpreadsheet() {
        Fixture project = newProject("Proyecto exportado " + System.nanoTime());
        String macondolab = loginAs(Role.MACONDOLAB);

        Response csv = get("/api/v1/projects/export", macondolab).expect(200);
        String body = new String(csv.bytes(), StandardCharsets.UTF_8);

        assertThat(csv.headers().getFirst(HttpHeaders.CONTENT_TYPE)).contains("text/csv");
        assertThat(csv.headers().getFirst(HttpHeaders.CONTENT_DISPOSITION)).contains("attachment");
        // Con BOM, para que Excel en español muestre bien las tildes.
        assertThat(body).startsWith("﻿Edición;Cátedra;Proyecto");
        assertThat(body).contains(project.title()).contains("INNPRENDE I");

        get("/api/v1/projects/export", loginAs(Role.STUDENT)).expect(403);
    }

    // ── Datos de apoyo ──────────────────────────────────────────────────────

    private record Fixture(String title, String leaderToken, String teacherEmail) {}

    private Fixture newProject(String title) {
        String leader = createAccount(Role.STUDENT);
        String teacher = createAccount(Role.TEACHER);
        String token = login(leader, PASSWORD);

        Map<String, Object> body = new HashMap<>();
        body.put("editionId", openEdition());
        body.put("track", "INNPRENDE_I");
        body.put("title", title);
        body.put("summary", "Propuesta de valor de prueba.");
        body.put(
                "sectorId",
                ((List<Integer>) get("/api/v1/sectors", null).expect(200).json("$[*].id")).getFirst());
        body.put("teacherId", idOf(teacher));
        post("/api/v1/projects", token, body).expect(201);

        return new Fixture(title, token, teacher);
    }
}
