package com.dattapro.dattapro_api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null) {
                authHeader = authHeader.replace("\n", "").replace("\r", "").trim();
            }
            final String jwt;
            final String userEmail;
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("JwtFilter: No Auth Header in format 'Bearer ' found. Passing through to next filter.");
                filterChain.doFilter(request, response);
                return;
            }
            System.out.println("JwtFilter: Processing Auth Header -> " + authHeader);
            jwt = authHeader.substring(7).replaceAll("\\s+", "");
            userEmail = jwtService.extractUsername(jwt);
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    // Extraer y normalizar roles del token
                    java.util.List<String> roles = jwtService.extractClaim(jwt, claims -> claims.get("role", java.util.List.class));
                    java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> authorities;

                    if (roles != null && !roles.isEmpty()) {
                        authorities = roles.stream()
                                .map(role -> {
                                    String normalized = role.toUpperCase();
                                    if (!normalized.startsWith("ROLE_")) {
                                        normalized = "ROLE_" + normalized;
                                    }
                                    return new org.springframework.security.core.authority.SimpleGrantedAuthority(normalized);
                                })
                                .collect(java.util.stream.Collectors.toList());
                    } else {
                        // Fallback a las autoridades de UserDetails
                        authorities = userDetails.getAuthorities();
                    }

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            authorities);
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            filterChain.doFilter(request, response);
            return;
        }
    }
}
