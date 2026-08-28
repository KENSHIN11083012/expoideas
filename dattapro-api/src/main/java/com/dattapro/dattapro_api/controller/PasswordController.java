package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.dto.CambiarPasswordDTO;
import com.dattapro.dattapro_api.service.UsuarioService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.dattapro.dattapro_api.entity.Usuario;

/**
 * Controlador REST para la gestión de contraseñas de usuario.
 * Base: /api/v1/usuarios/{id}/password
 *
 * <ul>
 *   <li>GET  – Consultar estado de la contraseña (sin exponer el hash).</li>
 *   <li>PUT  – El propio usuario cambia su contraseña (requiere passwordActual).</li>
 *   <li>POST – Un administrador restablece la contraseña sin conocer la actual.</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class PasswordController {

    private final UsuarioService usuarioService;

    // ─────────────────────────────────────────────
    // GET /api/v1/usuarios/me/password/info
    // ─────────────────────────────────────────────

    /**
     * Devuelve información básica sobre el estado de la contraseña del usuario autenticado.
     */
    @GetMapping("/me/password/info")
    public ResponseEntity<?> obtenerInfoPasswordMe() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String correo = auth.getName();
            Usuario usuario = usuarioService.obtenerUsuarioPorCorreo(correo); 
            Map<String, Object> info = usuarioService.obtenerInfoPassword(usuario.getId());
            return ResponseEntity.ok(info);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // PUT /api/v1/usuarios/me/password
    // ─────────────────────────────────────────────

    /**
     * Permite al propio usuario autenticado cambiar su contraseña.
     * No requiere ID en la URL, lo obtiene del contexto de seguridad.
     */
    @PutMapping("/me/password")
    public ResponseEntity<?> cambiarPasswordMe(@Valid @RequestBody CambiarPasswordDTO dto) {
        try {
            usuarioService.cambiarPasswordMe(dto);
            return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada exitosamente"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // POST /api/v1/usuarios/admin/reset-password
    // ─────────────────────────────────────────────

    /**
     * Permite a un administrador restablecer la contraseña de un usuario usando su correo.
     */
    @PostMapping("/admin/reset-password")
    public ResponseEntity<?> restablecerPasswordAdmin(
            @RequestParam String email,
            @Valid @RequestBody CambiarPasswordDTO dto) {
        try {
            usuarioService.restablecerPasswordAdmin(email, dto);
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Contraseña restablecida exitosamente por el administrador",
                    "correo", email));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
