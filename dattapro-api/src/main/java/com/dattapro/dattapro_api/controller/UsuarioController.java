package com.dattapro.dattapro_api.controller;

import com.dattapro.dattapro_api.dto.UsuarioRegistroDTO;
import com.dattapro.dattapro_api.dto.UsuarioResponseDTO;
import com.dattapro.dattapro_api.dto.UsuarioUpdateDTO;
import com.dattapro.dattapro_api.entity.Usuario;
import com.dattapro.dattapro_api.service.UsuarioService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


/**
 * Controlador REST para la gestión de usuarios.
 * Base: /api/v1/usuarios
 *
 * <p>Aquí solo hay registro y operaciones sobre el propio usuario (/me). Listar,
 * editar o borrar a otros usuarios es cosa de un administrador y vive en
 * {@link AdminUsuarioController}. En Dattapro, GET/PUT/DELETE /usuarios/{id}
 * estaban abiertos a cualquier sesión: cualquiera podía cambiarle el correo y la
 * contraseña a otro usuario, admin incluido.
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
    // GET /api/v1/usuarios/me
    // ─────────────────────────────────────────────

    /**
     * Devuelve los datos del usuario autenticado.
     */
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> obtenerPerfilPropio() {
        return ResponseEntity.ok(usuarioService.obtenerPerfilPropio(correoAutenticado()));
    }

    // ─────────────────────────────────────────────
    // PUT /api/v1/usuarios/me
    // ─────────────────────────────────────────────

    /**
     * Actualiza los datos que el propio usuario puede cambiar (nombres y apellidos).
     * Solo los campos enviados en el body son modificados.
     */
    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> actualizarPerfilPropio(@Valid @RequestBody UsuarioUpdateDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizarPerfilPropio(correoAutenticado(), dto));
    }

    /** El subject del JWT es el correo institucional. */
    private String correoAutenticado() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
