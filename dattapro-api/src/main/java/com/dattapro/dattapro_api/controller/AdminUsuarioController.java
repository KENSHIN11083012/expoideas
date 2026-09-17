package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.dto.CambiarPasswordDTO;
import com.dattapro.dattapro_api.dto.UsuarioAdminUpdateDTO;
import com.dattapro.dattapro_api.dto.UsuarioResponseDTO;
import com.dattapro.dattapro_api.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestión de usuarios por parte de un administrador. SecurityConfig exige
 * ROLE_ADMIN en /api/v1/admin/** y /api/v1/usuarios/admin/**.
 *
 * <p>Los errores los responde GlobalExceptionHandler en formato Problem Details.
 */
@RestController
@RequiredArgsConstructor
public class AdminUsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/api/v1/admin/users")
    public ResponseEntity<List<UsuarioResponseDTO>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    /** Actualiza cualquier campo, rol incluido. 404 si no existe, 409 si el correo ya está en uso. */
    @PutMapping("/api/v1/admin/users/{id}")
    public ResponseEntity<UsuarioResponseDTO> actualizarUsuario(
            @PathVariable Integer id,
            @Valid @RequestBody UsuarioAdminUpdateDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizarDesdeAdmin(id, dto));
    }

    /** 204 si se eliminó, 404 si no existe. */
    @DeleteMapping("/api/v1/admin/users/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Integer id) {
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Restablece la contraseña de un usuario sin conocer la actual. 204 si se cambió.
     * La ruta se conserva tal como la usa el frontend.
     */
    @PostMapping("/api/v1/usuarios/admin/reset-password")
    public ResponseEntity<Void> restablecerPassword(
            @RequestParam String email,
            @Valid @RequestBody CambiarPasswordDTO dto) {
        usuarioService.restablecerPasswordAdmin(email, dto);
        return ResponseEntity.noContent().build();
    }
}
