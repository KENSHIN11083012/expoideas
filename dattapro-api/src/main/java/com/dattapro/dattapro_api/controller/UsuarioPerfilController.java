package com.dattapro.dattapro_api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dattapro.dattapro_api.dto.UsuarioPerfilDTO;
import com.dattapro.dattapro_api.dto.UsuarioPerfilResponseDTO;
import com.dattapro.dattapro_api.service.UsuarioPerfilService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/usuarios/perfil")
@RequiredArgsConstructor
@Slf4j
public class UsuarioPerfilController {

    private final UsuarioPerfilService usuarioPerfilService;

    @PostMapping
    public ResponseEntity<String> guardarPerfil(@RequestBody UsuarioPerfilDTO dto) {
        // IMPRIMIR EL DTO RECIBIDOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
        System.out.println("📥 DTO RECIBIDO: " + dto.toString());
        log.info("Recibido request para guardar el perfil del usuario: {}",
                dto.getUsuarioId() != null ? dto.getUsuarioId() : "Nuevo");

        // Validate early logic for consent
        if (dto.getDatosBasicos() != null && (Boolean.FALSE.equals(dto.getDatosBasicos().getDeseaVincularse()) || Boolean.FALSE.equals(dto.getDatosBasicos().getAutorizaDatos()))) {
            // Note: Service will handle setting estadoFormulario = rechazado and saving
            usuarioPerfilService.guardarPerfil(dto);
            return ResponseEntity.ok("Formulario rechazado guardado correctamente");
        }

        usuarioPerfilService.guardarPerfil(dto);
        return ResponseEntity.ok("Perfil guardado correctamente con sus relaciones");
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioPerfilResponseDTO> obtenerPerfil(@PathVariable Integer id) {
        log.info("Recuperando perfil completo para el usuario ID: {}", id);
        UsuarioPerfilResponseDTO response = usuarioPerfilService.obtenerPerfilCompleto(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioPerfilResponseDTO> obtenerMiPerfil() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentPrincipalName = authentication.getName(); // El sub (correo) en nuestro JWT
        log.info("Recuperando perfil propio para el usuario: {}", currentPrincipalName);

        UsuarioPerfilResponseDTO response = usuarioPerfilService.obtenerPerfilPorCorreo(currentPrincipalName);
        return ResponseEntity.ok(response);
    }
}
