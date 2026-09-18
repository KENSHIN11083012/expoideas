package co.edu.unisimon.expoideas.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Arranque completo: si el contexto sube, Flyway aplicó todas las migraciones y
 * el mapeo de Hibernate cuadra con el esquema (ddl-auto=validate).
 */
class PlatformIT extends IntegrationTest {

    @Test
    void healthResponds() {
        get("/actuator/health", null).expect(200);
        assertThat(get("/actuator/health", null).<String>json("$.status")).isEqualTo("UP");
        get("/actuator/health/liveness", null).expect(200);
        get("/actuator/health/readiness", null).expect(200);
    }

    @Test
    void healthHidesDetails() {
        assertThat(get("/actuator/health", null).body()).doesNotContain("components", "db");
    }

    @Test
    void otherActuatorEndpointsAreNotExposed() {
        assertThat(get("/actuator/env", null).status().is2xxSuccessful()).isFalse();
        assertThat(get("/actuator/beans", null).status().is2xxSuccessful()).isFalse();
    }

    @Test
    void campusesAreSeededWithAccents() {
        List<String> names = get("/api/v1/sedes", null).expect(200).json("$[*].nombre");
        assertThat(names).contains("Barranquilla", "Cúcuta");
    }

    @Test
    void protectedRouteWithoutSessionIs401ProblemDetails() {
        Response response = get("/api/v1/usuarios/me", null).expect(401);
        assertThat(response.headers().getContentType()).isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(response.<Integer>json("$.status")).isEqualTo(401);
    }

    @Test
    void invalidTokenIs401() {
        get("/api/v1/usuarios/me", "no-es-un-jwt").expect(401);
    }
}
