package co.edu.unisimon.expoideas.security;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

        /** Rutas de los catalogos maestros: lectura publica, escritura solo ADMIN. */
        private static final String[] CATALOGOS = {
                        "/api/v1/sedes/**",
                        "/api/v1/facultades/**",
                        "/api/v1/programas-academicos/**",
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
                                                // 1. Administracion
                                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/v1/usuarios/admin/**").hasRole("ADMIN")

                                                // 2. Escritura sobre catalogos maestros: solo ADMIN
                                                .requestMatchers(HttpMethod.POST, CATALOGOS).hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.PUT, CATALOGOS).hasRole("ADMIN")

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
                                                .requestMatchers(HttpMethod.GET, CATALOGOS).permitAll()

                                                // 5. El resto exige sesion (incluye /api/v1/usuarios/me).
                                                // Gestionar a otros usuarios solo se hace desde
                                                // /api/v1/admin/users.
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
