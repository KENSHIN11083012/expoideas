package co.edu.unisimon.expoideas.service;

import co.edu.unisimon.expoideas.archivos.FormatoArchivo;
import co.edu.unisimon.expoideas.dto.CambiarPasswordDTO;
import co.edu.unisimon.expoideas.dto.UsuarioAdminCreateDTO;
import co.edu.unisimon.expoideas.dto.UsuarioAdminUpdateDTO;
import co.edu.unisimon.expoideas.dto.UsuarioRegistroDTO;
import co.edu.unisimon.expoideas.dto.UsuarioResponseDTO;
import co.edu.unisimon.expoideas.dto.UsuarioUpdateDTO;
import co.edu.unisimon.expoideas.dto.Validaciones;
import co.edu.unisimon.expoideas.entity.Archivo;
import co.edu.unisimon.expoideas.entity.Facultad;
import co.edu.unisimon.expoideas.entity.ProgramaAcademico;
import co.edu.unisimon.expoideas.entity.RolUsuario;
import co.edu.unisimon.expoideas.entity.Sede;
import co.edu.unisimon.expoideas.entity.Usuario;
import co.edu.unisimon.expoideas.entity.VisibilidadArchivo;
import co.edu.unisimon.expoideas.exception.AccionNoPermitidaException;
import co.edu.unisimon.expoideas.exception.CamposInvalidosException;
import co.edu.unisimon.expoideas.exception.ConflictException;
import co.edu.unisimon.expoideas.repository.FacultadRepository;
import co.edu.unisimon.expoideas.repository.ProgramaAcademicoRepository;
import co.edu.unisimon.expoideas.repository.SedeRepository;
import co.edu.unisimon.expoideas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Logica de negocio de Usuario: alta, consulta, actualizacion y contrasenas.
 *
 * <p>Los metodos publicos devuelven DTOs ya armados dentro de la transaccion:
 * con open-in-view desactivado, fuera de aqui no se pueden recorrer relaciones
 * lazy de las entidades.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SedeRepository sedeRepository;
    private final FacultadRepository facultadRepository;
    private final ProgramaAcademicoRepository programaAcademicoRepository;
    private final PasswordEncoder passwordEncoder;
    private final ArchivoService archivoService;

    // ---------------------------------------------
    // POST - Registro
    // ---------------------------------------------

    /**
     * Registra un usuario nuevo. Siempre nace con rol {@code estudiante}:
     * el rol no se acepta desde el cliente.
     *
     * @throws ConflictException si el correo ya esta en uso
     */
    @Transactional
    public UsuarioResponseDTO registrarUsuario(UsuarioRegistroDTO dto) {
        if (usuarioRepository.existsByCorreoInstitucional(dto.correoInstitucional())) {
            throw new ConflictException("El correo institucional ya está registrado.");
        }

        Usuario nuevoUsuario = Usuario.builder()
                .nombres(dto.nombres())
                .apellidos(dto.apellidos())
                .correoInstitucional(dto.correoInstitucional())
                .password(passwordEncoder.encode(dto.password()))
                .rol(RolUsuario.estudiante)
                // El DTO exige autorizaDatos == true: aqui solo se deja constancia.
                .autorizaDatos(true)
                .fechaAutorizacionDatos(LocalDateTime.now())
                .build();
        nuevoUsuario.setSede(buscarSede(dto.sedeId()));
        asignarFacultadYPrograma(nuevoUsuario, dto.facultadId(), dto.programaAcademicoId());

        Usuario guardado = usuarioRepository.save(nuevoUsuario);
        log.info("Usuario registrado con ID {}", guardado.getId());
        return toResponseDTO(guardado);
    }

    // ---------------------------------------------
    // GET - Consultas
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarUsuarios() {
        return usuarioRepository.findAllWithBaseInfo().stream()
                .map(this::toResponseDTO)
                .toList();
    }

    /**
     * Datos del usuario autenticado, con sede y programa ya resueltos.
     *
     * @throws NoSuchElementException si el correo no existe
     */
    @Transactional(readOnly = true)
    public UsuarioResponseDTO obtenerPerfilPropio(String correo) {
        return toResponseDTO(buscarPorCorreo(correo));
    }

    // ---------------------------------------------
    // PUT - Actualizacion
    // ---------------------------------------------

    /**
     * Reemplaza los datos que el propio usuario puede cambiar: nombre y, si su
     * rol la lleva, adscripcion academica (gestion y jurados no la tienen y se
     * ignora). Se identifica por el correo de la sesion, nunca por un ID que
     * venga del cliente.
     *
     * @throws CamposInvalidosException si el rol requiere adscripcion y faltan sede o facultad
     * @throws NoSuchElementException   si el correo, la sede, la facultad o el programa no existen
     * @throws IllegalArgumentException si el programa no es de la facultad
     */
    @Transactional
    public UsuarioResponseDTO actualizarPerfilPropio(String correo, UsuarioUpdateDTO dto) {
        Usuario usuario = buscarPorCorreo(correo);

        if (usuario.getRol().requiereAdscripcion()) {
            Map<String, String> faltantes = faltantesDeAdscripcion(dto.sedeId(), dto.facultadId());
            if (!faltantes.isEmpty())
                throw new CamposInvalidosException(faltantes);
            usuario.setSede(buscarSede(dto.sedeId()));
            asignarFacultadYPrograma(usuario, dto.facultadId(), dto.programaAcademicoId());
        }
        usuario.setNombres(dto.nombres().trim());
        usuario.setApellidos(dto.apellidos().trim());

        return toResponseDTO(usuarioRepository.save(usuario));
    }

    // ---------------------------------------------
    // Gestion de cuentas (MacondoLab y administradores)
    // ---------------------------------------------

    /**
     * Alta de una cuenta desde la gestion: jurados externos o cuentas que nacen
     * con un rol distinto de estudiante. El consentimiento de datos queda sin
     * registrar porque no lo dio la persona.
     *
     * @throws AccionNoPermitidaException si el rol de quien crea no puede gestionar el rol pedido
     * @throws CamposInvalidosException   si el correo no es institucional (salvo jurados) o falta la adscripcion
     * @throws ConflictException          si el correo ya esta en uso
     * @throws NoSuchElementException     si la sede, la facultad o el programa no existen
     * @throws IllegalArgumentException   si el programa no es de la facultad
     */
    @Transactional
    public UsuarioResponseDTO crearDesdeGestion(String correoActor, UsuarioAdminCreateDTO dto) {
        Usuario actor = buscarPorCorreo(correoActor);
        if (!actor.getRol().puedeGestionar(dto.rol())) {
            throw new AccionNoPermitidaException("Solo un administrador puede crear cuentas de administración o de MacondoLab.");
        }

        String correo = dto.correoInstitucional().trim();
        Map<String, String> campos = new LinkedHashMap<>();
        if (dto.rol() != RolUsuario.jurado && !correo.matches(Validaciones.CORREO_INSTITUCIONAL_REGEX)) {
            campos.put("correoInstitucional", "Solo los jurados pueden tener un correo externo; usa uno @unisimon.edu.co");
        }
        if (dto.rol().requiereAdscripcion()) {
            campos.putAll(faltantesDeAdscripcion(dto.sedeId(), dto.facultadId()));
        }
        if (!campos.isEmpty()) {
            throw new CamposInvalidosException(campos);
        }
        if (usuarioRepository.existsByCorreoInstitucional(correo)) {
            throw new ConflictException("El correo " + correo + " ya pertenece a otro usuario.");
        }

        Usuario nuevo = Usuario.builder()
                .nombres(dto.nombres().trim())
                .apellidos(dto.apellidos().trim())
                .correoInstitucional(correo)
                .password(passwordEncoder.encode(dto.password()))
                .rol(dto.rol())
                .autorizaDatos(false)
                // La contraseña la pone quien crea la cuenta: se cambia en el primer ingreso.
                .debeCambiarPassword(true)
                .build();
        if (dto.rol().requiereAdscripcion()) {
            nuevo.setSede(buscarSede(dto.sedeId()));
            asignarFacultadYPrograma(nuevo, dto.facultadId(), dto.programaAcademicoId());
        }

        Usuario guardado = usuarioRepository.save(nuevo);
        log.info("Usuario ID {} creado desde la gestion con rol {}", guardado.getId(), guardado.getRol());
        return toResponseDTO(guardado);
    }

    /**
     * Actualizacion desde la gestion: anade rol y adscripcion academica sobre lo
     * que puede cambiar el propio usuario.
     *
     * @throws AccionNoPermitidaException si el actor no puede gestionar al usuario o el rol pedido, o cambia su propio rol
     * @throws NoSuchElementException     si el usuario, la sede, la facultad o el programa no existen
     * @throws IllegalArgumentException   si el programa no es de la facultad o el rol no lleva adscripcion
     * @throws ConflictException          si el correo nuevo ya es de otro usuario
     */
    @Transactional
    public UsuarioResponseDTO actualizarDesdeAdmin(String correoActor, Integer id, UsuarioAdminUpdateDTO dto) {
        Usuario actor = buscarPorCorreo(correoActor);
        Usuario usuario = buscarPorId(id);
        verificarPuedeGestionar(actor, usuario);
        if (dto.rol() != null && dto.rol() != usuario.getRol()) {
            if (actor.getId().equals(usuario.getId())) {
                throw new AccionNoPermitidaException("No puedes cambiar tu propio rol.");
            }
            if (!actor.getRol().puedeGestionar(dto.rol())) {
                throw new AccionNoPermitidaException("Solo un administrador puede asignar los roles Administrador o MacondoLab.");
            }
        }
        validarCorreoDisponible(usuario, dto.correoInstitucional());

        if (dto.nombres() != null)
            usuario.setNombres(dto.nombres());
        if (dto.apellidos() != null)
            usuario.setApellidos(dto.apellidos());
        if (dto.numeroIdentificacion() != null)
            usuario.setNumeroIdentificacion(dto.numeroIdentificacion());
        if (dto.correoInstitucional() != null)
            usuario.setCorreoInstitucional(dto.correoInstitucional());
        if (dto.password() != null && !dto.password().isBlank())
            usuario.setPassword(passwordEncoder.encode(dto.password()));
        if (dto.rol() != null)
            usuario.setRol(dto.rol());

        boolean traeAdscripcion = dto.sedeId() != null || dto.facultadId() != null || dto.programaAcademicoId() != null;
        if (traeAdscripcion && !usuario.getRol().requiereAdscripcion()) {
            throw new IllegalArgumentException("El rol de este usuario no lleva adscripción académica.");
        }
        if (dto.sedeId() != null) {
            usuario.setSede(buscarSede(dto.sedeId()));
        }
        // Con facultad, la adscripcion se reemplaza completa (programa null = sin
        // programa). Solo con programa, la facultad sale de ese programa.
        if (dto.facultadId() != null) {
            asignarFacultadYPrograma(usuario, dto.facultadId(), dto.programaAcademicoId());
        } else if (dto.programaAcademicoId() != null) {
            ProgramaAcademico programa = buscarPrograma(dto.programaAcademicoId());
            usuario.setProgramaAcademico(programa);
            usuario.setFacultad(programa.getFacultad());
        }

        log.info("Usuario ID {} actualizado desde la gestion", id);
        return toResponseDTO(usuarioRepository.save(usuario));
    }

    // ---------------------------------------------
    // PASSWORD
    // ---------------------------------------------

    /**
     * Cambio de contrasena del usuario autenticado, verificando la actual.
     *
     * @throws IllegalArgumentException si la actual no coincide o la nueva no es valida
     */
    @Transactional
    public void cambiarPasswordPropio(String correo, CambiarPasswordDTO dto) {
        validarYActualizarPassword(buscarPorCorreo(correo), dto, true);
    }

    // ---------------------------------------------
    // Foto de perfil
    // ---------------------------------------------

    /**
     * Sube o reemplaza la foto de perfil. La foto anterior se borra cuando la
     * nueva queda guardada.
     *
     * @throws co.edu.unisimon.expoideas.exception.CamposInvalidosException si no es JPG, PNG o WEBP, esta vacia o pasa de 5 MB
     */
    @Transactional
    public UsuarioResponseDTO actualizarFotoPropia(String correo, MultipartFile contenido) {
        Usuario usuario = buscarPorCorreo(correo);
        Archivo anterior = usuario.getFoto();

        usuario.setFoto(archivoService.guardar(contenido, FormatoArchivo.IMAGENES, VisibilidadArchivo.publico, usuario));
        usuarioRepository.save(usuario);
        if (anterior != null) {
            archivoService.eliminar(anterior);
        }
        return toResponseDTO(usuario);
    }

    /** Quita la foto de perfil, si tiene. */
    @Transactional
    public void eliminarFotoPropia(String correo) {
        Usuario usuario = buscarPorCorreo(correo);
        Archivo foto = usuario.getFoto();
        if (foto != null) {
            usuario.setFoto(null);
            usuarioRepository.save(usuario);
            archivoService.eliminar(foto);
        }
    }

    /**
     * Autorizacion de tratamiento de datos dada por el propio usuario. Si ya la
     * habia dado, conserva la fecha original.
     *
     * @throws NoSuchElementException si el correo no existe
     */
    @Transactional
    public void autorizarDatosPropio(String correo) {
        Usuario usuario = buscarPorCorreo(correo);
        if (!Boolean.TRUE.equals(usuario.getAutorizaDatos())) {
            usuario.setAutorizaDatos(true);
            usuario.setFechaAutorizacionDatos(LocalDateTime.now());
            usuarioRepository.save(usuario);
            log.info("Usuario ID {} autorizo el tratamiento de datos", usuario.getId());
        }
    }

    /**
     * Restablecimiento desde la gestion, sin conocer la contrasena actual. La
     * contrasena queda como temporal: se cambia en el siguiente ingreso.
     *
     * @throws AccionNoPermitidaException si el actor no puede gestionar al usuario o es su propia cuenta
     * @throws NoSuchElementException     si el correo no existe
     */
    @Transactional
    public void restablecerPasswordAdmin(String correoActor, String correo, CambiarPasswordDTO dto) {
        Usuario actor = buscarPorCorreo(correoActor);
        Usuario usuario = buscarPorCorreo(correo);
        if (actor.getId().equals(usuario.getId())) {
            // Por aqui no se pide la contrasena actual: la propia se cambia en /me/password.
            throw new AccionNoPermitidaException("Para cambiar tu propia contraseña usa la opción Seguridad de tu cuenta.");
        }
        verificarPuedeGestionar(actor, usuario);
        validarYActualizarPassword(usuario, dto, false);
        log.info("Contrasena del usuario ID {} restablecida desde la gestion", usuario.getId());
    }

    private void validarYActualizarPassword(Usuario usuario, CambiarPasswordDTO dto, boolean requiereActual) {
        if (requiereActual) {
            if (dto.passwordActual() == null || dto.passwordActual().isBlank()) {
                throw new IllegalArgumentException("Debes proporcionar la contraseña actual.");
            }
            if (!passwordEncoder.matches(dto.passwordActual(), usuario.getPassword())) {
                throw new IllegalArgumentException("La contraseña actual es incorrecta.");
            }
        }
        if (!dto.passwordNueva().equals(dto.confirmacionPassword())) {
            throw new IllegalArgumentException("La nueva contraseña y su confirmación no coinciden.");
        }
        if (passwordEncoder.matches(dto.passwordNueva(), usuario.getPassword())) {
            throw new IllegalArgumentException("La nueva contraseña no puede ser igual a la actual.");
        }

        usuario.setPassword(passwordEncoder.encode(dto.passwordNueva()));
        // La que pone la gestion es temporal; la que elige la propia persona, no.
        usuario.setDebeCambiarPassword(!requiereActual);
        usuarioRepository.save(usuario);
    }

    // ---------------------------------------------
    // DELETE
    // ---------------------------------------------

    /**
     * Solo administradores (lo exige SecurityConfig).
     *
     * @throws AccionNoPermitidaException si es la propia cuenta
     * @throws NoSuchElementException     si el ID no existe
     */
    @Transactional
    public void eliminarUsuario(String correoActor, Integer id) {
        Usuario actor = buscarPorCorreo(correoActor);
        Usuario usuario = buscarPorId(id);
        if (actor.getId().equals(usuario.getId())) {
            throw new AccionNoPermitidaException("No puedes eliminar tu propia cuenta.");
        }
        // Sus archivos no pueden quedar sin dueno: se borran con la cuenta.
        usuario.setFoto(null);
        archivoService.eliminarDePropietario(usuario);
        usuarioRepository.delete(usuario);
        log.info("Usuario ID {} eliminado", id);
    }

    // ---------------------------------------------
    // Helpers
    // ---------------------------------------------

    private Usuario buscarPorId(Integer id) {
        return usuarioRepository.findByIdWithBaseInfo(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con ID: " + id));
    }

    private Usuario buscarPorCorreo(String correo) {
        return usuarioRepository.findByCorreoWithBaseInfo(correo)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con correo: " + correo));
    }

    // Los ids se resuelven contra la base en vez de crear entidades sueltas: asi
    // un id inexistente falla aqui (404) y no como violacion de FK al hacer flush.

    private Sede buscarSede(Integer sedeId) {
        return sedeRepository.findById(sedeId)
                .orElseThrow(() -> new NoSuchElementException("No existe una sede con ID: " + sedeId));
    }

    private Facultad buscarFacultad(Integer facultadId) {
        return facultadRepository.findById(facultadId)
                .orElseThrow(() -> new NoSuchElementException("No existe una facultad con ID: " + facultadId));
    }

    private ProgramaAcademico buscarPrograma(Integer programaId) {
        return programaAcademicoRepository.findById(programaId)
                .orElseThrow(() -> new NoSuchElementException("No existe un programa academico con ID: " + programaId));
    }

    /** Mismos mensajes que las anotaciones del registro, para que el cliente los trate igual. */
    private static Map<String, String> faltantesDeAdscripcion(Integer sedeId, Integer facultadId) {
        Map<String, String> campos = new LinkedHashMap<>();
        if (sedeId == null)
            campos.put("sedeId", "La sede es obligatoria");
        if (facultadId == null)
            campos.put("facultadId", "La facultad es obligatoria");
        return campos;
    }

    private static void verificarPuedeGestionar(Usuario actor, Usuario objetivo) {
        if (!actor.getRol().puedeGestionar(objetivo.getRol())) {
            throw new AccionNoPermitidaException("Solo un administrador puede modificar cuentas de administración o de MacondoLab.");
        }
    }

    /**
     * Facultad obligatoria y programa opcional (null = sin programa). Si hay
     * programa, debe pertenecer a esa facultad.
     *
     * @throws IllegalArgumentException si el programa es de otra facultad
     */
    private void asignarFacultadYPrograma(Usuario usuario, Integer facultadId, Integer programaId) {
        Facultad facultad = buscarFacultad(facultadId);
        ProgramaAcademico programa = programaId == null ? null : buscarPrograma(programaId);

        if (programa != null && !programa.getFacultad().getId().equals(facultad.getId())) {
            throw new IllegalArgumentException("El programa académico no pertenece a la facultad seleccionada.");
        }
        usuario.setFacultad(facultad);
        usuario.setProgramaAcademico(programa);
    }

    private void validarCorreoDisponible(Usuario usuario, String correoNuevo) {
        if (correoNuevo != null
                && !correoNuevo.equalsIgnoreCase(usuario.getCorreoInstitucional())
                && usuarioRepository.existsByCorreoInstitucional(correoNuevo)) {
            throw new ConflictException("El correo " + correoNuevo + " ya pertenece a otro usuario.");
        }
    }

    private UsuarioResponseDTO toResponseDTO(Usuario usuario) {
        Sede sede = usuario.getSede();
        Facultad facultad = usuario.getFacultad();
        ProgramaAcademico programa = usuario.getProgramaAcademico();
        return UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .nombres(usuario.getNombres())
                .apellidos(usuario.getApellidos())
                .correoInstitucional(usuario.getCorreoInstitucional())
                .numeroIdentificacion(usuario.getNumeroIdentificacion())
                .fotoId(usuario.getFoto() != null ? usuario.getFoto().getUuid() : null)
                .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                .fechaCreacion(usuario.getFechaCreacion())
                .sedeId(sede != null ? sede.getId() : null)
                .sede(sede != null ? sede.getNombre() : null)
                .facultadId(facultad != null ? facultad.getId() : null)
                .facultad(facultad != null ? facultad.getNombre() : null)
                .programaAcademicoId(programa != null ? programa.getId() : null)
                .programaAcademico(programa != null ? programa.getNombre() : null)
                .pendientes(usuario.pendientesDeIngreso())
                .build();
    }
}
