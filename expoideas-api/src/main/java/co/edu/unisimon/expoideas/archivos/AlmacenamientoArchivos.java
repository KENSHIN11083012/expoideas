package co.edu.unisimon.expoideas.archivos;

import org.springframework.core.io.Resource;

/**
 * Dónde vive el contenido de los archivos. Hoy es una carpeta local; si TI
 * ofrece otro almacenamiento (p. ej. compatible con S3), basta otra
 * implementación sin tocar los servicios.
 *
 * <p>Las rutas las genera la plataforma ({@code aaaa/mm/uuid.ext}), nunca el
 * usuario.
 */
public interface AlmacenamientoArchivos {

    void guardar(String ruta, byte[] contenido);

    /** @throws java.util.NoSuchElementException si no hay contenido en esa ruta */
    Resource abrir(String ruta);

    /** No falla si ya no existe. */
    void eliminar(String ruta);
}
