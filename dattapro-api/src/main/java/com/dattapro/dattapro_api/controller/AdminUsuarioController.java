package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.dto.UsuarioAdminUpdateDTO;
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
 * Controlador REST para la gestión de usuarios por parte del Administrador.
 * Base: /api/v1/admin/usuarios
 * 
 * TODO: Esta ruta (/api/v1/admin/**) deberá ser protegida en Spring Security
 * para que solo los usuarios con el rol 'admin' tengan acceso.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUsuarioController {

    private final UsuarioService usuarioService;

    /**
     * Actualiza todos los campos de un usuario, incluyendo su rol.
     * Retorna 200 con el usuario actualizado, 404 si no existe, 409 si el correo o
     * documento ya está en uso.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(
            @PathVariable Integer id,
            @Valid @RequestBody UsuarioAdminUpdateDTO dto) {
        try {
            Usuario actualizado = usuarioService.actualizarDesdeAdmin(id, dto);
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Usuario actualizado exitosamente por el administrador",
                    "usuario", usuarioService.toResponseDTO(actualizado)));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Devuelve la lista de todos los usuarios registrados.
     */
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

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
