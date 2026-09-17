package co.edu.unisimon.expoideas.service;

import co.edu.unisimon.expoideas.archivos.AlmacenamientoArchivos;
import co.edu.unisimon.expoideas.archivos.ContenidoArchivo;
import co.edu.unisimon.expoideas.archivos.FormatoArchivo;
import co.edu.unisimon.expoideas.entity.Archivo;
import co.edu.unisimon.expoideas.entity.RolUsuario;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.entity.VisibilidadArchivo;
import co.edu.unisimon.expoideas.exception.CamposInvalidosException;
import co.edu.unisimon.expoideas.repository.ArchivoRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.EnumSet;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Validación de lo subido, coherencia entre disco y BD, y quién puede descargar.
 */
@ExtendWith(MockitoExtension.class)
class ArchivoServiceTest {

    private static final byte[] PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13 };
    private static final byte[] PDF = "%PDF-1.7\n".getBytes();

    @Mock private ArchivoRepository archivoRepository;
    @Mock private AlmacenamientoArchivos almacenamiento;

    @InjectMocks private ArchivoService service;

    private final Usuario ana = Usuario.builder().id(1).correoInstitucional("ana@unisimon.edu.co").rol(RolUsuario.estudiante).build();

    @BeforeEach
    void transaccion() {
        // Los métodos exigen transacción: aquí se simula para poder terminarla a mano.
        TransactionSynchronizationManager.initSynchronization();
        lenient().when(archivoRepository.save(any(Archivo.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void limpiar() {
        TransactionSynchronizationManager.clear();
    }

    private static void terminarTransaccion(int estado) {
        TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(estado));
    }

    // ── Guardar ────────────────────────────────────────────────────────────

    @Test
    void guardaUnaImagenConSusMetadatos() {
        Archivo archivo = service.guardar(new MockMultipartFile("archivo", "C:\\fotos\\mi foto.PNG", "image/png", PNG),
                FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana);

        assertThat(UUID.fromString(archivo.getUuid())).isNotNull();
        assertThat(archivo.getTipoContenido()).isEqualTo("image/png");
        assertThat(archivo.getTamanoBytes()).isEqualTo(PNG.length);
        assertThat(archivo.getSha256()).hasSize(64);
        assertThat(archivo.getNombreOriginal()).isEqualTo("mi foto.png");
        assertThat(archivo.getRuta()).matches("\\d{4}/\\d{2}/" + archivo.getUuid() + "\\.png");
        assertThat(archivo.getPropietario()).isSameAs(ana);
        verify(almacenamiento).guardar(archivo.getRuta(), PNG);
    }

    @Test
    void elTipoLoDecideElContenidoNoLoQueDiceElNavegador() {
        // Un HTML que el navegador declara como imagen.
        MockMultipartFile disfrazado = new MockMultipartFile("archivo", "foto.png", "image/png", "<script>alert(1)</script>".getBytes());

        assertThatThrownBy(() -> service.guardar(disfrazado, FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana))
                .isInstanceOfSatisfying(CamposInvalidosException.class, ex -> assertThat(ex.getCampos())
                        .containsEntry("archivo", "Formato no permitido. Usa un archivo JPG, PNG o WEBP."));
        verify(almacenamiento, never()).guardar(anyString(), any());
    }

    @Test
    void unPdfNoPasaDondeSoloSeAceptanImagenes() {
        MockMultipartFile pdf = new MockMultipartFile("archivo", "poster.pdf", "application/pdf", PDF);

        assertThatThrownBy(() -> service.guardar(pdf, FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana))
                .isInstanceOf(CamposInvalidosException.class);
        assertThat(service.guardar(pdf, EnumSet.of(FormatoArchivo.PDF), VisibilidadArchivo.privado, ana).getTipoContenido())
                .isEqualTo("application/pdf");
    }

    @Test
    void rechazaArchivosVaciosYDeMasDe5MB() {
        assertThatThrownBy(() -> service.guardar(new MockMultipartFile("archivo", "vacio.png", "image/png", new byte[0]),
                FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana))
                .isInstanceOfSatisfying(CamposInvalidosException.class,
                        ex -> assertThat(ex.getCampos()).containsEntry("archivo", "El archivo está vacío."));

        byte[] grande = new byte[ArchivoService.TAMANO_MAXIMO_BYTES + 1];
        System.arraycopy(PNG, 0, grande, 0, PNG.length);
        assertThatThrownBy(() -> service.guardar(new MockMultipartFile("archivo", "grande.png", "image/png", grande),
                FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana))
                .isInstanceOfSatisfying(CamposInvalidosException.class,
                        ex -> assertThat(ex.getCampos()).containsEntry("archivo", "El archivo supera el tamaño máximo permitido de 5 MB"));
    }

    @Test
    void siLaTransaccionSeRevierteElContenidoEscritoSeBorra() {
        Archivo archivo = service.guardar(new MockMultipartFile("archivo", "a.png", "image/png", PNG),
                FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana);

        terminarTransaccion(TransactionSynchronization.STATUS_ROLLED_BACK);

        verify(almacenamiento).eliminar(archivo.getRuta());
    }

    @Test
    void siLaTransaccionConfirmaElContenidoSeQueda() {
        service.guardar(new MockMultipartFile("archivo", "a.png", "image/png", PNG),
                FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana);

        terminarTransaccion(TransactionSynchronization.STATUS_COMMITTED);

        verify(almacenamiento, never()).eliminar(anyString());
    }

    // ── Eliminar ───────────────────────────────────────────────────────────

    @Test
    void elContenidoSoloSeBorraCuandoElRegistroSeBorroDeVerdad() {
        Archivo archivo = Archivo.builder().ruta("2026/09/x.png").build();

        service.eliminar(archivo);
        verify(archivoRepository).delete(archivo);
        terminarTransaccion(TransactionSynchronization.STATUS_ROLLED_BACK);
        verify(almacenamiento, never()).eliminar(anyString());

        TransactionSynchronizationManager.clear();
        TransactionSynchronizationManager.initSynchronization();
        service.eliminar(archivo);
        terminarTransaccion(TransactionSynchronization.STATUS_COMMITTED);
        verify(almacenamiento).eliminar("2026/09/x.png");
    }

    // ── Descargar ──────────────────────────────────────────────────────────

    private Archivo registrado(VisibilidadArchivo visibilidad) {
        Archivo archivo = Archivo.builder().uuid(UUID.randomUUID().toString()).nombreOriginal("poster.pdf")
                .tipoContenido("application/pdf").tamanoBytes(9).sha256("abc").ruta("2026/09/p.pdf")
                .visibilidad(visibilidad).propietario(ana).build();
        when(archivoRepository.findByUuid(archivo.getUuid())).thenReturn(Optional.of(archivo));
        lenient().when(almacenamiento.abrir("2026/09/p.pdf")).thenReturn(new ByteArrayResource(PDF));
        return archivo;
    }

    private static Authentication sesion(String correo, String rol) {
        return UsernamePasswordAuthenticationToken.authenticated(correo, null, AuthorityUtils.createAuthorityList(rol));
    }

    @Test
    void unArchivoPublicoLoDescargaCualquieraSinSesion() {
        Archivo archivo = registrado(VisibilidadArchivo.publico);

        ContenidoArchivo contenido = service.abrir(UUID.fromString(archivo.getUuid()), null);

        assertThat(contenido.publico()).isTrue();
        assertThat(contenido.tipoContenido()).isEqualTo("application/pdf");
    }

    @Test
    void unArchivoPrivadoSoloLoVenElPropietarioYLaGestion() {
        UUID id = UUID.fromString(registrado(VisibilidadArchivo.privado).getUuid());

        assertThat(service.abrir(id, sesion("ANA@unisimon.edu.co", "ROLE_ESTUDIANTE")).publico()).isFalse();
        assertThat(service.abrir(id, sesion("carla@unisimon.edu.co", "ROLE_MACONDOLAB"))).isNotNull();
        assertThat(service.abrir(id, sesion("luis@unisimon.edu.co", "ROLE_ADMIN"))).isNotNull();

        assertThatThrownBy(() -> service.abrir(id, sesion("eva@unisimon.edu.co", "ROLE_ESTUDIANTE")))
                .isInstanceOf(NoSuchElementException.class);
        assertThatThrownBy(() -> service.abrir(id, sesion("marta@empresa.com", "ROLE_JURADO")))
                .isInstanceOf(NoSuchElementException.class);
        assertThatThrownBy(() -> service.abrir(id, null)).isInstanceOf(NoSuchElementException.class);
        assertThatThrownBy(() -> service.abrir(id, new AnonymousAuthenticationToken("clave", "anonymousUser",
                AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")))).isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void unIdentificadorQueNoExisteEs404() {
        assertThatThrownBy(() -> service.abrir(UUID.randomUUID(), null)).isInstanceOf(NoSuchElementException.class);
    }

    // ── Nombres ────────────────────────────────────────────────────────────

    @Test
    void elNombreOriginalSeSaneaYLlevaLaExtensionReal() {
        assertThat(ArchivoService.nombreSeguro("../../etc/passwd.png", FormatoArchivo.PNG)).isEqualTo("passwd.png");
        assertThat(ArchivoService.nombreSeguro("foto.exe", FormatoArchivo.JPEG)).isEqualTo("foto.jpg");
        assertThat(ArchivoService.nombreSeguro(".htaccess", FormatoArchivo.PNG)).isEqualTo("archivo.png");
        assertThat(ArchivoService.nombreSeguro(null, FormatoArchivo.PDF)).isEqualTo("archivo.pdf");
        assertThat(ArchivoService.nombreSeguro("mal\"nombre\r\n.pdf", FormatoArchivo.PDF)).isEqualTo("malnombre.pdf");
        assertThat(ArchivoService.nombreSeguro("x".repeat(300) + ".pdf", FormatoArchivo.PDF)).hasSize(204);
    }

    @Test
    void guardaElNombreSaneadoEnLosMetadatos() {
        service.guardar(new MockMultipartFile("archivo", "../foto.png", "image/png", PNG),
                FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, ana);

        ArgumentCaptor<Archivo> guardado = ArgumentCaptor.forClass(Archivo.class);
        verify(archivoRepository).save(guardado.capture());
        assertThat(guardado.getValue().getNombreOriginal()).isEqualTo("foto.png");
    }
}
