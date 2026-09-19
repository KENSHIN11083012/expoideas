package co.edu.unisimon.expoideas.security;

import co.edu.unisimon.expoideas.common.ExpoideasProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

/**
 * Tokens de sesión (JWT firmados con HS256). El subject es el correo y el claim
 * {@code role} lleva el rol, que el frontend usa solo para pintar la interfaz:
 * los permisos se leen de la BD en cada petición.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration expiration;

    /** Una clave mal formada o de menos de 256 bits impide arrancar la API. */
    public JwtService(ExpoideasProperties properties) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.jwt().secret()));
        this.expiration = properties.jwt().expiration();
    }

    public String generateToken(UserPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("role", principal.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Correo del token.
     *
     * @throws JwtException si la firma no es válida, el token está mal formado o ya venció
     */
    public String extractEmail(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
    }
}
