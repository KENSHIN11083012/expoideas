package co.edu.unisimon.expoideas.service;

import co.edu.unisimon.expoideas.dto.CambiarPasswordDTO;
import co.edu.unisimon.expoideas.dto.UsuarioAdminCreateDTO;
import co.edu.unisimon.expoideas.dto.UsuarioAdminUpdateDTO;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.entity.Facultad;
import co.edu.unisimon.expoideas.entity.RolUsuario;
import co.edu.unisimon.expoideas.entity.Sede;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.exception.AccionNoPermitidaException;
import co.edu.unisimon.expoideas.exception.CamposInvalidosException;
import co.edu.unisimon.expoideas.exception.ConflictException;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Quién puede gestionar a quién: MacondoLab no toca cuentas de gestión, nadie
 * cambia su propio rol ni se elimina, y las cuentas creadas desde la gestión
 * respetan las reglas de correo y adscripción de su rol.
 */
@ExtendWith(MockitoExtension.class)
class UsuarioServiceGestionTest {

    private static final String CORREO_ADMIN = "luis@unisimon.edu.co";
    private static final String CORREO_MACONDOLAB = "coordinacion@unisimon.edu.co";

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private SedeRepository sedeRepository;
    @Mock private FacultadRepository facultadRepository;
    @Mock private ProgramaAcademicoRepository programaAcademicoRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UsuarioService service;

    private Usuario admin;
    private Usuario macondolab;
    private Usuario estudiante;

    @BeforeEach
    void cuentas() {
        admin = cuenta(1, CORREO_ADMIN, RolUsuario.admin);
        macondolab = cuenta(2, CORREO_MACONDOLAB, RolUsuario.macondolab);
        estudiante = cuenta(3, "ana@unisimon.edu.co", RolUsuario.estudiante);

        for (Usuario u : new Usuario[] { admin, macondolab, estudiante }) {
            lenient().when(usuarioRepository.findByCorreoWithBaseInfo(u.getCorreoInstitucional())).thenReturn(Optional.of(u));
            lenient().when(usuarioRepository.findByIdWithBaseInfo(u.getId())).thenReturn(Optional.of(u));
        }
        lenient().when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(passwordEncoder.encode(any())).thenReturn("hash");
    }

    // ── Editar y cambiar rol ───────────────────────────────────────────────

    @Test
    void macondoLabAsignaJuradoAUnEstudiante() {
        UsuarioResponseDTO actualizado = service.actualizarDesdeAdmin(CORREO_MACONDOLAB, 3, conRol(RolUsuario.jurado));

        assertThat(actualizado.getRol()).isEqualTo("jurado");
    }

