package co.edu.unisimon.expoideas.archivos;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.NoSuchElementException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AlmacenamientoLocalTest {

    @TempDir
    Path raiz;

    @Test
    void guardaAbreYElimina() throws IOException {
        AlmacenamientoLocal almacenamiento = new AlmacenamientoLocal(raiz.toString());

        almacenamiento.guardar("2026/09/abc.png", new byte[] { 1, 2, 3 });

        assertThat(Files.readAllBytes(raiz.resolve("2026/09/abc.png"))).containsExactly(1, 2, 3);
        assertThat(almacenamiento.abrir("2026/09/abc.png").getContentAsByteArray()).containsExactly(1, 2, 3);

        almacenamiento.eliminar("2026/09/abc.png");
        assertThat(raiz.resolve("2026/09/abc.png")).doesNotExist();
        assertThatNoException().isThrownBy(() -> almacenamiento.eliminar("2026/09/abc.png"));
    }

    @Test
    void creaLaCarpetaRaizSiNoExiste() {
        Path nueva = raiz.resolve("no/existe/aun");

        new AlmacenamientoLocal(nueva.toString());

        assertThat(nueva).isDirectory();
    }

    @Test
    void nuncaSobrescribeUnArchivo() {
        AlmacenamientoLocal almacenamiento = new AlmacenamientoLocal(raiz.toString());
        almacenamiento.guardar("a.png", new byte[] { 1 });

        assertThatThrownBy(() -> almacenamiento.guardar("a.png", new byte[] { 2 }))
                .isInstanceOf(UncheckedIOException.class);
    }

    @Test
    void noSaleDeLaCarpetaRaiz() throws IOException {
        Files.writeString(raiz.resolveSibling("secreto.txt"), "no");
        AlmacenamientoLocal almacenamiento = new AlmacenamientoLocal(raiz.toString());

        assertThatThrownBy(() -> almacenamiento.abrir("../secreto.txt")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> almacenamiento.guardar("../../fuera.png", new byte[] { 1 }))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> almacenamiento.eliminar("../secreto.txt")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void contenidoQueNoEstaEsInexistente() {
        AlmacenamientoLocal almacenamiento = new AlmacenamientoLocal(raiz.toString());

        assertThatThrownBy(() -> almacenamiento.abrir("2026/09/perdido.png")).isInstanceOf(NoSuchElementException.class);
    }
}
