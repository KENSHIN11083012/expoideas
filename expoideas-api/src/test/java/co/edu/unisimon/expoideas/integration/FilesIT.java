package co.edu.unisimon.expoideas.integration;

import co.edu.unisimon.expoideas.entity.RolUsuario;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/** Foto de perfil: subida, descarga pública con caché, reemplazo, borrado y límites. */
class FilesIT extends IntegrationTest {

    private static final String PHOTO = "/api/v1/usuarios/me/foto";
    private static final String PART = "archivo";

    @Test
    void photoIsUploadedServedAndCached() {
        String token = loginAs(RolUsuario.estudiante);
        byte[] png = png(1_000);

        String id = putFile(PHOTO, token, PART, "yo.png", MediaType.IMAGE_PNG, png).expect(200).json("$.fotoId");
        assertThat(get("/api/v1/usuarios/me", token).<String>json("$.fotoId")).isEqualTo(id);

        // Pública: se descarga sin sesión, idéntica, con caché larga y ETag.
        Response download = get("/api/v1/archivos/" + id, null).expect(200);
        assertThat(download.bytes()).isEqualTo(png);
        assertThat(download.headers().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(download.headers().getCacheControl()).contains("immutable");
        assertThat(download.headers().getFirst("Content-Security-Policy")).contains("sandbox");
        String etag = download.headers().getETag();
        assertThat(etag).isNotBlank();

        HttpHeaders conditional = new HttpHeaders();
        conditional.setIfNoneMatch(etag);
        get("/api/v1/archivos/" + id, null, conditional).expect(304);

        assertThat(storedFileCount(id)).isEqualTo(1);
    }

    @Test
    void replacingPhotoDeletesThePreviousOne() {
        String token = loginAs(RolUsuario.estudiante);
        String first = putFile(PHOTO, token, PART, "a.png", MediaType.IMAGE_PNG, png(100)).expect(200).json("$.fotoId");
        String second = putFile(PHOTO, token, PART, "b.png", MediaType.IMAGE_PNG, png(200)).expect(200).json("$.fotoId");

        assertThat(second).isNotEqualTo(first);
        get("/api/v1/archivos/" + first, null).expect(404);
        get("/api/v1/archivos/" + second, null).expect(200);
        assertThat(storedFileCount(first)).isZero();
    }

    @Test
    void deletingPhotoRemovesIt() {
        String token = loginAs(RolUsuario.estudiante);
        String id = putFile(PHOTO, token, PART, "a.png", MediaType.IMAGE_PNG, png(100)).expect(200).json("$.fotoId");

        delete(PHOTO, token).expect(204);

        get("/api/v1/archivos/" + id, null).expect(404);
        assertThat(get("/api/v1/usuarios/me", token).<String>json("$.fotoId")).isNull();
        assertThat(storedFileCount(id)).isZero();
    }

    @Test
    void deletingAccountRemovesItsFiles() {
        String email = createAccount(RolUsuario.estudiante);
        String token = login(email, PASSWORD);
        String id = putFile(PHOTO, token, PART, "a.png", MediaType.IMAGE_PNG, png(100)).expect(200).json("$.fotoId");
        int userId = usuarioRepository.findByCorreoInstitucional(email).orElseThrow().getId();

        delete("/api/v1/admin/users/" + userId, loginAs(RolUsuario.admin)).expect(204);

        get("/api/v1/archivos/" + id, null).expect(404);
        assertThat(storedFileCount(id)).isZero();
    }

    @Test
    void contentIsValidatedBySignatureNotByDeclaredType() {
        String token = loginAs(RolUsuario.estudiante);
        byte[] text = "no soy una imagen".getBytes(StandardCharsets.UTF_8);

        Response rejected = putFile(PHOTO, token, PART, "falsa.png", MediaType.IMAGE_PNG, text).expect(400);
        assertThat(rejected.body()).contains("JPG, PNG o WEBP");
        putFile(PHOTO, token, PART, "vacia.png", MediaType.IMAGE_PNG, new byte[0]).expect(400);
    }

    @Test
    void filesOverFiveMegabytesAre413() {
        String token = loginAs(RolUsuario.estudiante);
        putFile(PHOTO, token, PART, "grande.png", MediaType.IMAGE_PNG, png(5_500_000)).expect(413);
    }

    @Test
    void photoUploadRequiresSession() {
        get("/api/v1/archivos/00000000-0000-0000-0000-000000000000", null).expect(404);
        delete(PHOTO, null).expect(401);
    }

    /** Contenido con la firma de PNG, del tamaño pedido. */
    private static byte[] png(int size) {
        byte[] content = new byte[size];
        Arrays.fill(content, (byte) 7);
        byte[] signature = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        System.arraycopy(signature, 0, content, 0, Math.min(signature.length, size));
        return content;
    }

    /** Archivos en disco cuyo nombre empieza por ese identificador. */
    private static long storedFileCount(String id) {
        try (Stream<Path> files = Files.walk(FILES_DIR)) {
            return files.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().startsWith(id))
                    .count();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
