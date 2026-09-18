package co.edu.unisimon.expoideas.integration;

import co.edu.unisimon.expoideas.entity.RolUsuario;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Gestión de cuentas: MacondoLab gestiona estudiantes, docentes y jurados; las
 * cuentas de gestión y el borrado quedan para el administrador.
 */
class UserManagementIT extends IntegrationTest {

    @Test
    void managementListsUsersWithAffiliation() {
        String admin = loginAs(RolUsuario.admin);
        int faculty = createFaculty(admin);
        String email = uniqueEmail("listado");
        register(email, campusId(), faculty, createProgram(admin, faculty)).expect(201);

        Response list = get("/api/v1/admin/users", loginAs(RolUsuario.macondolab)).expect(200);
        List<String> programs = list.json("$[?(@.correoInstitucional == '" + email + "')].programaAcademico");
        assertThat(programs).singleElement().asString().startsWith("Programa ");
    }

    @Test
    void onlyManagementRolesReachAdminRoutes() {
        get("/api/v1/admin/users", loginAs(RolUsuario.estudiante)).expect(403);
        get("/api/v1/admin/users", loginAs(RolUsuario.docente)).expect(403);
        get("/api/v1/admin/users", loginAs(RolUsuario.jurado)).expect(403);
        get("/api/v1/admin/users", loginAs(RolUsuario.macondolab)).expect(200);
        get("/api/v1/admin/users", loginAs(RolUsuario.admin)).expect(200);
    }

    @Test
    void onlyAdminCreatesManagementAccounts() {
        String macondolab = loginAs(RolUsuario.macondolab);
        String admin = loginAs(RolUsuario.admin);

        post("/api/v1/admin/users", macondolab, newAccount(uniqueEmail("gestion"), "admin")).expect(403);
        post("/api/v1/admin/users", macondolab, newAccount(uniqueEmail("gestion"), "macondolab")).expect(403);
        post("/api/v1/admin/users", admin, newAccount(uniqueEmail("gestion"), "macondolab")).expect(201);
    }

    @Test
    void onlyJudgesMayHaveExternalEmail() {
        String macondolab = loginAs(RolUsuario.macondolab);

        post("/api/v1/admin/users", macondolab, newAccount("externo" + System.nanoTime() + "@empresa.com", "jurado"))
                .expect(201);
        Response rejected = post("/api/v1/admin/users", macondolab,
                        newAccount("externo" + System.nanoTime() + "@empresa.com", "estudiante"))
                .expect(400);
        assertThat(rejected.<String>json("$.campos.correoInstitucional")).isNotBlank();
    }

    @Test
    void duplicateEmailIs409() {
        String admin = loginAs(RolUsuario.admin);
        String email = createAccount(RolUsuario.estudiante);
        post("/api/v1/admin/users", admin, newAccount(email, "jurado")).expect(409);
    }

    @Test
    void roleChangesFollowManagementRules() {
        String macondolab = loginAs(RolUsuario.macondolab);
        int student = idOf(createAccount(RolUsuario.estudiante));
        int admin = idOf(createAccount(RolUsuario.admin));

        Response changed = put("/api/v1/admin/users/" + student, macondolab, Map.of("rol", "jurado")).expect(200);
        assertThat(changed.<String>json("$.rol")).isEqualTo("jurado");

        put("/api/v1/admin/users/" + student, macondolab, Map.of("rol", "admin")).expect(403);
        put("/api/v1/admin/users/" + admin, macondolab, Map.of("rol", "estudiante")).expect(403);
    }

    @Test
    void nobodyChangesOwnRole() {
        String email = createAccount(RolUsuario.admin);
        put("/api/v1/admin/users/" + idOf(email), login(email, PASSWORD), Map.of("rol", "estudiante")).expect(403);
    }

    @Test
    void onlyAdminDeletesAccountsButNotItself() {
        String adminEmail = createAccount(RolUsuario.admin);
        String admin = login(adminEmail, PASSWORD);
        int student = idOf(createAccount(RolUsuario.estudiante));

        delete("/api/v1/admin/users/" + student, loginAs(RolUsuario.macondolab)).expect(403);
        delete("/api/v1/admin/users/" + idOf(adminEmail), admin).expect(403);

        delete("/api/v1/admin/users/" + student, admin).expect(204);
        assertThat(usuarioRepository.findById(student)).isEmpty();
        delete("/api/v1/admin/users/" + student, admin).expect(404);
    }

    private int idOf(String email) {
        return usuarioRepository.findByCorreoInstitucional(email).orElseThrow().getId();
    }

    private static Map<String, Object> newAccount(String email, String rol) {
        return Map.of("nombres", "Cuenta", "apellidos", "Nueva", "correoInstitucional", email,
                "password", "Temporal#2026", "rol", rol);
    }
}
