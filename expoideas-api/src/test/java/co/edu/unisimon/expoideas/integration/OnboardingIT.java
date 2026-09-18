package co.edu.unisimon.expoideas.integration;

import co.edu.unisimon.expoideas.entity.RolUsuario;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Primer ingreso: una cuenta con contraseña puesta por la gestión queda bloqueada
 * (403 con los pasos pendientes) hasta cambiarla y autorizar el tratamiento de datos.
 */
class OnboardingIT extends IntegrationTest {

    private static final String TEMPORAL = "Temporal#2026";
    private static final String DEFINITIVA = "Definitiva#2026";

    @Test
    void accountCreatedByManagementCompletesOnboarding() {
        String macondolab = loginAs(RolUsuario.macondolab);
        String email = uniqueEmail("jurado");

        Response created = post("/api/v1/admin/users", macondolab, Map.of(
                "nombres", "Jurado", "apellidos", "Externo", "correoInstitucional", email,
                "password", TEMPORAL, "rol", "jurado")).expect(201);
        assertThat(created.<List<String>>json("$.pendientes")).containsExactly("cambiarPassword", "autorizarDatos");

        Response login = post("/api/v1/auth/login", null, Map.of("email", email, "password", TEMPORAL)).expect(200);
        assertThat(login.<List<String>>json("$.pendientes")).containsExactly("cambiarPassword", "autorizarDatos");
        String token = login.json("$.token");

        // Permitido mientras tanto: ver su perfil y leer catálogos públicos.
        get("/api/v1/usuarios/me", token).expect(200);
        get("/api/v1/sedes", token).expect(200);

        // Cualquier otra cosa: 403 con los pasos que faltan.
        Response blocked = put("/api/v1/usuarios/me", token, Map.of("nombres", "X", "apellidos", "Y")).expect(403);
        assertThat(blocked.<List<String>>json("$.pendientes")).containsExactly("cambiarPassword", "autorizarDatos");

        put("/api/v1/usuarios/me/password", token, Map.of(
                "passwordActual", TEMPORAL, "passwordNueva", DEFINITIVA, "confirmacionPassword", DEFINITIVA))
                .expect(204);
        Response stillBlocked = put("/api/v1/usuarios/me", token, Map.of("nombres", "X", "apellidos", "Y")).expect(403);
        assertThat(stillBlocked.<List<String>>json("$.pendientes")).containsExactly("autorizarDatos");

        put("/api/v1/usuarios/me/autorizacion-datos", token, Map.of("autorizaDatos", false)).expect(400);
        put("/api/v1/usuarios/me/autorizacion-datos", token, Map.of("autorizaDatos", true)).expect(204);

        put("/api/v1/usuarios/me", token, Map.of("nombres", "Jurado", "apellidos", "Validado")).expect(200);
        Response again = post("/api/v1/auth/login", null, Map.of("email", email, "password", DEFINITIVA)).expect(200);
        assertThat(again.<List<String>>json("$.pendientes")).isEmpty();
    }

    @Test
    void passwordResetByManagementIsTemporary() {
        String admin = loginAs(RolUsuario.admin);
        String email = createAccount(RolUsuario.estudiante);

        post("/api/v1/usuarios/admin/reset-password?email=" + email, admin,
                Map.of("passwordNueva", TEMPORAL, "confirmacionPassword", TEMPORAL))
                .expect(204);

        post("/api/v1/auth/login", null, Map.of("email", email, "password", PASSWORD)).expect(401);
        Response login = post("/api/v1/auth/login", null, Map.of("email", email, "password", TEMPORAL)).expect(200);
        assertThat(login.<List<String>>json("$.pendientes")).containsExactly("cambiarPassword");
    }

    @Test
    void managementCannotResetOwnPasswordThroughAdminRoute() {
        String email = createAccount(RolUsuario.admin);
        String admin = login(email, PASSWORD);

        post("/api/v1/usuarios/admin/reset-password?email=" + email, admin,
                Map.of("passwordNueva", TEMPORAL, "confirmacionPassword", TEMPORAL))
                .expect(403);
    }

    @Test
    void teacherCreatedByManagementNeedsAffiliation() {
        String admin = loginAs(RolUsuario.admin);
        Map<String, Object> body = new HashMap<>(Map.of(
                "nombres", "Docente", "apellidos", "Nuevo", "correoInstitucional", uniqueEmail("docente"),
                "password", TEMPORAL, "rol", "docente"));

        Response missing = post("/api/v1/admin/users", admin, body).expect(400);
        assertThat(missing.<String>json("$.campos.sedeId")).isNotBlank();
        assertThat(missing.<String>json("$.campos.facultadId")).isNotBlank();

        body.put("sedeId", campusId());
        body.put("facultadId", createFaculty(admin));
        post("/api/v1/admin/users", admin, body).expect(201);
    }
}
