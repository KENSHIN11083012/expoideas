package co.edu.unisimon.expoideas.service;

import co.edu.unisimon.expoideas.archivos.AlmacenamientoArchivos;
import co.edu.unisimon.expoideas.archivos.ContenidoArchivo;
import co.edu.unisimon.expoideas.archivos.FormatoArchivo;
import co.edu.unisimon.expoideas.entity.Archivo;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.entity.VisibilidadArchivo;
import co.edu.unisimon.expoideas.exception.CamposInvalidosException;
import co.edu.unisimon.expoideas.repository.ArchivoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import java.util.function.IntConsumer;

/**
 * Guarda, sirve y borra archivos. Los módulos (foto de perfil, entregables,
 * galería) lo usan desde sus propias transacciones y deciden qué formatos y qué
 * visibilidad corresponden.
 *
 * <p>Disco y BD no comparten transacción: si la transacción se revierte, el
 * contenido recién escrito se borra; si un borrado confirma, recién ahí se
 * borra el contenido. Así no quedan registros apuntando a nada.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArchivoService {

    /** Límite de TI. spring.servlet.multipart.max-file-size lo aplica antes; esta es la segunda barrera. */
    static final int TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

    private final ArchivoRepository archivoRepository;
    private final AlmacenamientoArchivos almacenamiento;

    /**
     * Valida y guarda un archivo subido.
     *
     * @throws CamposInvalidosException si está vacío, pasa de 5 MB o su contenido no es de un formato permitido
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Archivo guardar(MultipartFile subido, Set<FormatoArchivo> permitidos, VisibilidadArchivo visibilidad,
            Usuario propietario) {
        byte[] contenido = leer(subido);
        if (contenido.length == 0) {
            throw invalido("El archivo está vacío.");
        }
        if (contenido.length > TAMANO_MAXIMO_BYTES) {
            throw invalido("El archivo supera el tamaño máximo permitido de 5 MB");
        }
        FormatoArchivo formato = FormatoArchivo.detectar(contenido)
                .filter(permitidos::contains)
                .orElseThrow(() -> invalido("Formato no permitido. Usa un archivo " + FormatoArchivo.describir(permitidos) + "."));

        String uuid = UUID.randomUUID().toString();
        LocalDate hoy = LocalDate.now();
        String ruta = "%d/%02d/%s.%s".formatted(hoy.getYear(), hoy.getMonthValue(), uuid, formato.extension());

        almacenamiento.guardar(ruta, contenido);
        alTerminarLaTransaccion(estado -> {
            if (estado != TransactionSynchronization.STATUS_COMMITTED) {
                almacenamiento.eliminar(ruta);
            }
        });

        Archivo archivo = archivoRepository.save(Archivo.builder()
                .uuid(uuid)
                .nombreOriginal(nombreSeguro(subido.getOriginalFilename(), formato))
                .tipoContenido(formato.tipoContenido())
                .tamanoBytes(contenido.length)
                .sha256(sha256(contenido))
                .ruta(ruta)
                .visibilidad(visibilidad)
                .propietario(propietario)
                .build());
        log.info("Archivo {} ({}, {} bytes) subido por el usuario ID {}",
                uuid, formato.tipoContenido(), contenido.length, propietario.getId());
        return archivo;
    }

    /** Borra el registro ya y el contenido cuando la transacción confirma. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void eliminar(Archivo archivo) {
        String ruta = archivo.getRuta();
        archivoRepository.delete(archivo);
        alTerminarLaTransaccion(estado -> {
            if (estado == TransactionSynchronization.STATUS_COMMITTED) {
                almacenamiento.eliminar(ruta);
            }
        });
    }

    /** Para eliminar una cuenta: sus archivos no pueden quedar sin dueño. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void eliminarDePropietario(Usuario propietario) {
        archivoRepository.findByPropietario(propietario).forEach(this::eliminar);
    }

    /**
     * Contenido para descargar. Los públicos los ve cualquiera; los privados, el
     * propietario y la gestión. A quien no puede verlo se le responde como si no
     * existiera, para no revelar qué identificadores son válidos.
     *
     * @throws NoSuchElementException si no existe o no tiene permiso
     */
    @Transactional(readOnly = true)
    public ContenidoArchivo abrir(UUID id, Authentication autenticacion) {
        Archivo archivo = archivoRepository.findByUuid(id.toString()).orElseThrow(ArchivoService::noExiste);
        boolean publico = archivo.getVisibilidad() == VisibilidadArchivo.publico;
        if (!publico && !puedeVerPrivado(archivo, autenticacion)) {
            throw noExiste();
        }
        return new ContenidoArchivo(archivo.getNombreOriginal(), archivo.getTipoContenido(), archivo.getTamanoBytes(),
                archivo.getSha256(), publico, almacenamiento.abrir(archivo.getRuta()));
    }

    private static boolean puedeVerPrivado(Archivo archivo, Authentication autenticacion) {
        if (autenticacion == null || autenticacion instanceof AnonymousAuthenticationToken) {
            return false;
        }
        if (archivo.getPropietario().getCorreoInstitucional().equalsIgnoreCase(autenticacion.getName())) {
            return true;
        }
        return autenticacion.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(rol -> rol.equals("ROLE_ADMIN") || rol.equals("ROLE_MACONDOLAB"));
    }

    /** Sin carpetas ni caracteres de control, y con la extensión del formato real. */
    static String nombreSeguro(String original, FormatoArchivo formato) {
        String nombre = original == null ? "" : original.replace('\\', '/');
        nombre = nombre.substring(nombre.lastIndexOf('/') + 1)
                .replaceAll("[\\p{Cntrl}\"]", "")
                .strip();
        int punto = nombre.lastIndexOf('.');
        if (punto > 0) {
            nombre = nombre.substring(0, punto);
        }
        if (nombre.isBlank() || nombre.startsWith(".")) {
            nombre = "archivo";
        }
        if (nombre.length() > 200) {
            nombre = nombre.substring(0, 200);
        }
        return nombre + "." + formato.extension();
    }

    private static byte[] leer(MultipartFile subido) {
        try {
            return subido.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo subido", e);
        }
    }

    private static String sha256(byte[] contenido) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(contenido));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    private static void alTerminarLaTransaccion(IntConsumer accion) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int estado) {
                accion.accept(estado);
            }
        });
    }

    private static CamposInvalidosException invalido(String mensaje) {
        return new CamposInvalidosException(Map.of("archivo", mensaje));
    }

    private static NoSuchElementException noExiste() {
        return new NoSuchElementException("El archivo no existe");
    }
}