    @Test
    void macondoLabNoModificaUnaCuentaDeAdministrador() {
        assertThatThrownBy(() -> service.actualizarDesdeAdmin(CORREO_MACONDOLAB, 1, conNombres("Otro")))
                .isInstanceOf(AccionNoPermitidaException.class)
                .hasMessageContaining("Solo un administrador puede modificar");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void macondoLabNoOtorgaRolesDeGestion() {
        assertThatThrownBy(() -> service.actualizarDesdeAdmin(CORREO_MACONDOLAB, 3, conRol(RolUsuario.macondolab)))
                .isInstanceOf(AccionNoPermitidaException.class)
                .hasMessageContaining("Solo un administrador puede asignar");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void administradorOtorgaMacondoLab() {
        UsuarioResponseDTO actualizado = service.actualizarDesdeAdmin(CORREO_ADMIN, 3, conRol(RolUsuario.macondolab));

        assertThat(actualizado.getRol()).isEqualTo("macondolab");
    }

    @Test
    void nadieCambiaSuPropioRol() {
        assertThatThrownBy(() -> service.actualizarDesdeAdmin(CORREO_ADMIN, 1, conRol(RolUsuario.estudiante)))
                .isInstanceOf(AccionNoPermitidaException.class)
                .hasMessage("No puedes cambiar tu propio rol.");
    }

    @Test
    void enviarElMismoRolNoEsUnCambio() {
        UsuarioAdminUpdateDTO dto = new UsuarioAdminUpdateDTO("Luis Alberto", null, null, null, null, null, RolUsuario.admin, null, null, null);

        UsuarioResponseDTO actualizado = service.actualizarDesdeAdmin(CORREO_ADMIN, 1, dto);

        assertThat(actualizado.getNombres()).isEqualTo("Luis Alberto");
    }

    // ── Contraseñas y eliminación ──────────────────────────────────────────

    @Test
    void macondoLabNoRestableceLaContrasenaDeUnAdministrador() {
        assertThatThrownBy(() -> service.restablecerPasswordAdmin(CORREO_MACONDOLAB, CORREO_ADMIN, nuevaPassword()))
                .isInstanceOf(AccionNoPermitidaException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void laPropiaContrasenaNoSeRestablecePorLaGestion() {
        assertThatThrownBy(() -> service.restablecerPasswordAdmin(CORREO_ADMIN, CORREO_ADMIN, nuevaPassword()))
                .isInstanceOf(AccionNoPermitidaException.class)
                .hasMessageContaining("Seguridad");
    }

    @Test
    void macondoLabRestableceLaContrasenaDeUnEstudiante() {
        service.restablecerPasswordAdmin(CORREO_MACONDOLAB, "ana@unisimon.edu.co", nuevaPassword());

        verify(usuarioRepository).save(estudiante);
    }

    @Test
    void nadieEliminaSuPropiaCuenta() {
        assertThatThrownBy(() -> service.eliminarUsuario(CORREO_ADMIN, 1))
                .isInstanceOf(AccionNoPermitidaException.class)
                .hasMessage("No puedes eliminar tu propia cuenta.");
        verify(usuarioRepository, never()).delete(any());
    }

    @Test
    void administradorEliminaOtraCuenta() {
        service.eliminarUsuario(CORREO_ADMIN, 3);

        verify(usuarioRepository).delete(estudiante);
    }

    // ── Crear cuentas ──────────────────────────────────────────────────────

    @Test
    void juradoExternoPuedeTenerCorreoPersonalYNoLlevaAdscripcion() {
        UsuarioResponseDTO creado = service.crearDesdeGestion(CORREO_MACONDOLAB,
                nueva("marta@empresa.com", RolUsuario.jurado, null, null));

        assertThat(creado.getCorreoInstitucional()).isEqualTo("marta@empresa.com");
        assertThat(creado.getRol()).isEqualTo("jurado");
        assertThat(creado.getFacultadId()).isNull();
    }

    @Test
    void estudianteCreadoExigeCorreoInstitucionalYAdscripcion() {
        assertThatThrownBy(() -> service.crearDesdeGestion(CORREO_MACONDOLAB,
                nueva("ana@gmail.com", RolUsuario.estudiante, null, null)))
                .isInstanceOfSatisfying(CamposInvalidosException.class, ex -> assertThat(ex.getCampos())
                        .containsOnlyKeys("correoInstitucional", "sedeId", "facultadId"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void docenteCreadoConAdscripcion() {
        when(sedeRepository.findById(1)).thenReturn(Optional.of(new Sede(1, "Barranquilla")));
        when(facultadRepository.findById(10)).thenReturn(Optional.of(new Facultad(10, "Ingeniería")));

        UsuarioResponseDTO creado = service.crearDesdeGestion(CORREO_MACONDOLAB,
                nueva("pedro@unisimon.edu.co", RolUsuario.docente, 1, 10));

        assertThat(creado.getRol()).isEqualTo("docente");
        assertThat(creado.getFacultad()).isEqualTo("Ingeniería");
    }

    @Test
    void macondoLabNoCreaCuentasDeGestion() {
        assertThatThrownBy(() -> service.crearDesdeGestion(CORREO_MACONDOLAB,
                nueva("otro@unisimon.edu.co", RolUsuario.admin, null, null)))
                .isInstanceOf(AccionNoPermitidaException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void correoRepetidoEs409() {
        when(usuarioRepository.existsByCorreoInstitucional("marta@empresa.com")).thenReturn(true);

        assertThatThrownBy(() -> service.crearDesdeGestion(CORREO_ADMIN,
                nueva("marta@empresa.com", RolUsuario.jurado, null, null)))
                .isInstanceOf(ConflictException.class);
    }

    private static Usuario cuenta(int id, String correo, RolUsuario rol) {
        return Usuario.builder().id(id).nombres("Nombre").apellidos("Apellido").correoInstitucional(correo)
                .password("hash-actual").rol(rol).build();
    }

    private static UsuarioAdminUpdateDTO conRol(RolUsuario rol) {
        return new UsuarioAdminUpdateDTO(null, null, null, null, null, null, rol, null, null, null);
    }

    private static UsuarioAdminUpdateDTO conNombres(String nombres) {
        return new UsuarioAdminUpdateDTO(nombres, null, null, null, null, null, null, null, null, null);
    }

    private static UsuarioAdminCreateDTO nueva(String correo, RolUsuario rol, Integer sedeId, Integer facultadId) {
        return new UsuarioAdminCreateDTO("Marta", "Ríos", correo, "Temporal#2026", rol, sedeId, facultadId, null);
    }

    private static CambiarPasswordDTO nuevaPassword() {
        return new CambiarPasswordDTO(null, "Nueva#2026", "Nueva#2026");
    }
}
