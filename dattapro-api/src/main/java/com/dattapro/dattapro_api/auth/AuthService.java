package com.dattapro.dattapro_api.auth;

import com.dattapro.dattapro_api.config.JwtService;
import com.dattapro.dattapro_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository repository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public LoginResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var usuario = repository.findByCorreoInstitucional(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
        
        UserDetails userDetails = User.builder()
                .username(usuario.getCorreoInstitucional())
                .password(usuario.getPassword())
                .roles(usuario.getRol().name().toUpperCase())
                .build();

        var jwtToken = jwtService.generateToken(userDetails);
        return LoginResponse.builder()
                .token(jwtToken)
                .rol(usuario.getRol().name())
                .build();
    }
}
