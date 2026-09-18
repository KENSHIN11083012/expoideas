package co.edu.unisimon.expoideas.integration;

import co.edu.unisimon.expoideas.entity.RolUsuario;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Registro, inicio de sesión, perfil propio y cambio de contraseña. */
class AccountIT extends IntegrationTest {

    @Test
    void studentRegistersLogsInAndSeesAffiliation() {
        String admin = loginAs(RolUsuario.admin);
        int campus = campusId();
        int faculty = createFaculty(admin);
        int program = createProgram(admin, faculty);
        String email = uniqueEmail("registro");

        Response created = register(email, campus, faculty, program).expect(201);
        assertThat(created.<String>json("$.rol")).isEqualTo("estudiante");
        assertThat(created.<List<String>>json("$.pendientes")).isEmpty();

        Response login = post("/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD)).expect(200);
        assertThat(login.<String>json("$.rol")).isEqualTo("estudiante");
        assertThat(login.<String>json("$.nombres")).isEqualTo("Estudiante");
        assertThat(login.<List<String>>json("$.pendientes")).isEmpty();

        Response me = get("/api/v1/usuarios/me", login.json("$.token")).expect(200);
        assertThat(me.<String>json("$.correoInstitucional")).isEqualTo(email);
        assertThat(me.<Integer>json("$.sedeId")).isEqualTo(campus);
        assertThat(me.<Integer>json("$.facultadId")).isEqualTo(faculty);
        assertThat(me.<Integer>json("$.programaAcademicoId")).isEqualTo(program);
        assertThat(me.<String>json("$.sede")).isNotBlank();
        assertThat(me.<String>json("$.facultad")).startsWith("Facultad ");
        assertThat(me.<String>json("$.programaAcademico")).startsWith("Programa ");
    }

    @Test
    void registrationRejectsDuplicatesForeignEmailsAndMismatchedProgram() {
        String admin = loginAs(RolUsuario.admin);
        int campus = campusId();
        int faculty = createFaculty(admin);
        int otherFaculty = createFaculty(admin);
        int otherProgram = createProgram(admin, otherFaculty);
        String email = uniqueEmail("duplicado");

        register(email, campus, faculty, null).expect(201);
        register(email, campus, faculty, null).expect(409);

        Response foreign = register("alguien@gmail.com", campus, faculty, null).expect(400);
        assertThat(foreign.<String>json("$.campos.correoInstitucional")).isNotBlank();

        register(uniqueEmail("cruzado"), campus, faculty, otherProgram).expect(400);
        register(uniqueEmail("sinfacultad"), campus, 999_999, null).expect(404);
    }

    @Test
    void registrationRequiresDataConsent() {
        String admin = loginAs(RolUsuario.admin);
        Map<String, Object> body = new HashMap<>();
        body.put("nombres", "Sin");
        body.put("apellidos", "Consentimiento");
        body.put("correoInstitucional", uniqueEmail("consentimiento"));
        body.put("password", PASSWORD);
        body.put("sedeId", campusId());
        body.put("facultadId", createFaculty(admin));
        body.put("autorizaDatos", false);

        Response response = post("/api/v1/usuarios/registro", null, body).expect(400);
        assertThat(response.<String>json("$.campos.autorizaDatos")).isNotBlank();
    }

    @Test
    void wrongPasswordIs401() {
        String email = createAccount(RolUsuario.estudiante);
        post("/api/v1/auth/login", null, Map.of("email", email, "password", "Otra#2026")).expect(401);
        post("/api/v1/auth/login", null, Map.of("email", uniqueEmail("nadie"), "password", PASSWORD)).expect(401);
    }

    @Test
    void userUpdatesOwnProfile() {
        String admin = loginAs(RolUsuario.admin);
        int campus = campusId();
        int faculty = createFaculty(admin);
        String email = uniqueEmail("perfil");
        register(email, campus, faculty, null).expect(201);
        String token = login(email, PASSWORD);

        Map<String, Object> body = new HashMap<>();
        body.put("nombres", "  Ana María ");
        body.put("apellidos", "Pérez Gómez");
        body.put("sedeId", campus);
        body.put("facultadId", faculty);
        Response updated = put("/api/v1/usuarios/me", token, body).expect(200);
        assertThat(updated.<String>json("$.nombres")).isEqualTo("Ana María");
        assertThat(updated.<String>json("$.apellidos")).isEqualTo("Pérez Gómez");

        body.remove("facultadId");
        Response missing = put("/api/v1/usuarios/me", token, body).expect(400);
        assertThat(missing.<String>json("$.campos.facultadId")).isNotBlank();
    }

    @Test
    void userChangesOwnPassword() {
        String email = createAccount(RolUsuario.estudiante);
        String token = login(email, PASSWORD);
        String nueva = "Nueva#2026";

        put("/api/v1/usuarios/me/password", token, Map.of(
                "passwordActual", "Incorrecta#1", "passwordNueva", nueva, "confirmacionPassword", nueva))
                .expect(400);
        put("/api/v1/usuarios/me/password", token, Map.of(
                "passwordActual", PASSWORD, "passwordNueva", nueva, "confirmacionPassword", "Distinta#2026"))
                .expect(400);
        put("/api/v1/usuarios/me/password", token, Map.of(
                "passwordActual", PASSWORD, "passwordNueva", nueva, "confirmacionPassword", nueva))
                .expect(204);

        post("/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD)).expect(401);
        login(email, nueva);
    }

    @Test
    void permissionsComeFromTheDatabaseOnEveryRequest() {
        String email = createAccount(RolUsuario.admin);
        String token = login(email, PASSWORD);
        get("/api/v1/admin/users", token).expect(200);

        var admin = usuarioRepository.findByCorreoInstitucional(email).orElseThrow();
        admin.setRol(RolUsuario.estudiante);
        usuarioRepository.save(admin);

        // El mismo token, sin volver a iniciar sesión: el rol se lee de la BD.
        get("/api/v1/admin/users", token).expect(403);
    }

    @Test
    void deletedAccountTokenStopsWorking() {
        String email = createAccount(RolUsuario.estudiante);
        String token = login(email, PASSWORD);
        get("/api/v1/usuarios/me", token).expect(200);

        usuarioRepository.delete(usuarioRepository.findByCorreoInstitucional(email).orElseThrow());

        get("/api/v1/usuarios/me", token).expect(401);
    }
}
