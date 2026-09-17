package co.edu.unisimon.expoideas.service;

import co.edu.unisimon.expoideas.dto.UsuarioAdminUpdateDTO;
import co.edu.unisimon.expoideas.dto.UsuarioRegistroDTO;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.dto.UsuarioUpdateDTO;
import co.edu.unisimon.expoideas.entity.Facultad;
import co.edu.unisimon.expoideas.entity.ProgramaAcademico;
import co.edu.unisimon.expoideas.entity.RolUsuario;
import co.edu.unisimon.expoideas.entity.Sede;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.exception.CamposInvalidosException;
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

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Reglas de la adscripción académica: la facultad es obligatoria, el programa
 * opcional y, si existe, debe ser de esa facultad. El administrador no tiene
 * adscripción. Las operaciones de gestión las hace un administrador (id 99).
 */
@ExtendWith(MockitoExtension.class)
class UsuarioServiceAdscripcionTest {

    private static final String CORREO = "ana@unisimon.edu.co";
    private static final String CORREO_ADMIN = "luis@unisimon.edu.co";

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private SedeRepository sedeRepository;
    @Mock private FacultadRepository facultadRepository;
    @Mock private ProgramaAcademicoRepository programaAcademicoRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ArchivoService archivoService;

    @InjectMocks private UsuarioService service;

    private final Sede barranquilla = new Sede(1, "Barranquilla");
    private final Facultad ingenieria = new Facultad(10, "Ingeniería");
    private final Facultad derecho = new Facultad(20, "Derecho");
    private final ProgramaAcademico sistemas = new ProgramaAcademico(100, "Ingeniería de Sistemas", ingenieria);

    @BeforeEach
    void catalogos() {
        lenient().when(sedeRepository.findById(1)).thenReturn(Optional.of(barranquilla));
        lenient().when(facultadRepository.findById(10)).thenReturn(Optional.of(ingenieria));
        lenient().when(facultadRepository.findById(20)).thenReturn(Optional.of(derecho));
        lenient().when(programaAcademicoRepository.findById(100)).thenReturn(Optional.of(sistemas));
        lenient().when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
        Usuario admin = Usuario.builder().id(99).correoInstitucional(CORREO_ADMIN).rol(RolUsuario.admin).build();
        lenient().when(usuarioRepository.findByCorreoWithBaseInfo(CORREO_ADMIN)).thenReturn(Optional.of(admin));
    }

    @Test
    void registroGuardaSedeFacultadYPrograma() {
        when(passwordEncoder.encode(any())).thenReturn("hash");

        UsuarioResponseDTO creado = service.registrarUsuario(registro(1, 10, 100));

        assertThat(creado.getSedeId()).isEqualTo(1);
        assertThat(creado.getFacultad()).isEqualTo("Ingeniería");
        assertThat(creado.getProgramaAcademico()).isEqualTo("Ingeniería de Sistemas");
    }

    @Test
    void registroSinProgramaEsValido() {
        when(passwordEncoder.encode(any())).thenReturn("hash");

        UsuarioResponseDTO creado = service.registrarUsuario(registro(1, 20, null));

        assertThat(creado.getFacultadId()).isEqualTo(20);
        assertThat(creado.getProgramaAcademicoId()).isNull();
    }

