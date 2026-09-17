package co.edu.unisimon.expoideas.security;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        /** Estructura de la universidad: la escribe solo el administrador. */
        private static final String[] CATALOGOS_INSTITUCIONALES = {
                        "/api/v1/sedes/**",
                        "/api/v1/facultades/**",
                        "/api/v1/programas-academicos/**"
        };

        /** Clasificacion de proyectos: la escribe MacondoLab (y el administrador). */
        private static final String[] CATALOGOS_DE_CLASIFICACION = {
                        "/api/v1/categorias/**",
                        "/api/v1/keywords/**"
        };

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final HandlerExceptionResolver handlerExceptionResolver;

        /** Orígenes permitidos, separados por comas (app.cors.allowed-origins). */
        @Value("${app.cors.allowed-origins}")
        private String allowedOrigins;

        public SecurityConfig(
                        JwtAuthenticationFilter jwtAuthFilter,
                        @Qualifier("handlerExceptionResolver") HandlerExceptionResolver handlerExceptionResolver) {
                this.jwtAuthFilter = jwtAuthFilter;
                this.handlerExceptionResolver = handlerExceptionResolver;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                // API stateless con JWT: sin CSRF ni sesion de servidor.
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // 1. Gestion de cuentas: MacondoLab y administradores.
                                                // Eliminar es solo del administrador. Las reglas sobre a
                                                // quien se gestiona las aplica UsuarioService.
                                                .requestMatchers(HttpMethod.DELETE, "/api/v1/admin/users/**").hasRole("ADMIN")
                                                .requestMatchers("/api/v1/admin/**").hasRole("MACONDOLAB")
                                                .requestMatchers("/api/v1/usuarios/admin/**").hasRole("MACONDOLAB")

                                                // 2. Escritura sobre catalogos
                                                .requestMatchers(HttpMethod.POST, CATALOGOS_INSTITUCIONALES).hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.PUT, CATALOGOS_INSTITUCIONALES).hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.POST, CATALOGOS_DE_CLASIFICACION).hasRole("MACONDOLAB")
                                                .requestMatchers(HttpMethod.PUT, CATALOGOS_DE_CLASIFICACION).hasRole("MACONDOLAB")

                                                // 3. Publico: login, registro y Swagger
                                                .requestMatchers(
                                                                "/api/v1/auth/**",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/v1/usuarios/registro")
                                                .permitAll()

                                                // 4. Lectura de catalogos: publica, la necesita el formulario
                                                // de registro antes de que exista sesion.
                                                .requestMatchers(HttpMethod.GET, CATALOGOS_INSTITUCIONALES).permitAll()
                                                .requestMatchers(HttpMethod.GET, CATALOGOS_DE_CLASIFICACION).permitAll()

                                                // 5. El resto exige sesion (incluye /api/v1/usuarios/me).
                                                // Gestionar a otros usuarios solo se hace desde
                                                // /api/v1/admin/users.
                                                // Docentes, jurados y estudiantes aun no tienen rutas
                                                // propias: llegan con las fases del dominio.
                                                .anyRequest().authenticated())
                                // Los rechazos de seguridad ocurren en la cadena de filtros, antes de
                                // llegar a un controlador. Se delegan al HandlerExceptionResolver
                                // para que GlobalExceptionHandler responda con el mismo Problem
                                // Details que el resto de la API: 401 sin sesion valida, 403 sin
                                // permiso. Sin esto, Spring Security respondia 403 en ambos casos.
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((request, response, e) -> handlerExceptionResolver
                                                                .resolveException(request, response, null, e))
                                                .accessDeniedHandler((request, response, e) -> handlerExceptionResolver
                                                                .resolveException(request, response, null, e)))
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        /**
         * ROLE_ADMIN incluye todo lo de ROLE_MACONDOLAB: cada regla se escribe con el
         * rol minimo que la permite. authorizeHttpRequests toma este bean solo.
         */
        @Bean
        static RoleHierarchy roleHierarchy() {
                return RoleHierarchyImpl.withDefaultRolePrefix()
                                .role("ADMIN").implies("MACONDOLAB")
                                .build();
        }

        /**
         * El filtro JWT es un @Component, y Spring Boot registra todo Filter como filtro
         * del contenedor. Aqui solo debe correr dentro de la cadena de Spring Security.
         */
        @Bean
        public FilterRegistrationBean<JwtAuthenticationFilter> jwtAuthFilterRegistration(JwtAuthenticationFilter filter) {
                FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
                registration.setEnabled(false);
                return registration;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOrigins(
                                Arrays.stream(allowedOrigins.split(","))
                                                .map(String::trim)
                                                .filter(o -> !o.isEmpty())
                                                .toList());
                configuration.setAllowedMethods(
                                Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(
                                Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
                configuration.setExposedHeaders(Arrays.asList("Authorization"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
