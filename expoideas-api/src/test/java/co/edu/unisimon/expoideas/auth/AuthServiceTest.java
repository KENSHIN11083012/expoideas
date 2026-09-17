package co.edu.unisimon.expoideas.auth;

import co.edu.unisimon.expoideas.entity.PendienteDeIngreso;
import co.edu.unisimon.expoideas.entity.RolUsuario;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.repository.UsuarioRepository;
import co.edu.unisimon.expoideas.security.CuentaAutenticada;
import co.edu.unisimon.expoideas.security.JwtService;
import co.edu.unisimon.expoideas.security.UsuarioDetailsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String CORREO = "marta@empresa.com";

    @Mock private UsuarioRepository repository;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private AuthService service;

    private final Usuario juradoNuevo = Usuario.builder().id(7).nombres("Marta").apellidos("Ríos")
            .correoInstitucional(CORREO).password("hash").rol(RolUsuario.jurado)
            .debeCambiarPassword(true).autorizaDatos(false).build();

    @Test
    void elLoginInformaLosPasosDePrimerIngreso() {
        CuentaAutenticada cuenta = new CuentaAutenticada(juradoNuevo);
        when(authenticationManager.authenticate(any()))
                .thenReturn(UsernamePasswordAuthenticationToken.authenticated(cuenta, null, cuenta.getAuthorities()));
        when(repository.findByCorreoInstitucional(CORREO)).thenReturn(Optional.of(juradoNuevo));
        when(jwtService.generateToken(cuenta)).thenReturn("jwt");

        LoginResponse respuesta = service.authenticate(new LoginRequest(CORREO, "Temporal#2026"));

        assertThat(respuesta.getToken()).isEqualTo("jwt");
        assertThat(respuesta.getRol()).isEqualTo("jurado");
        assertThat(respuesta.getPendientes())
                .containsExactly(PendienteDeIngreso.cambiarPassword, PendienteDeIngreso.autorizarDatos);
    }

    @Test
    void elPrincipalLlevaRolYPendientesDesdeLaBaseDeDatos() {
        UsuarioRepository repositorio = mock(UsuarioRepository.class);
        when(repositorio.findByCorreoInstitucional(CORREO)).thenReturn(Optional.of(juradoNuevo));

        UserDetails cargado = new UsuarioDetailsService(repositorio).loadUserByUsername(CORREO);

        assertThat(cargado).isInstanceOf(CuentaAutenticada.class);
        assertThat(cargado.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_JURADO");
        assertThat(((CuentaAutenticada) cargado).getPendientesDeIngreso())
                .containsExactly(PendienteDeIngreso.cambiarPassword, PendienteDeIngreso.autorizarDatos);
    }
}
