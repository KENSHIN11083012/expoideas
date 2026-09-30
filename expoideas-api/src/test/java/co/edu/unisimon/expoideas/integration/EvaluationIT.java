package co.edu.unisimon.expoideas.integration;

import static org.assertj.core.api.Assertions.assertThat;

import co.edu.unisimon.expoideas.users.Role;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * Evaluación con rúbrica contra MySQL: las rúbricas que cargan las migraciones,
 * el recorrido de un jurado (calificar, corregir, marcar que no asistieron) y
 * la nota que ven el profesor del grupo y la gestión.
 */
class EvaluationIT extends IntegrationTest {

    @Test
    void theRubricsComeLoadedAsMacondoLabDeliveredThem() {
        String token = loginAs(Role.JUDGE);

        Response poster = get("/api/v1/rubrics/INNPRENDE_I", token).expect(200);
        List<String> posterCriteria = poster.json("$.criteria[*].shortName");
        assertThat(posterCriteria)
                .hasSize(6)
                .startsWith("Aspectos formales (nombre, autores, referencias)", "Planteamiento del problema");
        // En el póster los valores cambian según el criterio: así está en la tabla del documento.
        assertThat(scores(poster, 0)).containsExactly(0.0, 1.5, 4.0, 4.5, 5.0);
        assertThat(scores(poster, 1)).containsExactly(0.0, 1.5, 3.5, 4.5, 5.0);
        assertThat(scores(poster, 3)).containsExactly(1.5, 3.0, 4.0, 4.5, 5.0);
        List<String> posterLabels = poster.json("$.criteria[0].levels[*].label");
        assertThat(posterLabels).containsExactly("Insuficiente", "Deficiente", "Aceptable", "Bueno", "Excelente");

        Response pitch = get("/api/v1/rubrics/INNPRENDE_II", token).expect(200);
        List<String> pitchCriteria = pitch.json("$.criteria[*].name");
        assertThat(pitchCriteria)
                .containsExactly("Propuesta de valor", "PitchDeck", "Modelo de negocio", "Prototipo", "Competidores");
        for (int criterion = 0; criterion < 5; criterion++) {
            assertThat(scores(pitch, criterion)).containsExactly(0.0, 1.5, 3.0, 4.0, 4.5, 5.0);
        }
        assertThat(pitch.<String>json("$.criteria[3].levels[4].description")).startsWith("Prototipo funcional");

        get("/api/v1/rubrics/INNPRENDE_I", null).expect(401);
    }

