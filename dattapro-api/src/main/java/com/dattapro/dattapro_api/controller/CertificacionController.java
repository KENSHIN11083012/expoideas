package com.dattapro.dattapro_api.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dattapro.dattapro_api.entity.Certificacion;
import com.dattapro.dattapro_api.service.UsuarioPerfilService;

import lombok.RequiredArgsConstructor;

@RestController
// @RequestMapping("/api/v1/certificaciones")
@RequestMapping({ "/api/v1/certificaciones", "/api/v1/certificaciones/" })
@RequiredArgsConstructor
public class CertificacionController {

    private final UsuarioPerfilService usuarioPerfilService;

    @GetMapping
    public ResponseEntity<List<Certificacion>> obtenerTodas() {
        return ResponseEntity.ok(usuarioPerfilService.obtenerCertificacionesUnicas());
    }

    @PostMapping
    public ResponseEntity<Certificacion> guardarCertificacion(@RequestBody Certificacion certificacion) {
        return ResponseEntity.ok(usuarioPerfilService.guardarCertificacion(certificacion));
    }
}
