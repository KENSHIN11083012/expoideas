package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.entity.*;
import com.dattapro.dattapro_api.service.MasterDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MasterDataController {

    private final MasterDataService masterDataService;

    // ═══════════════════════════════════════════════════════════════════════════
    // SEDE
    // ═══════════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════════
    // PROGRAMA ACADÉMICO
    // ═══════════════════════════════════════════════════════════════════════════
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
            @PathVariable Integer id, @RequestBody ProgramaAcademico programa) {
        return ResponseEntity.ok(masterDataService.actualizarProgramaAcademico(id, programa));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FACULTAD
    // ═══════════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════════
    // CENTRO INVESTIGATIVO
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/centros-investigativos")
    public ResponseEntity<List<CentroInvestigativo>> listarCentrosInvestigativos() {
        return ResponseEntity.ok(masterDataService.listarCentrosInvestigativos());
    }

    @PostMapping("/centros-investigativos")
    public ResponseEntity<CentroInvestigativo> crearCentroInvestigativo(@RequestBody CentroInvestigativo centro) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearCentroInvestigativo(centro));
    }

    @PutMapping("/centros-investigativos/{id}")
    public ResponseEntity<CentroInvestigativo> actualizarCentroInvestigativo(
            @PathVariable Integer id, @RequestBody CentroInvestigativo centro) {
        return ResponseEntity.ok(masterDataService.actualizarCentroInvestigativo(id, centro));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIPO VINCULACIÓN
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/tipos-vinculacion")
    public ResponseEntity<List<TipoVinculacion>> listarTiposVinculacion() {
        return ResponseEntity.ok(masterDataService.listarTiposVinculacion());
    }

    @PostMapping("/tipos-vinculacion")
    public ResponseEntity<TipoVinculacion> crearTipoVinculacion(@RequestBody TipoVinculacion tipoVinculacion) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearTipoVinculacion(tipoVinculacion));
    }

    @PutMapping("/tipos-vinculacion/{id}")
    public ResponseEntity<TipoVinculacion> actualizarTipoVinculacion(
            @PathVariable Integer id, @RequestBody TipoVinculacion tipoVinculacion) {
        return ResponseEntity.ok(masterDataService.actualizarTipoVinculacion(id, tipoVinculacion));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IDIOMAS
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/idiomas")
    public ResponseEntity<List<Idioma>> listarIdiomas() {
        return ResponseEntity.ok(masterDataService.listarIdiomas());
    }

    @PostMapping("/idiomas")
    public ResponseEntity<Idioma> crearIdioma(@RequestBody Idioma idioma) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearIdioma(idioma));
    }

    @PutMapping("/idiomas/{id}")
    public ResponseEntity<Idioma> actualizarIdioma(@PathVariable Integer id, @RequestBody Idioma idioma) {
        return ResponseEntity.ok(masterDataService.actualizarIdioma(id, idioma));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTORES DE EXPERIENCIA
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/sectores-experiencia")
    public ResponseEntity<List<SectorExperiencia>> listarSectoresExperiencia() {
        return ResponseEntity.ok(masterDataService.listarSectoresExperiencia());
    }

    @PostMapping("/sectores-experiencia")
    public ResponseEntity<SectorExperiencia> crearSectorExperiencia(@RequestBody SectorExperiencia sector) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearSectorExperiencia(sector));
    }

    @PutMapping("/sectores-experiencia/{id}")
    public ResponseEntity<SectorExperiencia> actualizarSectorExperiencia(
            @PathVariable Integer id, @RequestBody SectorExperiencia sector) {
        return ResponseEntity.ok(masterDataService.actualizarSectorExperiencia(id, sector));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIPOS DE SERVICIO
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/tipos-servicios")
    public ResponseEntity<List<TipoServicio>> listarTiposServicios() {
        return ResponseEntity.ok(masterDataService.listarTiposServicios());
    }

    @PostMapping("/tipos-servicios")
    public ResponseEntity<TipoServicio> crearTipoServicio(@RequestBody TipoServicio tipoServicio) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearTipoServicio(tipoServicio));
    }

    @PutMapping("/tipos-servicios/{id}")
    public ResponseEntity<TipoServicio> actualizarTipoServicio(
            @PathVariable Integer id, @RequestBody TipoServicio tipoServicio) {
        return ResponseEntity.ok(masterDataService.actualizarTipoServicio(id, tipoServicio));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIPOS DE PROYECTO
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/tipos-proyecto")
    public ResponseEntity<List<TipoProyecto>> listarTiposProyecto() {
        return ResponseEntity.ok(masterDataService.listarTiposProyecto());
    }

    @PostMapping("/tipos-proyecto")
    public ResponseEntity<TipoProyecto> crearTipoProyecto(@RequestBody TipoProyecto tipoProyecto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearTipoProyecto(tipoProyecto));
    }

    @PutMapping("/tipos-proyecto/{id}")
    public ResponseEntity<TipoProyecto> actualizarTipoProyecto(
            @PathVariable Integer id, @RequestBody TipoProyecto tipoProyecto) {
        return ResponseEntity.ok(masterDataService.actualizarTipoProyecto(id, tipoProyecto));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPETENCIAS TÉCNICAS
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/competencias-tecnicas")
    public ResponseEntity<List<CompetenciaTecnica>> listarCompetenciasTecnicas() {
        return ResponseEntity.ok(masterDataService.listarCompetenciasTecnicas());
    }

    @PostMapping("/competencias-tecnicas")
    public ResponseEntity<CompetenciaTecnica> crearCompetenciaTecnica(@RequestBody CompetenciaTecnica competencia) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearCompetenciaTecnica(competencia));
    }

    @PutMapping("/competencias-tecnicas/{id}")
    public ResponseEntity<CompetenciaTecnica> actualizarCompetenciaTecnica(
            @PathVariable Integer id, @RequestBody CompetenciaTecnica competencia) {
        return ResponseEntity.ok(masterDataService.actualizarCompetenciaTecnica(id, competencia));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPETENCIAS TRANSVERSALES
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/competencias-transversales")
    public ResponseEntity<List<CompetenciaTransversal>> listarCompetenciasTransversales() {
        return ResponseEntity.ok(masterDataService.listarCompetenciasTransversales());
    }

    @PostMapping("/competencias-transversales")
    public ResponseEntity<CompetenciaTransversal> crearCompetenciaTransversal(@RequestBody CompetenciaTransversal competencia) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearCompetenciaTransversal(competencia));
    }

    @PutMapping("/competencias-transversales/{id}")
    public ResponseEntity<CompetenciaTransversal> actualizarCompetenciaTransversal(
            @PathVariable Integer id, @RequestBody CompetenciaTransversal competencia) {
        return ResponseEntity.ok(masterDataService.actualizarCompetenciaTransversal(id, competencia));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ÁREAS DE CONOCIMIENTO
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/areas-conocimiento")
    public ResponseEntity<List<AreaConocimiento>> listarAreasConocimiento() {
        return ResponseEntity.ok(masterDataService.listarAreasConocimiento());
    }

    @PostMapping("/areas-conocimiento")
    public ResponseEntity<AreaConocimiento> crearAreaConocimiento(@RequestBody AreaConocimiento area) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearAreaConocimiento(area));
    }

    @PutMapping("/areas-conocimiento/{id}")
    public ResponseEntity<AreaConocimiento> actualizarAreaConocimiento(
            @PathVariable Integer id, @RequestBody AreaConocimiento area) {
        return ResponseEntity.ok(masterDataService.actualizarAreaConocimiento(id, area));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ÁREAS DE ESPECIALIDAD
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/areas-especialidad")
    public ResponseEntity<List<AreaEspecialidad>> listarAreasEspecialidad() {
        return ResponseEntity.ok(masterDataService.listarAreasEspecialidad());
    }

    @PostMapping("/areas-especialidad")
    public ResponseEntity<AreaEspecialidad> crearAreaEspecialidad(@RequestBody AreaEspecialidad area) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearAreaEspecialidad(area));
    }

    @PutMapping("/areas-especialidad/{id}")
    public ResponseEntity<AreaEspecialidad> actualizarAreaEspecialidad(
            @PathVariable Integer id, @RequestBody AreaEspecialidad area) {
        return ResponseEntity.ok(masterDataService.actualizarAreaEspecialidad(id, area));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERESES (InteresRed)
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/intereses")
    public ResponseEntity<List<InteresRed>> listarIntereses() {
        return ResponseEntity.ok(masterDataService.listarIntereses());
    }

    @PostMapping("/intereses")
    public ResponseEntity<InteresRed> crearInteres(@RequestBody InteresRed interes) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.crearInteres(interes));
    }

    @PutMapping("/intereses/{id}")
    public ResponseEntity<InteresRed> actualizarInteres(@PathVariable Integer id, @RequestBody InteresRed interes) {
        return ResponseEntity.ok(masterDataService.actualizarInteres(id, interes));
    }
}
