package co.edu.unisimon.expoideas.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import co.edu.unisimon.expoideas.common.ExpoideasProperties;
import co.edu.unisimon.expoideas.support.TestData;
import co.edu.unisimon.expoideas.users.Role;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Date;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

class JwtAuthenticationFilterTest {

    private static final String EMAIL = "ana@unisimon.edu.co";

    private JwtService jwtService;
    private UserDetailsService userDetailsService;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        ExpoideasProperties properties = TestData.properties(Path.of("uploads"));
        jwtService = new JwtService(properties);
        userDetailsService = mock(UserDetailsService.class);
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rolesComeFromTheDatabaseNotFromTheToken() throws Exception {
        String tokenFromWhenItWasAdmin = jwtService.generateToken(principal(Role.ADMIN));
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(principal(Role.STUDENT));

        Authentication authentication = filter(tokenFromWhenItWasAdmin);

        assertThat(authentication.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_STUDENT");
    }

    @Test
    void validTokenAuthenticatesTheRequest() throws Exception {
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(principal(Role.ADMIN));

        Authentication authentication = filter(" " + jwtService.generateToken(principal(Role.ADMIN)) + " ");

        assertThat(authentication.getName()).isEqualTo(EMAIL);
        assertThat(authentication.getPrincipal()).isInstanceOf(UserPrincipal.class);
    }

    @Test
    void tamperedTokenDoesNotAuthenticate() throws Exception {
        String token = jwtService.generateToken(principal(Role.STUDENT));

        assertThat(filter(token.substring(0, token.length() - 2) + "xx")).isNull();
    }

    @Test
    void expiredTokenDoesNotAuthenticate() throws Exception {
        String expired = Jwts.builder()
                .subject(EMAIL)
                .expiration(Date.from(Instant.now().minusSeconds(60)))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(TestData.JWT_SECRET)))
                .compact();

        assertThat(filter(expired)).isNull();
    }

    @Test
    void theTokenCarriesTheRoleForTheFrontend() {
        String token = jwtService.generateToken(principal(Role.MACONDOLAB));

        String role = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(TestData.JWT_SECRET)))
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
        assertThat(role).isEqualTo("MACONDOLAB");
    }

    private Authentication filter(String token) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/admin/users");
        request.addHeader("Authorization", "Bearer " + token);
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private static UserPrincipal principal(Role role) {
        return new UserPrincipal(TestData.user(1, EMAIL, role));
    }
}
