package co.edu.unisimon.expoideas.controller;

import co.edu.unisimon.expoideas.dto.CatalogoRequestDTO;
import co.edu.unisimon.expoideas.dto.CatalogoResponseDTO;
import co.edu.unisimon.expoideas.dto.ProgramaAcademicoRequestDTO;
import co.edu.unisimon.expoideas.dto.ProgramaAcademicoResponseDTO;
import co.edu.unisimon.expoideas.service.MasterDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Catalogos maestros. Lectura publica (la usa el registro antes de haber sesion);
 * alta y edicion solo ADMIN (ver SecurityConfig). No hay borrado: los registros
 * pueden estar referenciados por usuarios y programas.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MasterDataController {

    private final MasterDataService masterDataService;

    // ---------------------------------------------
    // SEDE
    // ---------------------------------------------

    @GetMapping("/sedes")
    public ResponseEntity<List<CatalogoResponseDTO>> listarSedes() {
        return ResponseEntity.ok(masterDataService.listarSedes());
    }

    @PostMapping("/sedes")
    public ResponseEntity<CatalogoResponseDTO> crearSede(@Valid @RequestBody CatalogoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearSede(dto));
    }

    @PutMapping("/sedes/{id}")
    public ResponseEntity<CatalogoResponseDTO> actualizarSede(
            @PathVariable Integer id, @Valid @RequestBody CatalogoRequestDTO dto) {
        return ResponseEntity.ok(masterDataService.actualizarSede(id, dto));
    }

    // ---------------------------------------------
    // FACULTAD
    // ---------------------------------------------

    @GetMapping("/facultades")
    public ResponseEntity<List<CatalogoResponseDTO>> listarFacultades() {
        return ResponseEntity.ok(masterDataService.listarFacultades());
    }

    @PostMapping("/facultades")
    public ResponseEntity<CatalogoResponseDTO> crearFacultad(@Valid @RequestBody CatalogoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearFacultad(dto));
    }

    @PutMapping("/facultades/{id}")
    public ResponseEntity<CatalogoResponseDTO> actualizarFacultad(
            @PathVariable Integer id, @Valid @RequestBody CatalogoRequestDTO dto) {
        return ResponseEntity.ok(masterDataService.actualizarFacultad(id, dto));
    }

    // ---------------------------------------------
    // PROGRAMA ACADEMICO
    // ---------------------------------------------

    @GetMapping("/programas-academicos")
    public ResponseEntity<List<ProgramaAcademicoResponseDTO>> listarProgramasAcademicos() {
        return ResponseEntity.ok(masterDataService.listarProgramasAcademicos());
    }

    @PostMapping("/programas-academicos")
    public ResponseEntity<ProgramaAcademicoResponseDTO> crearProgramaAcademico(
            @Valid @RequestBody ProgramaAcademicoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearProgramaAcademico(dto));
    }

    @PutMapping("/programas-academicos/{id}")
    public ResponseEntity<ProgramaAcademicoResponseDTO> actualizarProgramaAcademico(
            @PathVariable Integer id, @Valid @RequestBody ProgramaAcademicoRequestDTO dto) {
        return ResponseEntity.ok(masterDataService.actualizarProgramaAcademico(id, dto));
    }

    // ---------------------------------------------
    // CATEGORIA
    // ---------------------------------------------

    @GetMapping("/categorias")
    public ResponseEntity<List<CatalogoResponseDTO>> listarCategorias() {
        return ResponseEntity.ok(masterDataService.listarCategorias());
    }

    @PostMapping("/categorias")
    public ResponseEntity<CatalogoResponseDTO> crearCategoria(@Valid @RequestBody CatalogoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearCategoria(dto));
    }

    @PutMapping("/categorias/{id}")
    public ResponseEntity<CatalogoResponseDTO> actualizarCategoria(
            @PathVariable Integer id, @Valid @RequestBody CatalogoRequestDTO dto) {
        return ResponseEntity.ok(masterDataService.actualizarCategoria(id, dto));
    }

    // ---------------------------------------------
    // KEYWORD
    // ---------------------------------------------

    @GetMapping("/keywords")
    public ResponseEntity<List<CatalogoResponseDTO>> listarKeywords() {
        return ResponseEntity.ok(masterDataService.listarKeywords());
    }

    @PostMapping("/keywords")
    public ResponseEntity<CatalogoResponseDTO> crearKeyword(@Valid @RequestBody CatalogoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearKeyword(dto));
    }

    @PutMapping("/keywords/{id}")
    public ResponseEntity<CatalogoResponseDTO> actualizarKeyword(
            @PathVariable Integer id, @Valid @RequestBody CatalogoRequestDTO dto) {
        return ResponseEntity.ok(masterDataService.actualizarKeyword(id, dto));
    }
}
