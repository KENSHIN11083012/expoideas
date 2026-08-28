package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.dto.UsuarioRegistroDTO;
import com.dattapro.dattapro_api.dto.UsuarioUpdateDTO;
import com.dattapro.dattapro_api.dto.UsuarioResponseDTO;
import com.dattapro.dattapro_api.entity.Usuario;
import com.dattapro.dattapro_api.service.UsuarioService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;


/**
 * Controlador REST para la gestión de usuarios.
 * Base: /api/v1/usuarios
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    // ─────────────────────────────────────────────
    // POST /api/v1/usuarios/registro
    // ─────────────────────────────────────────────

    /**
     * Registra un nuevo usuario con los datos del primer formulario.
     * Retorna 201 con ID y correo, o 409 si el correo ya existe.
     */
    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@Valid @RequestBody UsuarioRegistroDTO dto) {
        try {
            Usuario creado = usuarioService.registrarUsuario(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "mensaje", "Usuario registrado exitosamente",
                    "idUsuario", creado.getId(),
                    "correo", creado.getCorreoInstitucional()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // GET /api/v1/usuarios
    // ─────────────────────────────────────────────

    /**
     * Devuelve la lista de todos los usuarios registrados.
     */
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    // ─────────────────────────────────────────────
    // GET /api/v1/usuarios/{id}
    // ─────────────────────────────────────────────

    /**
     * Devuelve un usuario por su ID.
     * Retorna 200 con los datos del usuario o 404 si no existe.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(usuarioService.obtenerUsuarioPorId(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // PUT /api/v1/usuarios/{id}
    // ─────────────────────────────────────────────

    /**
     * Actualiza los campos básicos de un usuario.
     * Solo los campos enviados en el body son modificados (campos nulos se
     * ignoran).
     * Retorna 200 con el usuario actualizado, 404 si no existe, 409 si el correo ya
     * está en uso.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(
            @PathVariable Integer id,
            @Valid @RequestBody UsuarioUpdateDTO dto) {
        try {
            Usuario actualizado = usuarioService.actualizarUsuario(id, dto);
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Usuario actualizado exitosamente",
                    "idUsuario", actualizado.getId()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // DELETE /api/v1/usuarios/{id}
    // ─────────────────────────────────────────────

    /**
     * Elimina un usuario por su ID.
     * Retorna 200 con mensaje de éxito o 404 si no existe.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Integer id) {
        try {
            usuarioService.eliminarUsuario(id);
            return ResponseEntity.ok(Map.of("mensaje", "Usuario con ID " + id + " eliminado correctamente"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
