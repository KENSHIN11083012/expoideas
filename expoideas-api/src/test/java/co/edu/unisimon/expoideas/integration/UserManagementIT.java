package co.edu.unisimon.expoideas.integration;

import static org.assertj.core.api.Assertions.assertThat;

import co.edu.unisimon.expoideas.users.Role;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * Gestión de cuentas: MacondoLab gestiona estudiantes, docentes y jurados; las
 * cuentas de gestión y el borrado quedan para el administrador.
 */
class UserManagementIT extends IntegrationTest {

    @Test
    void managementListsUsersWithAffiliation() {
        String admin = loginAs(Role.ADMIN);
        int faculty = createFaculty(admin);
        String email = uniqueEmail("listado");
        register(email, campusId(), faculty, createProgram(admin, faculty)).expect(201);

        Response list = get("/api/v1/admin/users", loginAs(Role.MACONDOLAB)).expect(200);
        List<String> programs = list.json("$[?(@.email == '" + email + "')].academicProgram");
        assertThat(programs).singleElement().asString().startsWith("Programa ");
    }

    @Test
    void onlyManagementRolesReachAdminRoutes() {
        get("/api/v1/admin/users", loginAs(Role.STUDENT)).expect(403);
        get("/api/v1/admin/users", loginAs(Role.TEACHER)).expect(403);
        get("/api/v1/admin/users", loginAs(Role.JUDGE)).expect(403);
        get("/api/v1/admin/users", loginAs(Role.MACONDOLAB)).expect(200);
        get("/api/v1/admin/users", loginAs(Role.ADMIN)).expect(200);
    }

    @Test
    void onlyAdminCreatesManagementAccounts() {
        String macondolab = loginAs(Role.MACONDOLAB);
        String admin = loginAs(Role.ADMIN);

        post("/api/v1/admin/users", macondolab, newAccount(uniqueEmail("gestion"), "ADMIN"))
                .expect(403);
        post("/api/v1/admin/users", macondolab, newAccount(uniqueEmail("gestion"), "MACONDOLAB"))
                .expect(403);
        post("/api/v1/admin/users", admin, newAccount(uniqueEmail("gestion"), "MACONDOLAB"))
                .expect(201);
    }

    @Test
    void onlyJudgesMayHaveExternalEmail() {
        String macondolab = loginAs(Role.MACONDOLAB);

        post("/api/v1/admin/users", macondolab, newAccount("externo" + System.nanoTime() + "@empresa.com", "JUDGE"))
                .expect(201);
        Response rejected = post(
                        "/api/v1/admin/users",
                        macondolab,
                        newAccount("externo" + System.nanoTime() + "@empresa.com", "STUDENT"))
                .expect(400);
        assertThat(rejected.<String>json("$.fields.email")).isNotBlank();
    }

    @Test
    void duplicateEmailIs409() {
        String admin = loginAs(Role.ADMIN);
        String email = createAccount(Role.STUDENT);
        post("/api/v1/admin/users", admin, newAccount(email, "JUDGE")).expect(409);
    }

    @Test
    void roleChangesFollowManagementRules() {
        String macondolab = loginAs(Role.MACONDOLAB);
        int student = idOf(createAccount(Role.STUDENT));
        int admin = idOf(createAccount(Role.ADMIN));

        Response changed = put("/api/v1/admin/users/" + student, macondolab, Map.of("role", "JUDGE"))
                .expect(200);
        assertThat(changed.<String>json("$.role")).isEqualTo("JUDGE");

        put("/api/v1/admin/users/" + student, macondolab, Map.of("role", "ADMIN"))
                .expect(403);
        put("/api/v1/admin/users/" + admin, macondolab, Map.of("role", "STUDENT"))
                .expect(403);
    }

    @Test
    void nobodyChangesOwnRole() {
        String email = createAccount(Role.ADMIN);
        put("/api/v1/admin/users/" + idOf(email), login(email, PASSWORD), Map.of("role", "STUDENT"))
                .expect(403);
    }

    @Test
    void onlyAdminDeletesAccountsButNotItself() {
        String adminEmail = createAccount(Role.ADMIN);
        String admin = login(adminEmail, PASSWORD);
        int student = idOf(createAccount(Role.STUDENT));

        delete("/api/v1/admin/users/" + student, loginAs(Role.MACONDOLAB)).expect(403);
        delete("/api/v1/admin/users/" + idOf(adminEmail), admin).expect(403);

        delete("/api/v1/admin/users/" + student, admin).expect(204);
        assertThat(userRepository.findById(student)).isEmpty();
        delete("/api/v1/admin/users/" + student, admin).expect(404);
    }

    private static Map<String, Object> newAccount(String email, String role) {
        return Map.of(
                "firstName", "Cuenta", "lastName", "Nueva", "email", email, "password", "Temporal#2026", "role", role);
    }
}
