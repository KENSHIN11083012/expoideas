package com.dattapro.dattapro_api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null) {
            authHeader = authHeader.replace("\n", "").replace("\r", "").trim();
        }

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Nunca loguear el header ni el token: identifican una sesión activa.
            String jwt = authHeader.substring(BEARER_PREFIX.length()).replaceAll("\s+", "");
            String userEmail = jwtService.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            resolveAuthorities(jwt, userDetails));
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token inválido, expirado o usuario inexistente: se sigue sin autenticar.
            // Las rutas protegidas responderán 401/403; las públicas siguen funcionando.
            SecurityContextHolder.clearContext();
            log.debug("No se pudo autenticar la petición a {}: {}",
                    request.getRequestURI(), e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Usa el claim "role" del token y, si no viene, cae a las autoridades del UserDetails.
     * Normaliza al formato ROLE_X que espera Spring Security.
     */
    private Collection<? extends GrantedAuthority> resolveAuthorities(String jwt, UserDetails userDetails) {
        List<?> roles = jwtService.extractClaim(jwt, claims -> claims.get("role", List.class));
        if (roles == null || roles.isEmpty()) {
            return userDetails.getAuthorities();
        }
        return roles.stream()
                .map(r -> String.valueOf(r))
                .map(role -> role.toUpperCase().startsWith("ROLE_")
                        ? role.toUpperCase()
                        : "ROLE_" + role.toUpperCase())
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
}
