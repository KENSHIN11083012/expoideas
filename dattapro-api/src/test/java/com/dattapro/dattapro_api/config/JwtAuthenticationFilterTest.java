package com.dattapro.dattapro_api.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * El filtro debe tomar los permisos de la base de datos y no del claim "role"
 * del token: un token emitido cuando el usuario era admin no puede seguir
 * dándole acceso de admin después de que se le quite el rol.
 */
class JwtAuthenticationFilterTest {

    private static final String CORREO = "ana@unisimon.edu.co";

    private JwtService jwtService;
    private UserDetailsService userDetailsService;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Clave solo para el test (32 bytes en base64).
        ReflectionTestUtils.setField(jwtService, "secretKey", "dGVzdC1zZWNyZXQtZXhwb2lkZWFzLTMyLWJ5dGVzISE=");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 60_000L);

        userDetailsService = mock(UserDetailsService.class);
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
    }

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void usaLosRolesDeLaBaseDeDatosYNoLosDelToken() throws Exception {
        String tokenDeCuandoEraAdmin = jwtService.generateToken(usuario("ADMIN"));
        when(userDetailsService.loadUserByUsername(CORREO)).thenReturn(usuario("EMPRENDEDOR"));

        Authentication auth = filtrar(tokenDeCuandoEraAdmin);

        assertThat(auth).isNotNull();
        assertThat(auth.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_EMPRENDEDOR");
    }

    @Test
    void tokenValidoDejaLaSesionAutenticada() throws Exception {
        String token = jwtService.generateToken(usuario("ADMIN"));
        when(userDetailsService.loadUserByUsername(CORREO)).thenReturn(usuario("ADMIN"));

        Authentication auth = filtrar(token);

        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo(CORREO);
        assertThat(auth.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void tokenManipuladoNoAutentica() throws Exception {
        String token = jwtService.generateToken(usuario("EMPRENDEDOR"));

        Authentication auth = filtrar(token.substring(0, token.length() - 2) + "xx");

        assertThat(auth).isNull();
    }

    private Authentication filtrar(String token) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/admin/users");
        request.addHeader("Authorization", "Bearer " + token);
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private static UserDetails usuario(String rol) {
        return User.builder().username(CORREO).password("hash").roles(rol).build();
    }
}
