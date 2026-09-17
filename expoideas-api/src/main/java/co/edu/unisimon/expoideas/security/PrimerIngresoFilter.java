package co.edu.unisimon.expoideas.security;

import co.edu.unisimon.expoideas.exception.PrimerIngresoPendienteException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Mientras la cuenta tenga pasos de primer ingreso sin completar (contraseña
 * temporal, autorización de datos), solo puede resolverlos: ver su perfil,
 * cambiar su contraseña y autorizar el tratamiento de datos. Cualquier otra
 * petición a la API responde 403 con {@code pendientes}.
 *
 * <p>Corre después de JwtAuthenticationFilter y antes de las reglas de
 * autorización: aplica igual para todos los roles. No es un @Component para
 * que Spring Boot no lo registre también como filtro del contenedor.
 */
public class PrimerIngresoFilter extends OncePerRequestFilter {

    private final HandlerExceptionResolver handlerExceptionResolver;
    private final RequestMatcher permitidas;

    public PrimerIngresoFilter(HandlerExceptionResolver handlerExceptionResolver, String... lecturasPublicas) {
        this.handlerExceptionResolver = handlerExceptionResolver;

        PathPatternRequestMatcher.Builder ruta = PathPatternRequestMatcher.withDefaults();
        List<RequestMatcher> matchers = new ArrayList<>(List.of(
                ruta.matcher("/api/v1/auth/**"),
                ruta.matcher(HttpMethod.GET, "/api/v1/usuarios/me"),
                ruta.matcher(HttpMethod.PUT, "/api/v1/usuarios/me/password"),
                ruta.matcher(HttpMethod.PUT, "/api/v1/usuarios/me/autorizacion-datos")));
        // Lo público sigue siendo público aunque la petición lleve sesión.
        for (String lectura : lecturasPublicas) {
            matchers.add(ruta.matcher(HttpMethod.GET, lectura));
        }
        this.permitidas = new OrRequestMatcher(matchers);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        // Swagger y demás rutas fuera de la API no dependen del primer ingreso.
        return !request.getRequestURI().startsWith(request.getContextPath() + "/api/");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion != null
                && autenticacion.getPrincipal() instanceof CuentaAutenticada cuenta
                && !cuenta.getPendientesDeIngreso().isEmpty()
                && !permitidas.matches(request)) {
            // Mismo camino que los 401/403 de SecurityConfig: Problem Details desde GlobalExceptionHandler.
            handlerExceptionResolver.resolveException(request, response, null,
                    new PrimerIngresoPendienteException(cuenta.getPendientesDeIngreso()));
            return;
        }
        filterChain.doFilter(request, response);
    }
}
