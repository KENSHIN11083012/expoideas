package com.dattapro.dattapro_api.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final AuthenticationProvider authenticationProvider;

        /** Orígenes permitidos, separados por comas (app.cors.allowed-origins). */
        /** Rutas de los catalogos maestros: lectura publica, escritura solo ADMIN. */
        private static final String[] CATALOGOS = {
                        "/api/v1/sedes/**",
                        "/api/v1/facultades/**",
                        "/api/v1/programas-academicos/**",
                        "/api/v1/categorias/**",
                        "/api/v1/keywords/**"
        };

        @Value("${app.cors.allowed-origins}")
        private String allowedOrigins;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                // 1. Configuración de CORS y desactivación de CSRF (Crucial para APIs)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                // 2. Gestión de sesiones (Stateless para JWT)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                // 3. Reglas de Autorización
                                .authorizeHttpRequests(auth -> auth
                                                // 1. Administracion
                                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/v1/usuarios/admin/**").hasRole("ADMIN")

                                                // 2. Escritura sobre catalogos maestros: solo ADMIN
                                                .requestMatchers(HttpMethod.POST, CATALOGOS).hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.PUT, CATALOGOS).hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.DELETE, CATALOGOS).hasRole("ADMIN")

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

                                                // 5. El resto exige sesion. En Dattapro, GET /api/v1/usuarios
                                                // y /api/v1/usuarios/* eran permitAll: cualquiera sin
                                                // autenticar listaba a todos los usuarios con su correo.
                                                .anyRequest().authenticated())

                                // 4. Proveedor y Filtro JWT
                                .authenticationProvider(authenticationProvider)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
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
