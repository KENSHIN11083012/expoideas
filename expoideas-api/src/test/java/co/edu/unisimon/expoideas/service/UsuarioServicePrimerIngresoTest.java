package co.edu.unisimon.expoideas.service;

import co.edu.unisimon.expoideas.dto.CambiarPasswordDTO;
import co.edu.unisimon.expoideas.dto.UsuarioAdminCreateDTO;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.entity.PendienteDeIngreso;
import co.edu.unisimon.expoideas.entity.RolUsuario;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.repository.FacultadRepository;
import co.edu.unisimon.expoideas.repository.ProgramaAcademicoRepository;
import co.edu.unisimon.expoideas.repository.SedeRepository;
import co.edu.unisimon.expoideas.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Qué deja pendiente cada operación: una contraseña puesta por la gestión es
 * temporal, la elegida por la persona no, y el consentimiento lo da la persona.
 */
@ExtendWith(MockitoExtension.class)
class UsuarioServicePrimerIngresoTest {

    private static final String CORREO_ADMIN = "luis@unisimon.edu.co";
    private static final String CORREO_JURADO = "marta@empresa.com";

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private SedeRepository sedeRepository;
    @Mock private FacultadRepository facultadRepository;
    @Mock private ProgramaAcademicoRepository programaAcademicoRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UsuarioService service;

    private Usuario jurado;

    @BeforeEach
    void cuentas() {
        Usuario admin = Usuario.builder().id(1).correoInstitucional(CORREO_ADMIN).password("hash-admin")
                .rol(RolUsuario.admin).autorizaDatos(true).build();
        jurado = Usuario.builder().id(2).nombres("Marta").apellidos("Ríos").correoInstitucional(CORREO_JURADO)
                .password("hash-temporal").rol(RolUsuario.jurado).debeCambiarPassword(true).autorizaDatos(false).build();

        lenient().when(usuarioRepository.findByCorreoWithBaseInfo(CORREO_ADMIN)).thenReturn(Optional.of(admin));
        lenient().when(usuarioRepository.findByCorreoWithBaseInfo(CORREO_JURADO)).thenReturn(Optional.of(jurado));
        lenient().when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hash-nuevo");
    }

    @Test
    void cuentaCreadaPorLaGestionNaceConContrasenaTemporalYSinConsentimiento() {
        UsuarioResponseDTO creada = service.crearDesdeGestion(CORREO_ADMIN, new UsuarioAdminCreateDTO(
                "Pedro", "Gil", "pedro@consultora.co", "Temporal#2026", RolUsuario.jurado, null, null, null));

        assertThat(creada.getPendientes())
                .containsExactly(PendienteDeIngreso.cambiarPassword, PendienteDeIngreso.autorizarDatos);
    }

    @Test
    void cambiarLaPropiaContrasenaQuitaLaMarcaDeTemporal() {
        when(passwordEncoder.matches("Temporal#2026", "hash-temporal")).thenReturn(true);

        service.cambiarPasswordPropio(CORREO_JURADO, new CambiarPasswordDTO("Temporal#2026", "Propia#2026", "Propia#2026"));

        assertThat(jurado.getDebeCambiarPassword()).isFalse();
        assertThat(jurado.getPassword()).isEqualTo("hash-nuevo");
        assertThat(jurado.pendientesDeIngreso()).containsExactly(PendienteDeIngreso.autorizarDatos);
    }

    @Test
    void restablecerDesdeLaGestionVuelveTemporalLaContrasena() {
        jurado.setDebeCambiarPassword(false);

        service.restablecerPasswordAdmin(CORREO_ADMIN, CORREO_JURADO, new CambiarPasswordDTO(null, "Reset#2026", "Reset#2026"));

        assertThat(jurado.getDebeCambiarPassword()).isTrue();
    }

    @Test
    void autorizarDatosGuardaElConsentimientoConSuFecha() {
        service.autorizarDatosPropio(CORREO_JURADO);

        assertThat(jurado.getAutorizaDatos()).isTrue();
        assertThat(jurado.getFechaAutorizacionDatos()).isNotNull();
        verify(usuarioRepository).save(jurado);
    }

    @Test
    void autorizarOtraVezConservaLaFechaOriginal() {
        LocalDateTime original = LocalDateTime.of(2026, 9, 1, 10, 0);
        jurado.setAutorizaDatos(true);
        jurado.setFechaAutorizacionDatos(original);

        service.autorizarDatosPropio(CORREO_JURADO);

        assertThat(jurado.getFechaAutorizacionDatos()).isEqualTo(original);
        verify(usuarioRepository, never()).save(eq(jurado));
    }
}
