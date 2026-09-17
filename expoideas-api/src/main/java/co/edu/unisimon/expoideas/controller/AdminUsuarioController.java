package co.edu.unisimon.expoideas.controller;

import co.edu.unisimon.expoideas.dto.CambiarPasswordDTO;
import co.edu.unisimon.expoideas.dto.UsuarioAdminCreateDTO;
import co.edu.unisimon.expoideas.dto.UsuarioAdminUpdateDTO;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestión de cuentas por MacondoLab y administradores. SecurityConfig exige
 * ROLE_MACONDOLAB (que ROLE_ADMIN incluye) en /api/v1/admin/** y
 * /api/v1/usuarios/admin/**, y ROLE_ADMIN para eliminar.
 *
 * <p>Lo que depende de a quién se gestiona (MacondoLab no toca cuentas de
 * gestión, nadie cambia su propio rol) lo decide UsuarioService con la cuenta
 * de la sesión, y responde 403 con el motivo.
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

    /** Crea una cuenta con rol y contraseña temporal. 201; 409 si el correo ya existe. */
    @PostMapping("/api/v1/admin/users")
    public ResponseEntity<UsuarioResponseDTO> crearUsuario(
            Authentication authentication,
            @Valid @RequestBody UsuarioAdminCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(usuarioService.crearDesdeGestion(authentication.getName(), dto));
    }

    /** Actualiza cualquier campo, rol incluido. 404 si no existe, 409 si el correo ya está en uso. */
    @PutMapping("/api/v1/admin/users/{id}")
    public ResponseEntity<UsuarioResponseDTO> actualizarUsuario(
            Authentication authentication,
            @PathVariable Integer id,
            @Valid @RequestBody UsuarioAdminUpdateDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizarDesdeAdmin(authentication.getName(), id, dto));
    }

    /** Solo administradores. 204 si se eliminó, 404 si no existe. */
    @DeleteMapping("/api/v1/admin/users/{id}")
    public ResponseEntity<Void> eliminarUsuario(Authentication authentication, @PathVariable Integer id) {
        usuarioService.eliminarUsuario(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Restablece la contraseña de un usuario sin conocer la actual. 204 si se cambió.
     * La ruta se conserva tal como la usa el frontend.
     */
    @PostMapping("/api/v1/usuarios/admin/reset-password")
    public ResponseEntity<Void> restablecerPassword(
            Authentication authentication,
            @RequestParam String email,
            @Valid @RequestBody CambiarPasswordDTO dto) {
        usuarioService.restablecerPasswordAdmin(authentication.getName(), email, dto);
        return ResponseEntity.noContent().build();
    }
}
