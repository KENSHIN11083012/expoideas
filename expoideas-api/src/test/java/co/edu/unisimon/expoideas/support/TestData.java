package co.edu.unisimon.expoideas.support;

import co.edu.unisimon.expoideas.common.ExpoideasProperties;
import co.edu.unisimon.expoideas.common.ExpoideasProperties.CorsSettings;
import co.edu.unisimon.expoideas.common.ExpoideasProperties.FilesSettings;
import co.edu.unisimon.expoideas.common.ExpoideasProperties.JwtSettings;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

/** Datos de prueba compartidos. */
public final class TestData {

    /** Clave HMAC de 256 bits en Base64, solo para pruebas. */
    public static final String JWT_SECRET = "ZXhwb2lkZWFzLWludGVncmF0aW9uLXRlc3RzLWtleSE=";

    /** Cumple la regla de contraseñas: 8+ caracteres, número y símbolo. */
    public static final String PASSWORD = "Segura#2026";

    public static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13};
    public static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16};
    public static final byte[] WEBP = concat(ascii("RIFF"), new byte[] {36, 0, 0, 0}, ascii("WEBPVP8 "));
    public static final byte[] PDF = ascii("%PDF-1.7\n");

    private TestData() {}

    /** Cuenta al día (sin pasos de primer ingreso) con ese rol. */
    public static User user(int id, String email, Role role) {
        return User.builder()
                .id(id)
                .firstName("Nombre")
                .lastName("Apellido")
                .email(email)
                .passwordHash("hash-actual")
                .role(role)
                .dataConsent(true)
                .build();
    }

    public static ExpoideasProperties properties(Path filesDirectory) {
        return new ExpoideasProperties(
                new JwtSettings(JWT_SECRET, Duration.ofMinutes(1)),
                new CorsSettings(List.of()),
                new FilesSettings(filesDirectory));
    }

    public static byte[] ascii(String text) {
        return text.getBytes(StandardCharsets.US_ASCII);
    }

    public static byte[] concat(byte[]... parts) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] part : parts) {
            out.writeBytes(part);
        }
        return out.toByteArray();
    }
}
