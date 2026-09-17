package co.edu.unisimon.expoideas.security;

import co.edu.unisimon.expoideas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Carga el usuario de la base de datos para Spring Security como
 * {@link CuentaAutenticada}. El username es el correo institucional y el rol se
 * expone como ROLE_ADMIN, ROLE_ESTUDIANTE...
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
                .<UserDetails>map(CuentaAutenticada::new)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }
}