    @Test
    void programaDeOtraFacultadSeRechaza() {
        when(passwordEncoder.encode(any())).thenReturn("hash");

        assertThatThrownBy(() -> service.registrarUsuario(registro(1, 20, 100)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no pertenece a la facultad");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void facultadInexistenteEs404() {
        when(passwordEncoder.encode(any())).thenReturn("hash");
        when(facultadRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.registrarUsuario(registro(1, 99, null)))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void perfilPropioPuedeQuitarElPrograma() {
        Usuario ana = usuario();
        ana.setFacultad(ingenieria);
        ana.setProgramaAcademico(sistemas);
        when(usuarioRepository.findByCorreoWithBaseInfo(CORREO)).thenReturn(Optional.of(ana));

        UsuarioResponseDTO actualizado = service.actualizarPerfilPropio(
                CORREO, new UsuarioUpdateDTO(" Ana ", "Pérez", 1, 20, null));

        assertThat(actualizado.getNombres()).isEqualTo("Ana");
        assertThat(actualizado.getFacultad()).isEqualTo("Derecho");
        assertThat(actualizado.getProgramaAcademico()).isNull();
    }

    @Test
    void perfilDeEmprendedorExigeSedeYFacultad() {
        when(usuarioRepository.findByCorreoWithBaseInfo(CORREO)).thenReturn(Optional.of(usuario()));

        assertThatThrownBy(() -> service.actualizarPerfilPropio(CORREO, new UsuarioUpdateDTO("Ana", "Pérez", null, null, null)))
                .isInstanceOfSatisfying(CamposInvalidosException.class,
                        ex -> assertThat(ex.getCampos()).containsOnlyKeys("sedeId", "facultadId"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void perfilDeAdministradorIgnoraLaAdscripcion() {
        Usuario luis = usuario();
        luis.setRol(RolUsuario.admin);
        when(usuarioRepository.findByCorreoWithBaseInfo(CORREO)).thenReturn(Optional.of(luis));

        UsuarioResponseDTO actualizado = service.actualizarPerfilPropio(
                CORREO, new UsuarioUpdateDTO("Luis", "Gómez", 1, 10, 100));

        assertThat(actualizado.getNombres()).isEqualTo("Luis");
        assertThat(actualizado.getSedeId()).isNull();
        assertThat(actualizado.getFacultadId()).isNull();
        verifyNoInteractions(sedeRepository, facultadRepository, programaAcademicoRepository);
    }

    @Test
    void administradorNoRecibeAdscripcionDesdeElPanel() {
        Usuario luis = usuario();
        luis.setRol(RolUsuario.admin);
        when(usuarioRepository.findByIdWithBaseInfo(1)).thenReturn(Optional.of(luis));

        assertThatThrownBy(() -> service.actualizarDesdeAdmin(CORREO_ADMIN, 1, adminUpdate(null, 10, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no lleva adscripción");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void adminSoloConProgramaTomaLaFacultadDelPrograma() {
        Usuario ana = usuario();
        when(usuarioRepository.findByIdWithBaseInfo(1)).thenReturn(Optional.of(ana));

        UsuarioResponseDTO actualizado = service.actualizarDesdeAdmin(CORREO_ADMIN, 1, adminUpdate(null, null, 100));

        assertThat(actualizado.getFacultadId()).isEqualTo(10);
        assertThat(actualizado.getProgramaAcademicoId()).isEqualTo(100);
    }

    @Test
    void adminConFacultadReemplazaLaAdscripcion() {
        Usuario ana = usuario();
        ana.setFacultad(ingenieria);
        ana.setProgramaAcademico(sistemas);
        when(usuarioRepository.findByIdWithBaseInfo(1)).thenReturn(Optional.of(ana));

        UsuarioResponseDTO actualizado = service.actualizarDesdeAdmin(CORREO_ADMIN, 1, adminUpdate(1, 20, null));

        assertThat(actualizado.getSede()).isEqualTo("Barranquilla");
        assertThat(actualizado.getFacultad()).isEqualTo("Derecho");
        assertThat(actualizado.getProgramaAcademico()).isNull();
    }

    private static UsuarioRegistroDTO registro(Integer sedeId, Integer facultadId, Integer programaId) {
        return new UsuarioRegistroDTO("Ana", "Pérez", CORREO, "Segura#2026", sedeId, facultadId, programaId, true);
    }

    private static UsuarioAdminUpdateDTO adminUpdate(Integer sedeId, Integer facultadId, Integer programaId) {
        return new UsuarioAdminUpdateDTO(null, null, null, null, null, null, sedeId, facultadId, programaId);
    }

    private static Usuario usuario() {
        return Usuario.builder().id(1).nombres("Ana").apellidos("Pérez").correoInstitucional(CORREO).build();
    }
}
