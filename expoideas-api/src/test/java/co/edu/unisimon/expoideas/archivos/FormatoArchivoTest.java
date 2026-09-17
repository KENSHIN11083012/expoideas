package co.edu.unisimon.expoideas.archivos;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.EnumSet;

import static org.assertj.core.api.Assertions.assertThat;

class FormatoArchivoTest {

    /** Tamaño de bloque RIFF de ejemplo (36 en little-endian). */
    private static final byte[] TAMANO_RIFF = { 36, 0, 0, 0 };

    static final byte[] PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13 };
    static final byte[] JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16 };
    static final byte[] WEBP = unir(ascii("RIFF"), TAMANO_RIFF, ascii("WEBPVP8 "));
    static final byte[] PDF = ascii("%PDF-1.7\n");

    static byte[] ascii(String texto) {
        return texto.getBytes(StandardCharsets.US_ASCII);
    }

    static byte[] unir(byte[]... partes) {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        for (byte[] parte : partes) {
            salida.writeBytes(parte);
        }
        return salida.toByteArray();
    }

    @Test
    void reconoceLosFormatosAceptadosPorSuFirma() {
        assertThat(FormatoArchivo.detectar(PNG)).contains(FormatoArchivo.PNG);
        assertThat(FormatoArchivo.detectar(JPEG)).contains(FormatoArchivo.JPEG);
        assertThat(FormatoArchivo.detectar(WEBP)).contains(FormatoArchivo.WEBP);
        assertThat(FormatoArchivo.detectar(PDF)).contains(FormatoArchivo.PDF);
    }

    @Test
    void noSeFiaDeLaExtensionNiAceptaFormatosPeligrosos() {
        assertThat(FormatoArchivo.detectar(ascii("<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"))).isEmpty();
        assertThat(FormatoArchivo.detectar(ascii("<!doctype html><script>alert(1)</script>"))).isEmpty();
        assertThat(FormatoArchivo.detectar(unir(ascii("MZ"), new byte[] { (byte) 0x90, 0 }, ascii("ejecutable de Windows")))).isEmpty();
        assertThat(FormatoArchivo.detectar(ascii("GIF89a"))).isEmpty();
        assertThat(FormatoArchivo.detectar(ascii("texto plano renombrado a foto.png"))).isEmpty();
        // RIFF sin WEBP (p. ej. un WAV) no es una imagen.
        assertThat(FormatoArchivo.detectar(unir(ascii("RIFF"), TAMANO_RIFF, ascii("WAVEfmt ")))).isEmpty();
    }

    @Test
    void contenidoMasCortoQueLaFirmaNoEsNingunFormato() {
        assertThat(FormatoArchivo.detectar(new byte[0])).isEmpty();
        assertThat(FormatoArchivo.detectar(new byte[] { (byte) 0xFF, (byte) 0xD8 })).isEmpty();
        assertThat(FormatoArchivo.detectar(ascii("RIFF1234WEB"))).isEmpty();
    }

    @Test
    void describeLosFormatosParaLosMensajes() {
        assertThat(FormatoArchivo.describir(FormatoArchivo.IMAGENES)).isEqualTo("JPG, PNG o WEBP");
        assertThat(FormatoArchivo.describir(EnumSet.of(FormatoArchivo.PDF))).isEqualTo("PDF");
        assertThat(FormatoArchivo.describir(EnumSet.of(FormatoArchivo.PDF, FormatoArchivo.PNG))).isEqualTo("PNG o PDF");
    }
}
