package co.edu.unisimon.expoideas.catalogs;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Catálogos. La lectura es pública: la usa el registro antes de que haya sesión.
 * Sedes, facultades y programas los escribe el administrador; categorías y
 * keywords, también MacondoLab (ver SecurityConfig). No hay borrado: los
 * registros pueden estar referenciados por cuentas y programas.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    // ── Sedes ───────────────────────────────────────────────────────────────

    @GetMapping("/campuses")
    @SecurityRequirements
    public List<CatalogItemResponse> listCampuses() {
        return catalogService.listCampuses();
    }

    @PostMapping("/campuses")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogItemResponse createCampus(@Valid @RequestBody CatalogItemRequest request) {
        return catalogService.createCampus(request);
    }

    @PutMapping("/campuses/{id}")
    public CatalogItemResponse updateCampus(@PathVariable Integer id, @Valid @RequestBody CatalogItemRequest request) {
        return catalogService.updateCampus(id, request);
    }

    // ── Facultades ──────────────────────────────────────────────────────────

    @GetMapping("/faculties")
    @SecurityRequirements
    public List<CatalogItemResponse> listFaculties() {
        return catalogService.listFaculties();
    }

    @PostMapping("/faculties")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogItemResponse createFaculty(@Valid @RequestBody CatalogItemRequest request) {
        return catalogService.createFaculty(request);
    }

    @PutMapping("/faculties/{id}")
    public CatalogItemResponse updateFaculty(@PathVariable Integer id, @Valid @RequestBody CatalogItemRequest request) {
        return catalogService.updateFaculty(id, request);
    }

    // ── Programas académicos ────────────────────────────────────────────────

    @GetMapping("/academic-programs")
    @SecurityRequirements
    public List<AcademicProgramResponse> listAcademicPrograms() {
        return catalogService.listAcademicPrograms();
    }

    @PostMapping("/academic-programs")
    @ResponseStatus(HttpStatus.CREATED)
    public AcademicProgramResponse createAcademicProgram(@Valid @RequestBody AcademicProgramRequest request) {
        return catalogService.createAcademicProgram(request);
    }

    @PutMapping("/academic-programs/{id}")
    public AcademicProgramResponse updateAcademicProgram(
            @PathVariable Integer id, @Valid @RequestBody AcademicProgramRequest request) {
        return catalogService.updateAcademicProgram(id, request);
    }

    // ── Categorías ──────────────────────────────────────────────────────────

    @GetMapping("/categories")
    @SecurityRequirements
    public List<CatalogItemResponse> listCategories() {
        return catalogService.listCategories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogItemResponse createCategory(@Valid @RequestBody CatalogItemRequest request) {
        return catalogService.createCategory(request);
    }

    @PutMapping("/categories/{id}")
    public CatalogItemResponse updateCategory(@PathVariable Integer id, @Valid @RequestBody CatalogItemRequest request) {
        return catalogService.updateCategory(id, request);
    }

    // ── Keywords ────────────────────────────────────────────────────────────

    @GetMapping("/keywords")
    @SecurityRequirements
    public List<CatalogItemResponse> listKeywords() {
        return catalogService.listKeywords();
    }

    @PostMapping("/keywords")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogItemResponse createKeyword(@Valid @RequestBody CatalogItemRequest request) {
        return catalogService.createKeyword(request);
    }

    @PutMapping("/keywords/{id}")
    public CatalogItemResponse updateKeyword(@PathVariable Integer id, @Valid @RequestBody CatalogItemRequest request) {
        return catalogService.updateKeyword(id, request);
    }
}
