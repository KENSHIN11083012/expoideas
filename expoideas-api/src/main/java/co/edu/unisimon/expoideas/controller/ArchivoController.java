package co.edu.unisimon.expoideas.controller;

import co.edu.unisimon.expoideas.archivos.ContenidoArchivo;
import co.edu.unisimon.expoideas.service.ArchivoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.WebRequest;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

/**
 * Descarga de archivos por su identificador público. La subida no está aquí:
 * cada módulo tiene su endpoint (p. ej. PUT /usuarios/me/foto) y decide qué
 * formatos acepta y quién puede ver el resultado.
 */
@RestController
@RequiredArgsConstructor
public class ArchivoController {

    private final ArchivoService archivoService;

    /**
     * Públicos: sin sesión y con caché de un año, porque un identificador nunca
     * cambia de contenido. Privados: con sesión y permiso, sin caché; si no, 404.
     */
    @GetMapping("/api/v1/archivos/{id}")
    public ResponseEntity<Resource> descargar(@PathVariable UUID id, Authentication authentication, WebRequest request) {
        ContenidoArchivo archivo = archivoService.abrir(id, authentication);

        if (request.checkNotModified(archivo.sha256())) {
            return null; // 304: el navegador ya lo tiene.
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.tipoContenido()))
                .contentLength(archivo.tamanoBytes())
                .eTag(archivo.sha256())
                .cacheControl(archivo.publico()
                        ? CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable()
                        : CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(archivo.nombre(), StandardCharsets.UTF_8).build().toString())
                // Si alguien lograra colar HTML o scripts, el navegador no los ejecuta en nuestro origen.
                .header("Content-Security-Policy", "default-src 'none'; sandbox")
                .body(archivo.recurso());
    }
}
