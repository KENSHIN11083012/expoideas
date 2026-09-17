package com.dattapro.dattapro_api.security;

import com.dattapro.dattapro_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Carga el usuario de la base de datos para Spring Security. El username es el
 * correo institucional y el rol se expone como ROLE_ADMIN, ROLE_EMPRENDEDOR...
 *
 * <p>Con este bean y el PasswordEncoder de {@link SecurityConfig}, Spring
 * Security arma solo el DaoAuthenticationProvider: no hace falta declararlo.
 */
@Service
@RequiredArgsConstructor
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository repository;

    @Override
    public UserDetails loadUserByUsername(String correo) {
        return repository.findByCorreoInstitucional(correo)
                .map(u -> User.builder()
                        .username(u.getCorreoInstitucional())
                        .password(u.getPassword())
                        .roles(u.getRol().name().toUpperCase())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }
}
