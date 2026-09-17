package com.dattapro.dattapro_api.service;

import com.dattapro.dattapro_api.dto.CambiarPasswordDTO;
import com.dattapro.dattapro_api.dto.UsuarioAdminUpdateDTO;
import com.dattapro.dattapro_api.dto.UsuarioRegistroDTO;
import com.dattapro.dattapro_api.dto.UsuarioResponseDTO;
import com.dattapro.dattapro_api.dto.UsuarioUpdateDTO;
import com.dattapro.dattapro_api.entity.Facultad;
import com.dattapro.dattapro_api.entity.ProgramaAcademico;
import com.dattapro.dattapro_api.entity.RolUsuario;
import com.dattapro.dattapro_api.entity.Sede;
import com.dattapro.dattapro_api.entity.Usuario;
import com.dattapro.dattapro_api.exception.CamposInvalidosException;
import com.dattapro.dattapro_api.exception.ConflictException;
import com.dattapro.dattapro_api.repository.FacultadRepository;
import com.dattapro.dattapro_api.repository.ProgramaAcademicoRepository;
import com.dattapro.dattapro_api.repository.SedeRepository;
import com.dattapro.dattapro_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // ---------------------------------------------
    // POST - Registro
    // ---------------------------------------------

    /**
     * Registra un usuario nuevo. Siempre nace con rol {@code emprendedor}:
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
                .rol(RolUsuario.emprendedor)
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
     * rol la lleva, adscripcion academica (el administrador no la tiene y se
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
            exigirSedeYFacultad(dto.sedeId(), dto.facultadId());
            usuario.setSede(buscarSede(dto.sedeId()));
            asignarFacultadYPrograma(usuario, dto.facultadId(), dto.programaAcademicoId());
        }
        usuario.setNombres(dto.nombres().trim());
        usuario.setApellidos(dto.apellidos().trim());

        return toResponseDTO(usuarioRepository.save(usuario));
    }

    /**
     * Actualizacion por parte de un administrador: anade rol y adscripcion
     * academica sobre lo que puede cambiar el propio usuario.
     *
     * @throws NoSuchElementException   si el usuario, la sede, la facultad o el programa no existen
     * @throws IllegalArgumentException si el programa no es de la facultad o el rol no lleva adscripcion
     * @throws ConflictException        si el correo nuevo ya es de otro usuario
     */
    @Transactional
    public UsuarioResponseDTO actualizarDesdeAdmin(Integer id, UsuarioAdminUpdateDTO dto) {
        Usuario usuario = buscarPorId(id);
        validarCorreoDisponible(usuario, dto.correoInstitucional());

        if (dto.nombres() != null)
            usuario.setNombres(dto.nombres());
        if (dto.apellidos() != null)
            usuario.setApellidos(dto.apellidos());
        if (dto.numeroIdentificacion() != null)
            usuario.setNumeroIdentificacion(dto.numeroIdentificacion());
        if (dto.correoInstitucional() != null)
            usuario.setCorreoInstitucional(dto.correoInstitucional());
        if (dto.fotoUrl() != null)
            usuario.setFotoUrl(dto.fotoUrl());
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

        log.info("Usuario ID {} actualizado por un administrador", id);
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

    /**
     * Restablecimiento por parte de un admin, sin conocer la contrasena actual.
     *
     * @throws NoSuchElementException si el correo no existe
     */
    @Transactional
    public void restablecerPasswordAdmin(String correo, CambiarPasswordDTO dto) {
        validarYActualizarPassword(buscarPorCorreo(correo), dto, false);
        log.info("Contrasena restablecida por un administrador");
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
        usuarioRepository.save(usuario);
    }

    // ---------------------------------------------
    // DELETE
    // ---------------------------------------------

    /**
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional
    public void eliminarUsuario(Integer id) {
        if (!usuarioRepository.existsById(id)) {
            throw new NoSuchElementException("No existe un usuario con ID: " + id);
        }
        usuarioRepository.deleteById(id);
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
    private static void exigirSedeYFacultad(Integer sedeId, Integer facultadId) {
        Map<String, String> campos = new LinkedHashMap<>();
        if (sedeId == null)
            campos.put("sedeId", "La sede es obligatoria");
        if (facultadId == null)
            campos.put("facultadId", "La facultad es obligatoria");
        if (!campos.isEmpty())
            throw new CamposInvalidosException(campos);
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
                .fotoUrl(usuario.getFotoUrl())
                .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                .fechaCreacion(usuario.getFechaCreacion())
                .sedeId(sede != null ? sede.getId() : null)
                .sede(sede != null ? sede.getNombre() : null)
                .facultadId(facultad != null ? facultad.getId() : null)
                .facultad(facultad != null ? facultad.getNombre() : null)
                .programaAcademicoId(programa != null ? programa.getId() : null)
                .programaAcademico(programa != null ? programa.getNombre() : null)
                .build();
    }
}
