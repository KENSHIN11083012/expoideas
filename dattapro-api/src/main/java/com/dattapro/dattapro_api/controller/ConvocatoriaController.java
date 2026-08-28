package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.dto.ConvocatoriaRequestDTO;
import com.dattapro.dattapro_api.dto.ConvocatoriaResponseDTO;
import com.dattapro.dattapro_api.dto.KeywordRequestDTO;
import com.dattapro.dattapro_api.dto.LineaInvestigacionRequestDTO;
import com.dattapro.dattapro_api.entity.Categoria;
import com.dattapro.dattapro_api.entity.Entidad;
import com.dattapro.dattapro_api.service.ConvocatoriaService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para el módulo de Convocatorias.
 *
 * Endpoints públicos (acceso sin auth):
 *   GET  /api/v1/convocatorias
 *   GET  /api/v1/convocatorias/{id}
 *   GET  /api/v1/convocatorias/categoria/{categoriaId}
 *   GET  /api/v1/categorias
 *   GET  /api/v1/entidades
 *
 * Endpoints protegidos (requieren rol admin):
 *   POST   /api/v1/convocatorias
 *   PUT    /api/v1/convocatorias/{id}
 *   DELETE /api/v1/convocatorias/{id}
 *   POST   /api/v1/categorias
 *   POST   /api/v1/entidades
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class ConvocatoriaController {

    private final ConvocatoriaService convocatoriaService;

    // ===============================
    // Endpoints de Convocatorias
    // ===============================

    /**
     * Lista todas las convocatorias disponibles.
     * GET /api/v1/convocatorias
     */
    @GetMapping("/api/v1/convocatorias")
    public ResponseEntity<List<ConvocatoriaResponseDTO>> listarTodas() {
        log.info("Listando todas las convocatorias");
        return ResponseEntity.ok(convocatoriaService.listarTodas());
    }

    /**
     * Obtiene el detalle completo de una convocatoria por su ID.
     * GET /api/v1/convocatorias/{id}
     */
    @GetMapping("/api/v1/convocatorias/{id}")
    public ResponseEntity<ConvocatoriaResponseDTO> obtenerPorId(@PathVariable Integer id) {
        log.info("Obteniendo convocatoria ID: {}", id);
        return ResponseEntity.ok(convocatoriaService.obtenerPorId(id));
    }

    /**
     * Filtra convocatorias por categoría.
     * GET /api/v1/convocatorias/categoria/{categoriaId}
     */
    @GetMapping("/api/v1/convocatorias/categoria/{categoriaId}")
    public ResponseEntity<List<ConvocatoriaResponseDTO>> listarPorCategoria(@PathVariable Integer categoriaId) {
        log.info("Listando convocatorias por categoría ID: {}", categoriaId);
        return ResponseEntity.ok(convocatoriaService.listarPorCategoria(categoriaId));
    }

    /**
     * Filtra convocatorias por usuario creador.
     * GET /api/v1/convocatorias/usuario/{usuarioId}
     */
    @GetMapping("/api/v1/convocatorias/usuario/{usuarioId}")
    public ResponseEntity<List<ConvocatoriaResponseDTO>> listarPorUsuario(@PathVariable Integer usuarioId) {
        log.info("Listando convocatorias por usuario ID: {}", usuarioId);
        return ResponseEntity.ok(convocatoriaService.listarPorUsuario(usuarioId));
    }

    /**
     * Obtiene las convocatorias del usuario autenticado.
     * GET /api/v1/convocatorias/me
     */
    @GetMapping("/api/v1/convocatorias/me")
    public ResponseEntity<List<ConvocatoriaResponseDTO>> listarMisConvocatorias() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String correo = authentication.getName();
        log.info("Listando convocatorias para el usuario autenticado: {}", correo);
        return ResponseEntity.ok(convocatoriaService.listarPorCorreo(correo));
    }

    /**
     * Crea una nueva convocatoria (solo admins).
     * POST /api/v1/convocatorias
     */
    @PostMapping("/api/v1/convocatorias")
    public ResponseEntity<ConvocatoriaResponseDTO> crear(@RequestBody ConvocatoriaRequestDTO dto) {
        log.info("Creando convocatoria: {}", dto.getTitulo());
        ConvocatoriaResponseDTO created = convocatoriaService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Actualiza una convocatoria existente (solo admins).
     * PUT /api/v1/convocatorias/{id}
     */
    @PutMapping("/api/v1/convocatorias/{id}")
    public ResponseEntity<ConvocatoriaResponseDTO> actualizar(
            @PathVariable Integer id,
            @RequestBody ConvocatoriaRequestDTO dto) {
        log.info("Actualizando convocatoria ID: {}", id);
        return ResponseEntity.ok(convocatoriaService.actualizar(id, dto));
    }

    /**
     * Elimina una convocatoria (solo admins).
     * DELETE /api/v1/convocatorias/{id}
     */
    @DeleteMapping("/api/v1/convocatorias/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        log.info("Eliminando convocatoria ID: {}", id);
        convocatoriaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ===============================
    // Endpoints de Categorías
    // ===============================

    /**
     * Lista todas las categorías disponibles.
     * GET /api/v1/categorias
     */
    @GetMapping("/api/v1/categorias")
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(convocatoriaService.listarCategorias());
    }

    /**
     * Crea una nueva categoría (solo admins).
     * POST /api/v1/categorias
     */
    @PostMapping("/api/v1/categorias")
    public ResponseEntity<Categoria> crearCategoria(@RequestBody Categoria categoria) {
        return ResponseEntity.status(HttpStatus.CREATED).body(convocatoriaService.crearCategoria(categoria));
    }

    // ===============================
    // Endpoints de Entidades
    // ===============================

    /**
     * Lista todas las entidades disponibles.
     * GET /api/v1/entidades
     */
    @GetMapping("/api/v1/entidades")
    public ResponseEntity<List<Entidad>> listarEntidades() {
        return ResponseEntity.ok(convocatoriaService.listarEntidades());
    }

    /**
     * Crea una nueva entidad (solo admins).
     * POST /api/v1/entidades
     */
    @PostMapping("/api/v1/entidades")
    public ResponseEntity<Entidad> crearEntidad(@RequestBody Entidad entidad) {
        return ResponseEntity.status(HttpStatus.CREATED).body(convocatoriaService.crearEntidad(entidad));
    }

    // ===============================
    // Endpoints de Keywords y Líneas
    // ===============================

    @GetMapping("/api/v1/convocatoria-lineas-investigacion")
    public ResponseEntity<List<String>> listarLineasInvestigacion() {
        return ResponseEntity.ok(convocatoriaService.listarLineasInvestigacion());
    }

    @PostMapping("/api/v1/convocatoria-lineas-investigacion")
    public ResponseEntity<List<String>> agregarLinea(@RequestBody LineaInvestigacionRequestDTO dto) {
        convocatoriaService.agregarLinea(dto.getConvocatoriaId(), dto.getLinea());
        return ResponseEntity.ok(convocatoriaService.listarLineasInvestigacion());
    }
}
