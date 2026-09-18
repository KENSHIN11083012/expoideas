package co.edu.unisimon.expoideas.integration;

import co.edu.unisimon.expoideas.entity.RolUsuario;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Catálogos: lectura pública; los institucionales (sedes, facultades, programas)
 * los escribe el administrador y los de clasificación (categorías, keywords) también MacondoLab.
 */
class CatalogIT extends IntegrationTest {

    @Test
    void programsAreListedWithTheirFaculty() {
        String admin = loginAs(RolUsuario.admin);
        int faculty = createFaculty(admin);
        int program = createProgram(admin, faculty);

        Response list = get("/api/v1/programas-academicos", null).expect(200);
        List<Integer> faculties = list.json("$[?(@.id == " + program + ")].facultadId");
        List<String> names = list.json("$[?(@.id == " + program + ")].facultad");
        assertThat(faculties).containsExactly(faculty);
        assertThat(names).singleElement().asString().startsWith("Facultad ");
    }

    @Test
    void programRequiresAnExistingFaculty() {
        String admin = loginAs(RolUsuario.admin);
        post("/api/v1/programas-academicos", admin, Map.of("nombre", "Huérfano")).expect(400);
        post("/api/v1/programas-academicos", admin, Map.of("nombre", "Huérfano", "facultadId", 999_999)).expect(404);
    }

    @Test
    void institutionalCatalogsAreAdminOnly() {
        String macondolab = loginAs(RolUsuario.macondolab);
        post("/api/v1/facultades", macondolab, Map.of("nombre", "No permitida")).expect(403);
        post("/api/v1/sedes", macondolab, Map.of("nombre", "No permitida")).expect(403);
        post("/api/v1/sedes", null, Map.of("nombre", "Sin sesión")).expect(401);
    }

    @Test
    void classificationCatalogsAreWrittenByManagement() {
        String macondolab = loginAs(RolUsuario.macondolab);
        String name = "Categoría " + System.nanoTime();

        int id = post("/api/v1/categorias", macondolab, Map.of("nombre", name)).expect(201).json("$.id");
        post("/api/v1/categorias", macondolab, Map.of("nombre", name)).expect(409);
        put("/api/v1/categorias/" + id, macondolab, Map.of("nombre", name + " (editada)")).expect(200);
        post("/api/v1/keywords", macondolab, Map.of("nombre", "keyword-" + System.nanoTime())).expect(201);

        post("/api/v1/categorias", loginAs(RolUsuario.estudiante), Map.of("nombre", "Otra")).expect(403);

        List<String> names = get("/api/v1/categorias", null).expect(200).json("$[*].nombre");
        assertThat(names).contains(name + " (editada)");
    }

    @Test
    void updatingMissingItemIs404() {
        String admin = loginAs(RolUsuario.admin);
        put("/api/v1/facultades/999999", admin, Map.of("nombre", "Nada")).expect(404);
    }
}
