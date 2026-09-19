package co.edu.unisimon.expoideas.integration;

import co.edu.unisimon.expoideas.support.TestData;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import co.edu.unisimon.expoideas.users.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.testcontainers.mysql.MySQLContainer;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Base de las pruebas de integración: la API completa (Tomcat, filtros de
 * seguridad, Flyway, Hibernate con ddl-auto=validate) contra un MySQL 8.4 real
 * en Docker, y peticiones HTTP de verdad.
 *
 * <p>Todas las clases *IT comparten un solo contenedor y un solo contexto de
 * Spring. Cada prueba crea sus propias cuentas con correos únicos, así que no
 * dependen del orden ni se pisan entre sí.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
abstract class IntegrationTest {

    /** Contraseña válida para las cuentas de prueba (8+ caracteres, número y símbolo). */
    protected static final String PASSWORD = TestData.PASSWORD;

    // Se arranca una vez para toda la corrida; Testcontainers lo elimina al terminar.
    private static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4")
            .withCommand("--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci");

    protected static final Path FILES_DIR = createTempDir();

    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    static {
        MYSQL.start();
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("expoideas.jwt.secret", () -> TestData.JWT_SECRET);
        registry.add("expoideas.files.directory", FILES_DIR::toString);
        registry.add("expoideas.cors.allowed-origins", () -> "http://localhost:5173");
    }

    @LocalServerPort
    private int port;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private RestTestClient client;

    @BeforeEach
    void createClient() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    // ── Cuentas ─────────────────────────────────────────────────────────────

    /** Correo institucional que ninguna otra prueba usa. */
    protected static String uniqueEmail(String prefix) {
        return prefix + SEQUENCE.incrementAndGet() + "@unisimon.edu.co";
    }

    /**
     * Crea una cuenta al día (sin pasos de primer ingreso) directamente en la BD,
     * como haría el procedimiento del primer administrador. Devuelve el correo.
     */
    protected String createAccount(Role role) {
        String email = uniqueEmail(role.name().toLowerCase());
        userRepository.save(User.builder()
                .firstName("Prueba")
                .lastName(role.name())
                .email(email)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .role(role)
                .dataConsent(true)
                .dataConsentAt(LocalDateTime.now())
                .build());
        return email;
    }

    /** Id de la cuenta con ese correo. */
    protected int idOf(String email) {
        return userRepository.findByEmail(email).orElseThrow().getId();
    }

    /** Crea una cuenta al día con ese rol e inicia sesión. Devuelve el token. */
    protected String loginAs(Role role) {
        return login(createAccount(role), PASSWORD);
    }

    protected String login(String email, String password) {
        return post("/api/v1/auth/login", null, Map.of("email", email, "password", password))
                .expect(200)
                .json("$.token");
    }

    /** Registro público de un estudiante con la adscripción indicada. Devuelve la respuesta. */
    protected Response register(String email, int campusId, int facultyId, Integer programId) {
        Map<String, Object> body = new HashMap<>();
        body.put("firstName", "Estudiante");
        body.put("lastName", "De Prueba");
        body.put("email", email);
        body.put("password", PASSWORD);
        body.put("campusId", campusId);
        body.put("facultyId", facultyId);
        body.put("academicProgramId", programId);
        body.put("dataConsent", true);
        return post("/api/v1/auth/register", null, body);
    }

    // ── Catálogos ───────────────────────────────────────────────────────────

    /** Id de una de las sedes que siembran las migraciones. */
    protected int campusId() {
        return get("/api/v1/campuses", null).expect(200).json("$[0].id");
    }

    protected int createFaculty(String adminToken) {
        return post("/api/v1/faculties", adminToken, Map.of("name", "Facultad " + SEQUENCE.incrementAndGet()))
                .expect(201)
                .json("$.id");
    }

    protected int createProgram(String adminToken, int facultyId) {
        return post("/api/v1/academic-programs", adminToken,
                        Map.of("name", "Programa " + SEQUENCE.incrementAndGet(), "facultyId", facultyId))
                .expect(201)
                .json("$.id");
    }

    // ── Peticiones ──────────────────────────────────────────────────────────

    protected Response get(String uri, String token) {
        return send(HttpMethod.GET, uri, token, null, null);
    }

    protected Response get(String uri, String token, HttpHeaders headers) {
        return send(HttpMethod.GET, uri, token, null, headers);
    }

    protected Response post(String uri, String token, Object body) {
        return send(HttpMethod.POST, uri, token, body, null);
    }

    protected Response put(String uri, String token, Object body) {
        return send(HttpMethod.PUT, uri, token, body, null);
    }

    protected Response delete(String uri, String token) {
        return send(HttpMethod.DELETE, uri, token, null, null);
    }

    /**
     * PUT multipart con un único archivo en la parte {@code part}, enviado como lo
     * hace un navegador: la parte no declara su largo, así que el servidor la lee
     * hasta encontrar el límite.
     */
    protected Response putFile(String uri, String token, String part, String filename, MediaType type, byte[] content) {
        HttpHeaders partHeaders = new HttpHeaders();
        partHeaders.setContentType(type);
        partHeaders.setContentDispositionFormData(part, filename);
        MultiValueMap<String, Object> multipart = new LinkedMultiValueMap<>();
        multipart.add(part, new HttpEntity<>(new InputStreamResource(new ByteArrayInputStream(content)), partHeaders));
        RestTestClient.RequestHeadersSpec<?> request = client.put().uri(uri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(multipart);
        return Response.of(request.exchange().returnResult(byte[].class));
    }

    protected Response send(HttpMethod method, String uri, String token, Object body, HttpHeaders headers) {
        RestTestClient.RequestBodySpec request = client.method(method).uri(uri);
        if (token != null) {
            request = request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }
        if (headers != null) {
            request = request.headers(h -> h.addAll(headers));
        }
        RestTestClient.RequestHeadersSpec<?> ready =
                body == null ? request : request.contentType(MediaType.APPLICATION_JSON).body(body);
        return Response.of(ready.exchange().returnResult(byte[].class));
    }

    /** Respuesta HTTP con el cuerpo en bruto y acceso por JSONPath. */
    protected record Response(HttpStatusCode status, HttpHeaders headers, byte[] bytes) {

        static Response of(EntityExchangeResult<byte[]> result) {
            return new Response(result.getStatus(), result.getResponseHeaders(), result.getResponseBody());
        }

        public String body() {
            return bytes == null ? "" : new String(bytes, StandardCharsets.UTF_8);
        }

        public <T> T json(String path) {
            return JsonPath.read(body(), path);
        }

        /** Verifica el código y devuelve la respuesta, mostrando el cuerpo si falla. */
        public Response expect(int status) {
            assertThat(this.status.value()).as("%s", body()).isEqualTo(status);
            return this;
        }
    }

    private static Path createTempDir() {
        try {
            return Files.createTempDirectory("expoideas-it-files");
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
