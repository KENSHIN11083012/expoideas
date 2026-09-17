package com.dattapro.dattapro_api.auth;

import com.dattapro.dattapro_api.entity.Usuario;
import com.dattapro.dattapro_api.repository.UsuarioRepository;
import com.dattapro.dattapro_api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository repository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * @throws org.springframework.security.core.AuthenticationException si las credenciales no son válidas
     */
    @Transactional(readOnly = true)
    public LoginResponse authenticate(LoginRequest request) {
        Authentication autenticado = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password()));

        // El principal ya es el UserDetails que cargó UsuarioDetailsService, con sus roles.
        UserDetails userDetails = (UserDetails) autenticado.getPrincipal();
        Usuario usuario = repository.findByCorreoInstitucional(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        return LoginResponse.builder()
                .token(jwtService.generateToken(userDetails))
                .rol(usuario.getRol().name())
                .id(usuario.getId())
                .nombres(usuario.getNombres())
                .apellidos(usuario.getApellidos())
                .build();
    }
}
