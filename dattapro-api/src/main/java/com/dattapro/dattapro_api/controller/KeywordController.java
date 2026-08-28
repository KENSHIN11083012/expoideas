package com.dattapro.dattapro_api.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dattapro.dattapro_api.entity.Keyword;
import com.dattapro.dattapro_api.service.ConvocatoriaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({ "/api/v1/keywords", "/api/v1/keywords/" })
@RequiredArgsConstructor
public class KeywordController {

    private final ConvocatoriaService convocatoriaService;

    @GetMapping
    public ResponseEntity<List<Keyword>> obtenerTodas() {
        return ResponseEntity.ok(convocatoriaService.listarKeywords());
    }

    @PostMapping
    public ResponseEntity<Keyword> guardarKeyword(@RequestBody Keyword keyword) {
        return ResponseEntity.ok(convocatoriaService.guardarKeyword(keyword));
    }
}
