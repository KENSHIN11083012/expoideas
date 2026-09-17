package co.edu.unisimon.expoideas.controller;

import co.edu.unisimon.expoideas.dto.AutorizacionDatosDTO;
import co.edu.unisimon.expoideas.dto.CambiarPasswordDTO;
import co.edu.unisimon.expoideas.dto.UsuarioRegistroDTO;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.dto.UsuarioUpdateDTO;
import co.edu.unisimon.expoideas.service.UsuarioService;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


/**
 * Registro y operaciones del usuario autenticado sobre sí mismo.
 * Base: /api/v1/usuarios
 *
 * <p>Las rutas /me identifican al usuario por la sesión (el subject del JWT es el
 * correo institucional), nunca por un ID que mande el cliente. Listar, editar o
 * borrar a otros usuarios es cosa de un administrador: {@link AdminUsuarioController}.
 *
 * <p>Los errores los responde GlobalExceptionHandler en formato Problem Details.
 */
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    /** Alta de una cuenta nueva. 201 con el usuario creado; 409 si el correo ya existe. */
    @PostMapping("/registro")
    @SecurityRequirements // Swagger: el registro no lleva token.
    public ResponseEntity<UsuarioResponseDTO> registrarUsuario(@Valid @RequestBody UsuarioRegistroDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.registrarUsuario(dto));
    }

    /** Datos del usuario autenticado. */
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> obtenerPerfilPropio(Authentication authentication) {
        return ResponseEntity.ok(usuarioService.obtenerPerfilPropio(authentication.getName()));
    }

    /** Actualiza los datos que el propio usuario puede cambiar (nombres y apellidos). */
    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> actualizarPerfilPropio(
            Authentication authentication,
            @Valid @RequestBody UsuarioUpdateDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizarPerfilPropio(authentication.getName(), dto));
    }

    /**
     * Autorización de tratamiento de datos dada por el propio usuario, p. ej. en
     * el primer ingreso de una cuenta creada por la gestión. 204.
     */
    @PutMapping("/me/autorizacion-datos")
    public ResponseEntity<Void> autorizarDatosPropio(
            Authentication authentication,
            @Valid @RequestBody AutorizacionDatosDTO dto) {
        usuarioService.autorizarDatosPropio(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /** Cambio de contraseña del usuario autenticado; exige la actual y quita la marca de temporal. 204. */
    @PutMapping("/me/password")
    public ResponseEntity<Void> cambiarPasswordPropio(
            Authentication authentication,
            @Valid @RequestBody CambiarPasswordDTO dto) {
        usuarioService.cambiarPasswordPropio(authentication.getName(), dto);
        return ResponseEntity.noContent().build();
    }
}