    @Test
    void aJurorEvaluatesCorrectsAndTheTeacherSeesTheGrade() {
        String macondolab = loginAs(Role.MACONDOLAB);
        String leaderEmail = createAccount(Role.STUDENT);
        String leader = login(leaderEmail, PASSWORD);
        String teacherEmail = createAccount(Role.TEACHER);
        String teacher = login(teacherEmail, PASSWORD);
        int projectId = createProject(leader, teacherEmail);
        String martaEmail = createAccount(Role.JUDGE);
        String marta = login(martaEmail, PASSWORD);
        String pedroEmail = createAccount(Role.TEACHER);
        String pedro = login(pedroEmail, PASSWORD);
        String mine = "/api/v1/projects/" + projectId + "/evaluations/mine";
        String results = "/api/v1/projects/" + projectId + "/evaluations";
        Response rubric = get("/api/v1/rubrics/INNPRENDE_I", macondolab).expect(200);

        // Sin asignación no hay nada que calificar: el proyecto ni se ve.
        get(mine, marta).expect(404);
        post("/api/v1/projects/" + projectId + "/jurors", macondolab, Map.of("email", martaEmail))
                .expect(201);
        post("/api/v1/projects/" + projectId + "/jurors", macondolab, Map.of("email", pedroEmail))
                .expect(201);
        get(mine, marta).expect(204);

        // Le falta un criterio, y un nivel por debajo de 3.0 pide observación.
        List<Map<String, Object>> incomplete = levels(rubric, 4, 4, 4, 4, 4);
        Response missing = put(mine, marta, Map.of("scores", incomplete)).expect(400);
        assertThat(missing.<String>json("$.fields['scores." + criterionId(rubric, 5) + ".levelId']"))
                .contains("Elige un nivel");
        List<Map<String, Object>> failing = levels(rubric, 4, 1, 4, 4, 4, 4);
        Response uncommented = put(mine, marta, Map.of("scores", failing)).expect(400);
        assertThat(uncommented.<String>json("$.fields['scores." + criterionId(rubric, 1) + ".comment']"))
                .contains("obligatoria por debajo de 3.0");

        // Con la observación entra: (5.0 + 1.5 + 5.0 + 5.0 + 5.0 + 5.0) / 6 = 4.4.
        failing.get(1).put("comment", "El problema quedó muy genérico.");
        Response saved = put(mine, marta, Map.of("scores", failing)).expect(200);
        assertThat(saved.<Double>json("$.grade")).isEqualTo(4.4);
        assertThat(saved.<String>json("$.scale")).isEqualTo("GOOD");
        assertThat(saved.<String>json("$.scores[1].comment")).isEqualTo("El problema quedó muy genérico.");

        // Corrige: ahora todo en el nivel más alto.
        Response corrected = put(mine, marta, Map.of("scores", levels(rubric, 4, 4, 4, 4, 4, 4)))
                .expect(200);
        assertThat(corrected.<Double>json("$.grade")).isEqualTo(5.0);
        assertThat(corrected.<Integer>json("$.id")).isEqualTo(saved.<Integer>json("$.id"));
        assertThat(get(mine, marta).expect(200).<List<Object>>json("$.scores")).hasSize(6);
        List<Integer> martaDone =
                get("/api/v1/evaluations/mine", marta).expect(200).json("$[*].projectId");
        assertThat(martaDone).containsExactly(projectId);

        // Con uno de dos jurados, la nota ya existe y se ve quién falta.
        Response half = get(results, teacher).expect(200);
        assertThat(half.<Double>json("$.grade")).isEqualTo(5.0);
        assertThat(half.<Integer>json("$.jurors")).isEqualTo(2);
        List<Integer> pending = half.json("$.pending[*].userId");
        assertThat(pending).containsExactly(idOf(pedroEmail));

        // El segundo jurado marca que el equipo no asistió: 0.0, y el promedio baja a 2.5.
        Response absent = put(mine, pedro, Map.of("absent", true)).expect(200);
        assertThat(absent.<Double>json("$.grade")).isEqualTo(0.0);
        assertThat(absent.<List<Object>>json("$.scores")).isEmpty();
        Response both = get(results, macondolab).expect(200);
        assertThat(both.<Double>json("$.grade")).isEqualTo(2.5);
        assertThat(both.<String>json("$.scale")).isEqualTo("FAILING");
        assertThat(both.<List<Object>>json("$.pending")).isEmpty();

        // Las notas no son para el equipo ni para los jurados; y el profesor del grupo no califica.
        get(results, leader).expect(403);
        get(results, marta).expect(403);
        put(mine, teacher, Map.of("absent", true)).expect(403);
        get(results, loginAs(Role.JUDGE)).expect(404);

        // Si la gestión quita a un jurado, su evaluación deja de contar.
        delete("/api/v1/projects/" + projectId + "/jurors/" + idOf(pedroEmail), macondolab)
                .expect(204);
        Response afterRemoval = get(results, teacher).expect(200);
        assertThat(afterRemoval.<Double>json("$.grade")).isEqualTo(5.0);
        assertThat(afterRemoval.<Integer>json("$.jurors")).isEqualTo(1);

        // Una cuenta que ya calificó no se elimina.
        Response kept = delete("/api/v1/admin/users/" + idOf(martaEmail), loginAs(Role.ADMIN))
                .expect(409);
        assertThat(kept.<String>json("$.detail")).contains("ya calificó");
    }

    // ── Datos de apoyo ──────────────────────────────────────────────────────

    private int createProject(String leaderToken, String teacherEmail) {
        Map<String, Object> body = new HashMap<>();
        body.put("editionId", openEdition());
        body.put("track", "INNPRENDE_I");
        body.put("title", "Proyecto por evaluar " + System.nanoTime());
        body.put("summary", "Una propuesta de valor de prueba.");
        body.put(
                "sectorId",
                ((List<Integer>) get("/api/v1/sectors", null).expect(200).json("$[*].id")).getFirst());
        body.put("teacherId", idOf(teacherEmail));
        return post("/api/v1/projects", leaderToken, body).expect(201).json("$.id");
    }

    private static List<Double> scores(Response rubric, int criterion) {
        return rubric.json("$.criteria[" + criterion + "].levels[*].score");
    }

    private static int criterionId(Response rubric, int criterion) {
        return rubric.json("$.criteria[" + criterion + "].id");
    }

    /** Un nivel por criterio, en orden: la posición (desde 0) del nivel elegido en cada uno. */
    private static List<Map<String, Object>> levels(Response rubric, int... positions) {
        List<Map<String, Object>> scores = new ArrayList<>();
        for (int criterion = 0; criterion < positions.length; criterion++) {
            Map<String, Object> score = new HashMap<>();
            score.put("criterionId", criterionId(rubric, criterion));
            score.put(
                    "levelId",
                    rubric.<Integer>json("$.criteria[" + criterion + "].levels[" + positions[criterion] + "].id"));
            scores.add(score);
        }
        return scores;
    }
}
