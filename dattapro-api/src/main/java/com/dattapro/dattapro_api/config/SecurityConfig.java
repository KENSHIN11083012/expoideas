package com.dattapro.dattapro_api.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

        @Value("${ALLOWED_ORIGINS:http://localhost:5173}")
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
                                                // 1. Reglas de Administrador (Todas al principio)
                                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/v1/usuarios/admin/**").hasRole("ADMIN")
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/v1/convocatorias/**",
                                                                "/api/v1/categorias/**",
                                                                "/api/v1/entidades/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers(org.springframework.http.HttpMethod.PUT,
                                                                "/api/v1/convocatorias/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                                                                "/api/v1/convocatorias/**")
                                                .hasRole("ADMIN")

                                                // 2. Auth, Registro y Swagger (Públicos)
                                                .requestMatchers(
                                                                "/api/v1/auth/**",
                                                                "/api/v1/usuarios/registro",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html")
                                                .permitAll()

                                                // 3. Endpoints de Perfil y Password personales
                                                .requestMatchers("/api/v1/usuarios/perfil/me").authenticated()
                                                .requestMatchers("/api/v1/usuarios/me/password/**").authenticated()
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/v1/usuarios/perfil")
                                                .authenticated()
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/v1/usuarios/perfil/**")
                                                .permitAll()

                                                // 4. Datos maestros y consultas generales (Públicos)
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/v1/usuarios",
                                                                "/api/v1/usuarios/*",
                                                                "/api/v1/convocatorias/**",
                                                                "/api/v1/categorias/**",
                                                                "/api/v1/entidades/**",
                                                                "/api/v1/certificaciones/**",
                                                                "/api/v1/keywords/**")
                                                .permitAll()

                                                // 5. Por defecto cualquier otra cosa requiere estar autenticado
                                                .anyRequest().authenticated())

                                // 4. Proveedor y Filtro JWT
                                .authenticationProvider(authenticationProvider)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://127.0.0.1:5173"));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                // Importante: Permitir todos los headers que envía el navegador
                configuration.setAllowedHeaders(
                                Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
                configuration.setExposedHeaders(Arrays.asList("Authorization"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L); // Cache de 1 hora para las peticiones OPTIONS

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
