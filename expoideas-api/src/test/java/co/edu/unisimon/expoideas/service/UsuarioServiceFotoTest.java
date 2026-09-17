package co.edu.unisimon.expoideas.service;

import co.edu.unisimon.expoideas.archivos.FormatoArchivo;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.entity.Archivo;
import co.edu.unisimon.expoideas.entity.RolUsuario;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.entity.VisibilidadArchivo;
import co.edu.unisimon.expoideas.repository.FacultadRepository;
import co.edu.unisimon.expoideas.repository.ProgramaAcademicoRepository;
import co.edu.unisimon.expoideas.repository.SedeRepository;
import co.edu.unisimon.expoideas.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Foto de perfil: se guarda como imagen pública y la anterior no queda huérfana. */
@ExtendWith(MockitoExtension.class)
class UsuarioServiceFotoTest {

    private static final String CORREO = "ana@unisimon.edu.co";

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private SedeRepository sedeRepository;
    @Mock private FacultadRepository facultadRepository;
    @Mock private ProgramaAcademicoRepository programaAcademicoRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ArchivoService archivoService;

    @InjectMocks private UsuarioService service;

    private Usuario ana;
    private final MockMultipartFile imagen = new MockMultipartFile("archivo", "yo.png", "image/png", new byte[] { 1 });

    @BeforeEach
    void cuenta() {
        ana = Usuario.builder().id(1).nombres("Ana").apellidos("Pérez").correoInstitucional(CORREO)
                .rol(RolUsuario.estudiante).autorizaDatos(true).build();
        lenient().when(usuarioRepository.findByCorreoWithBaseInfo(CORREO)).thenReturn(Optional.of(ana));
        lenient().when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static Archivo archivo(String uuid) {
        return Archivo.builder().uuid(uuid).ruta(uuid + ".png").build();
    }

    @Test
    void laPrimeraFotoSeGuardaComoImagenPublica() {
        when(archivoService.guardar(imagen, FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana)).thenReturn(archivo("nueva"));

        UsuarioResponseDTO perfil = service.actualizarFotoPropia(CORREO, imagen);

        assertThat(perfil.getFotoId()).isEqualTo("nueva");
        verify(archivoService, never()).eliminar(any());
    }

    @Test
    void reemplazarLaFotoBorraLaAnteriorDespuesDeGuardarLaNueva() {
        Archivo anterior = archivo("anterior");
        ana.setFoto(anterior);
        when(archivoService.guardar(any(), any(), any(), any())).thenReturn(archivo("nueva"));

        UsuarioResponseDTO perfil = service.actualizarFotoPropia(CORREO, imagen);

        assertThat(perfil.getFotoId()).isEqualTo("nueva");
        InOrder orden = inOrder(archivoService);
        orden.verify(archivoService).guardar(any(), any(), any(), any());
        orden.verify(archivoService).eliminar(anterior);
    }

    @Test
    void quitarLaFotoLaBorra() {
        Archivo foto = archivo("actual");
        ana.setFoto(foto);

        service.eliminarFotoPropia(CORREO);

        assertThat(ana.getFoto()).isNull();
        verify(archivoService).eliminar(foto);
    }

    @Test
    void quitarLaFotoSinTenerNoHaceNada() {
        service.eliminarFotoPropia(CORREO);

        verify(archivoService, never()).eliminar(any());
    }

    @Test
    void eliminarUnaCuentaBorraSusArchivos() {
        Usuario admin = Usuario.builder().id(9).correoInstitucional("luis@unisimon.edu.co").rol(RolUsuario.admin).build();
        when(usuarioRepository.findByCorreoWithBaseInfo("luis@unisimon.edu.co")).thenReturn(Optional.of(admin));
        when(usuarioRepository.findByIdWithBaseInfo(1)).thenReturn(Optional.of(ana));
        ana.setFoto(archivo("actual"));

        service.eliminarUsuario("luis@unisimon.edu.co", 1);

        InOrder orden = inOrder(archivoService, usuarioRepository);
        orden.verify(archivoService).eliminarDePropietario(ana);
        orden.verify(usuarioRepository).delete(ana);
        assertThat(ana.getFoto()).isNull();
    }
}
