package co.edu.unisimon.expoideas.auth;

import co.edu.unisimon.expoideas.security.JwtService;
import co.edu.unisimon.expoideas.security.UserPrincipal;
import co.edu.unisimon.expoideas.users.User;
import co.edu.unisimon.expoideas.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    /** @throws AuthenticationException si las credenciales no son válidas */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        UserPrincipal principal = (UserPrincipal) authenticationManager
                .authenticate(UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password()))
                .getPrincipal();
        // La cuenta existe: se acaba de autenticar contra ella. Se carga con la foto.
        User user = userRepository.findWithProfileByEmail(principal.getUsername()).orElseThrow();
        return new LoginResponse(
                jwtService.generateToken(principal),
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getPhoto() != null ? user.getPhoto().getUuid() : null,
                user.pendingSteps());
    }
}
