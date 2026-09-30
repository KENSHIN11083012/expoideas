package co.edu.unisimon.expoideas.integration;

import static org.assertj.core.api.Assertions.assertThat;

import co.edu.unisimon.expoideas.users.Role;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Registro, primer ingreso de una cuenta registrada, perfil propio y cambio de contraseña. */
class AccountIT extends IntegrationTest {

    @Test
    void studentRegistersWithEmailAndPasswordAndCompletesTheProfileOnFirstLogin() {
        String admin = loginAs(Role.ADMIN);
        int campus = campusId();
        int faculty = createFaculty(admin);
        int program = createProgram(admin, faculty);
        String email = uniqueEmail("registro");

        Response created = register(email).expect(201);
        assertThat(created.<String>json("$.role")).isEqualTo("STUDENT");
        assertThat(created.<String>json("$.firstName")).isNull();
        assertThat(created.<List<String>>json("$.pendingSteps")).containsExactly("COMPLETE_PROFILE");

        Response login = post("/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD))
                .expect(200);
        assertThat(login.<List<String>>json("$.pendingSteps")).containsExactly("COMPLETE_PROFILE");
        String token = login.json("$.token");

        // Hasta completar el perfil solo puede verlo y completarlo.
        get("/api/v1/users/me", token).expect(200);
        Response blocked = delete("/api/v1/users/me/photo", token).expect(403);
        assertThat(blocked.<List<String>>json("$.pendingSteps")).containsExactly("COMPLETE_PROFILE");

        // El nombre solo no basta: un estudiante declara sede y facultad.
        Response missing = put("/api/v1/users/me", token, Map.of("firstName", "Ana", "lastName", "Pérez"))
                .expect(400);
        assertThat(missing.<String>json("$.fields.campusId")).isNotBlank();
        assertThat(missing.<String>json("$.fields.facultyId")).isNotBlank();

        Response completed = completeProfile(token, campus, faculty, program).expect(200);
        assertThat(completed.<List<String>>json("$.pendingSteps")).isEmpty();

        // Con el mismo token, la cuenta ya usa la plataforma.
        delete("/api/v1/users/me/photo", token).expect(204);

        Response again = post("/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD))
                .expect(200);
        assertThat(again.<String>json("$.firstName")).isEqualTo("Estudiante");
        assertThat(again.<List<String>>json("$.pendingSteps")).isEmpty();

        Response me = get("/api/v1/users/me", token).expect(200);
        assertThat(me.<String>json("$.email")).isEqualTo(email);
        assertThat(me.<Integer>json("$.campusId")).isEqualTo(campus);
        assertThat(me.<Integer>json("$.facultyId")).isEqualTo(faculty);
        assertThat(me.<Integer>json("$.academicProgramId")).isEqualTo(program);
        assertThat(me.<String>json("$.campus")).isNotBlank();
        assertThat(me.<String>json("$.faculty")).startsWith("Facultad ");
        assertThat(me.<String>json("$.academicProgram")).startsWith("Programa ");
    }

    @Test
    void registrationRejectsDuplicatesAndForeignEmailsButNotUpperCaseDomains() {
        String email = uniqueEmail("duplicado");

        register(email).expect(201);
        register(email).expect(409);

        Response foreign = register("alguien@gmail.com").expect(400);
        assertThat(foreign.<String>json("$.fields.email")).isNotBlank();

        // Un correo escrito con el dominio en mayúsculas sigue siendo institucional.
        register("Mayusculas" + System.nanoTime() + "@UNISIMON.EDU.CO").expect(201);
    }

    @Test
    void registrationRequiresDataConsent() {
        Map<String, Object> body = new HashMap<>();
        body.put("email", uniqueEmail("consentimiento"));
        body.put("password", PASSWORD);
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
        register(email).expect(201);
        String token = login(email, PASSWORD);
        completeProfile(token, campus, faculty, null).expect(200);

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
        // Jurado y no estudiante: sin adscripción, un estudiante tendría el perfil pendiente y el 403 sería por eso.
        admin.setRole(Role.JUDGE);
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
