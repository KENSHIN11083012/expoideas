package co.edu.unisimon.expoideas.integration;

import static org.assertj.core.api.Assertions.assertThat;

import co.edu.unisimon.expoideas.users.Role;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Registro, inicio de sesión, perfil propio y cambio de contraseña. */
class AccountIT extends IntegrationTest {

    @Test
    void studentRegistersLogsInAndSeesAffiliation() {
        String admin = loginAs(Role.ADMIN);
        int campus = campusId();
        int faculty = createFaculty(admin);
        int program = createProgram(admin, faculty);
        String email = uniqueEmail("registro");

        Response created = register(email, campus, faculty, program).expect(201);
        assertThat(created.<String>json("$.role")).isEqualTo("STUDENT");
        assertThat(created.<List<String>>json("$.pendingSteps")).isEmpty();

        Response login = post("/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD))
                .expect(200);
        assertThat(login.<String>json("$.role")).isEqualTo("STUDENT");
        assertThat(login.<String>json("$.firstName")).isEqualTo("Estudiante");
        assertThat(login.<List<String>>json("$.pendingSteps")).isEmpty();

        Response me = get("/api/v1/users/me", login.json("$.token")).expect(200);
        assertThat(me.<String>json("$.email")).isEqualTo(email);
        assertThat(me.<Integer>json("$.campusId")).isEqualTo(campus);
        assertThat(me.<Integer>json("$.facultyId")).isEqualTo(faculty);
        assertThat(me.<Integer>json("$.academicProgramId")).isEqualTo(program);
        assertThat(me.<String>json("$.campus")).isNotBlank();
        assertThat(me.<String>json("$.faculty")).startsWith("Facultad ");
        assertThat(me.<String>json("$.academicProgram")).startsWith("Programa ");
    }

    @Test
    void registrationRejectsDuplicatesForeignEmailsAndMismatchedProgram() {
        String admin = loginAs(Role.ADMIN);
        int campus = campusId();
        int faculty = createFaculty(admin);
        int otherFaculty = createFaculty(admin);
        int otherProgram = createProgram(admin, otherFaculty);
        String email = uniqueEmail("duplicado");

        register(email, campus, faculty, null).expect(201);
        register(email, campus, faculty, null).expect(409);

        Response foreign = register("alguien@gmail.com", campus, faculty, null).expect(400);
        assertThat(foreign.<String>json("$.fields.email")).isNotBlank();

        register(uniqueEmail("cruzado"), campus, faculty, otherProgram).expect(400);
        register(uniqueEmail("sinfacultad"), campus, 999_999, null).expect(404);
    }

    @Test
    void registrationRequiresDataConsent() {
        String admin = loginAs(Role.ADMIN);
        Map<String, Object> body = new HashMap<>();
        body.put("firstName", "Sin");
        body.put("lastName", "Consentimiento");
        body.put("email", uniqueEmail("consentimiento"));
        body.put("password", PASSWORD);
        body.put("campusId", campusId());
        body.put("facultyId", createFaculty(admin));
        body.put("dataConsent", false);

        Response response = post("/api/v1/auth/register", null, body).expect(400);
        assertThat(response.<String>json("$.fields.dataConsent")).isNotBlank();
    }

    @Test
    void wrongPasswordIs401() {
        String email = createAccount(Role.STUDENT);
        post("/api/v1/auth/login", null, Map.of("email", email, "password", "Otra#2026"))
                .expect(401);
        post("/api/v1/auth/login", null, Map.of("email", uniqueEmail("nadie"), "password", PASSWORD))
                .expect(401);
    }

    @Test
    void userUpdatesOwnProfile() {
        String admin = loginAs(Role.ADMIN);
        int campus = campusId();
        int faculty = createFaculty(admin);
        String email = uniqueEmail("perfil");
        register(email, campus, faculty, null).expect(201);
        String token = login(email, PASSWORD);

        Map<String, Object> body = new HashMap<>();
        body.put("firstName", "  Ana María ");
        body.put("lastName", "Pérez Gómez");
        body.put("campusId", campus);
        body.put("facultyId", faculty);
        Response updated = put("/api/v1/users/me", token, body).expect(200);
        assertThat(updated.<String>json("$.firstName")).isEqualTo("Ana María");
        assertThat(updated.<String>json("$.lastName")).isEqualTo("Pérez Gómez");

        body.remove("facultyId");
        Response missing = put("/api/v1/users/me", token, body).expect(400);
        assertThat(missing.<String>json("$.fields.facultyId")).isNotBlank();
    }

    @Test
    void userChangesOwnPassword() {
        String email = createAccount(Role.STUDENT);
        String token = login(email, PASSWORD);
        String nueva = "Nueva#2026";

        put(
                        "/api/v1/users/me/password",
                        token,
                        Map.of("currentPassword", "Incorrecta#1", "newPassword", nueva, "confirmPassword", nueva))
                .expect(400);
        put(
                        "/api/v1/users/me/password",
                        token,
                        Map.of("currentPassword", PASSWORD, "newPassword", nueva, "confirmPassword", "Distinta#2026"))
                .expect(400);
        put(
                        "/api/v1/users/me/password",
                        token,
                        Map.of("currentPassword", PASSWORD, "newPassword", nueva, "confirmPassword", nueva))
                .expect(204);

        post("/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD))
                .expect(401);
        login(email, nueva);
    }

    @Test
    void permissionsComeFromTheDatabaseOnEveryRequest() {
        String email = createAccount(Role.ADMIN);
        String token = login(email, PASSWORD);
        get("/api/v1/admin/users", token).expect(200);

        var admin = userRepository.findByEmail(email).orElseThrow();
        admin.setRole(Role.STUDENT);
        userRepository.save(admin);

        // El mismo token, sin volver a iniciar sesión: el rol se lee de la BD.
        get("/api/v1/admin/users", token).expect(403);
    }

    @Test
    void deletedAccountTokenStopsWorking() {
        String email = createAccount(Role.STUDENT);
        String token = login(email, PASSWORD);
        get("/api/v1/users/me", token).expect(200);

        userRepository.delete(userRepository.findByEmail(email).orElseThrow());

        get("/api/v1/users/me", token).expect(401);
    }
}
