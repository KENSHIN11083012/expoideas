package co.edu.unisimon.expoideas.archivos;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.NoSuchElementException;

/**
 * Archivos en una carpeta del servidor ({@code app.archivos.directorio}, variable
 * ARCHIVOS_DIR). Esa carpeta debe quedar fuera de lo que publica el servidor web
 * y entrar en las copias de seguridad junto con la BD.
 */
@Slf4j
@Component
public class AlmacenamientoLocal implements AlmacenamientoArchivos {

    private final Path raiz;

    public AlmacenamientoLocal(@Value("${app.archivos.directorio}") String directorio) {
        this.raiz = Path.of(directorio).toAbsolutePath().normalize();
        try {
            Files.createDirectories(raiz);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo crear el directorio de archivos " + raiz, e);
        }
        log.info("Archivos en {}", raiz);
    }

    @Override
    public void guardar(String ruta, byte[] contenido) {
        Path destino = resolver(ruta);
        try {
            Files.createDirectories(destino.getParent());
            // CREATE_NEW: nunca sobrescribe; cada ruta lleva un UUID nuevo.
            Files.write(destino, contenido, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el archivo", e);
        }
    }

    @Override
    public Resource abrir(String ruta) {
        Path archivo = resolver(ruta);
        if (!Files.isRegularFile(archivo)) {
            // Metadatos sin contenido: se responde como inexistente y queda rastro para revisarlo.
            log.error("Falta el contenido del archivo {}", ruta);
            throw new NoSuchElementException("El archivo no existe");
        }
        return new FileSystemResource(archivo);
    }

    @Override
    public void eliminar(String ruta) {
        try {
            Files.deleteIfExists(resolver(ruta));
        } catch (IOException e) {
            // El registro ya no existe: un huérfano en disco no rompe nada, pero se reporta.
            log.warn("No se pudo borrar el archivo {}: {}", ruta, e.getMessage());
        }
    }

    /** Impide salir de la carpeta raíz aunque la ruta traiga "..". */
    private Path resolver(String ruta) {
        Path resuelta = raiz.resolve(ruta).normalize();
        if (!resuelta.startsWith(raiz)) {
            throw new IllegalArgumentException("Ruta de archivo no válida");
        }
        return resuelta;
    }
}
