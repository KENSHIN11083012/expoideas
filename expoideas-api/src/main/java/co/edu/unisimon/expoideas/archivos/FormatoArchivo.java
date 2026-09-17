package co.edu.unisimon.expoideas.archivos;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Formatos que acepta la plataforma, reconocidos por su firma (los primeros
 * bytes) y no por la extensión ni por el Content-Type que declara el navegador,
 * que el cliente controla. Un .exe renombrado a .png no pasa.
 *
 * <p>SVG queda fuera a propósito: es XML y puede llevar scripts.
 */
public enum FormatoArchivo {
    JPEG("image/jpeg", "jpg", "JPG"),
    PNG("image/png", "png", "PNG"),
    WEBP("image/webp", "webp", "WEBP"),
    PDF("application/pdf", "pdf", "PDF");

    /** Fotos (perfil, galería, prototipos). */
    public static final Set<FormatoArchivo> IMAGENES = Collections.unmodifiableSet(EnumSet.of(JPEG, PNG, WEBP));

    private static final byte[] FIRMA_JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF };
    private static final byte[] FIRMA_PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
    private static final byte[] FIRMA_RIFF = "RIFF".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] FIRMA_WEBP = "WEBP".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] FIRMA_PDF = "%PDF-".getBytes(StandardCharsets.US_ASCII);

    private final String tipoContenido;
    private final String extension;
    private final String nombre;

    FormatoArchivo(String tipoContenido, String extension, String nombre) {
        this.tipoContenido = tipoContenido;
        this.extension = extension;
        this.nombre = nombre;
    }

    public String tipoContenido() {
        return tipoContenido;
    }

    public String extension() {
        return extension;
    }

    /** Formato del contenido según su firma, o vacío si no es ninguno de los aceptados. */
    public static Optional<FormatoArchivo> detectar(byte[] contenido) {
        if (empiezaCon(contenido, 0, FIRMA_JPEG)) return Optional.of(JPEG);
        if (empiezaCon(contenido, 0, FIRMA_PNG)) return Optional.of(PNG);
        if (empiezaCon(contenido, 0, FIRMA_RIFF) && empiezaCon(contenido, 8, FIRMA_WEBP)) return Optional.of(WEBP);
        if (empiezaCon(contenido, 0, FIRMA_PDF)) return Optional.of(PDF);
        return Optional.empty();
    }

    /** "JPG, PNG o WEBP", para los mensajes de error. */
    public static String describir(Set<FormatoArchivo> formatos) {
        String[] nombres = formatos.stream().sorted().map(f -> f.nombre).toArray(String[]::new);
        if (nombres.length == 1) return nombres[0];
        return Arrays.stream(nombres, 0, nombres.length - 1).collect(Collectors.joining(", "))
                + " o " + nombres[nombres.length - 1];
    }

    private static boolean empiezaCon(byte[] contenido, int desde, byte[] firma) {
        if (contenido.length < desde + firma.length) return false;
        return Arrays.equals(contenido, desde, desde + firma.length, firma, 0, firma.length);
    }
}
