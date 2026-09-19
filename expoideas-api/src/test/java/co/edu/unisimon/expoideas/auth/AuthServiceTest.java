package co.edu.unisimon.expoideas.auth;

import co.edu.unisimon.expoideas.security.JwtService;
import co.edu.unisimon.expoideas.security.UserPrincipal;
import co.edu.unisimon.expoideas.support.TestData;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import co.edu.unisimon.expoideas.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Optional;

import static co.edu.unisimon.expoideas.users.OnboardingStep.CHANGE_PASSWORD;
import static co.edu.unisimon.expoideas.users.OnboardingStep.DATA_CONSENT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String EMAIL = "marta@empresa.com";

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService service;

    @Test
    void loginReportsTheOnboardingSteps() {
        User newJudge = TestData.user(7, EMAIL, Role.JUDGE);
        newJudge.setMustChangePassword(true);
        newJudge.setDataConsent(false);
        UserPrincipal principal = new UserPrincipal(newJudge);
        when(authenticationManager.authenticate(any()))
                .thenReturn(UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities()));
        when(userRepository.findWithProfileByEmail(EMAIL)).thenReturn(Optional.of(newJudge));
        when(jwtService.generateToken(principal)).thenReturn("jwt");

        LoginResponse response = service.login(new LoginRequest(EMAIL, "Temporal#2026"));

        assertThat(response.token()).isEqualTo("jwt");
        assertThat(response.id()).isEqualTo(7);
        assertThat(response.role()).isEqualTo(Role.JUDGE);
        assertThat(response.photoId()).isNull();
        assertThat(response.pendingSteps()).containsExactly(CHANGE_PASSWORD, DATA_CONSENT);
    }
}
