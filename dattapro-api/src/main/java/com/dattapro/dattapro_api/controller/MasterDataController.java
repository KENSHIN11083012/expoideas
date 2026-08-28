package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.entity.Categoria;
import com.dattapro.dattapro_api.entity.Facultad;
import com.dattapro.dattapro_api.entity.Keyword;
import com.dattapro.dattapro_api.entity.ProgramaAcademico;
import com.dattapro.dattapro_api.entity.Sede;
import com.dattapro.dattapro_api.service.MasterDataService;
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
 * Catalogos maestros. Las rutas /categorias y /keywords vivian en
 * ConvocatoriaController y KeywordController; se conservan iguales para no
 * romper el frontend.
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
    public ResponseEntity<List<Sede>> listarSedes() {
        return ResponseEntity.ok(masterDataService.listarSedes());
    }

    @PostMapping("/sedes")
    public ResponseEntity<Sede> crearSede(@RequestBody Sede sede) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearSede(sede));
    }

    @PutMapping("/sedes/{id}")
    public ResponseEntity<Sede> actualizarSede(@PathVariable Integer id, @RequestBody Sede sede) {
        return ResponseEntity.ok(masterDataService.actualizarSede(id, sede));
    }

    // ---------------------------------------------
    // FACULTAD
    // ---------------------------------------------

    @GetMapping("/facultades")
    public ResponseEntity<List<Facultad>> listarFacultades() {
        return ResponseEntity.ok(masterDataService.listarFacultades());
    }

    @PostMapping("/facultades")
    public ResponseEntity<Facultad> crearFacultad(@RequestBody Facultad facultad) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearFacultad(facultad));
    }

    @PutMapping("/facultades/{id}")
    public ResponseEntity<Facultad> actualizarFacultad(@PathVariable Integer id, @RequestBody Facultad facultad) {
        return ResponseEntity.ok(masterDataService.actualizarFacultad(id, facultad));
    }

    // ---------------------------------------------
    // PROGRAMA ACADEMICO
    // ---------------------------------------------

    @GetMapping("/programas-academicos")
    public ResponseEntity<List<ProgramaAcademico>> listarProgramasAcademicos() {
        return ResponseEntity.ok(masterDataService.listarProgramasAcademicos());
    }

    @PostMapping("/programas-academicos")
    public ResponseEntity<ProgramaAcademico> crearProgramaAcademico(@RequestBody ProgramaAcademico programa) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearProgramaAcademico(programa));
    }

    @PutMapping("/programas-academicos/{id}")
    public ResponseEntity<ProgramaAcademico> actualizarProgramaAcademico(
            @PathVariable Integer id,
            @RequestBody ProgramaAcademico programa) {
        return ResponseEntity.ok(masterDataService.actualizarProgramaAcademico(id, programa));
    }

    // ---------------------------------------------
    // CATEGORIA
    // ---------------------------------------------

    @GetMapping("/categorias")
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(masterDataService.listarCategorias());
    }

    @PostMapping("/categorias")
    public ResponseEntity<Categoria> crearCategoria(@RequestBody Categoria categoria) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearCategoria(categoria));
    }

    @PutMapping("/categorias/{id}")
    public ResponseEntity<Categoria> actualizarCategoria(@PathVariable Integer id, @RequestBody Categoria categoria) {
        return ResponseEntity.ok(masterDataService.actualizarCategoria(id, categoria));
    }

    // ---------------------------------------------
    // KEYWORD
    // ---------------------------------------------

    @GetMapping("/keywords")
    public ResponseEntity<List<Keyword>> listarKeywords() {
        return ResponseEntity.ok(masterDataService.listarKeywords());
    }

    @PostMapping("/keywords")
    public ResponseEntity<Keyword> crearKeyword(@RequestBody Keyword keyword) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearKeyword(keyword));
    }

    @PutMapping("/keywords/{id}")
    public ResponseEntity<Keyword> actualizarKeyword(@PathVariable Integer id, @RequestBody Keyword keyword) {
        return ResponseEntity.ok(masterDataService.actualizarKeyword(id, keyword));
    }
}
