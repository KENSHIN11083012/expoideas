package co.edu.unisimon.expoideas.archivos;

import org.springframework.core.io.Resource;

/** Lo necesario para responder una descarga ya autorizada. */
public record ContenidoArchivo(
        String nombre,
        String tipoContenido,
        long tamanoBytes,
        String sha256,
        boolean publico,
        Resource recurso) {
}
