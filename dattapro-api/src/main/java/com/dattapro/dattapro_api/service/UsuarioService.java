package com.dattapro.dattapro_api.service;

import com.dattapro.dattapro_api.dto.CambiarPasswordDTO;
import com.dattapro.dattapro_api.dto.UsuarioAdminUpdateDTO;
import com.dattapro.dattapro_api.dto.UsuarioRegistroDTO;
import com.dattapro.dattapro_api.dto.UsuarioResponseDTO;
import com.dattapro.dattapro_api.dto.UsuarioUpdateDTO;
import com.dattapro.dattapro_api.entity.ProgramaAcademico;
import com.dattapro.dattapro_api.entity.RolUsuario;
import com.dattapro.dattapro_api.entity.Sede;
import com.dattapro.dattapro_api.entity.Usuario;
import com.dattapro.dattapro_api.repository.ProgramaAcademicoRepository;
import com.dattapro.dattapro_api.repository.SedeRepository;
import com.dattapro.dattapro_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Logica de negocio de Usuario: alta, consulta, actualizacion y contrasenas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SedeRepository sedeRepository;
    private final ProgramaAcademicoRepository programaAcademicoRepository;
    private final PasswordEncoder passwordEncoder;

    // ---------------------------------------------
    // POST - Registro
    // ---------------------------------------------

    /**
     * Registra un usuario nuevo. Siempre nace con rol {@code emprendedor}:
     * el rol no se acepta desde el cliente.
     *
     * @throws IllegalArgumentException si el correo ya esta en uso
     */
    @Transactional
    public Usuario registrarUsuario(UsuarioRegistroDTO dto) {
        if (usuarioRepository.existsByCorreoInstitucional(dto.correoInstitucional())) {
            throw new IllegalArgumentException(
                    "El correo institucional " + dto.correoInstitucional() + " ya esta registrado.");
        }

        Usuario nuevoUsuario = Usuario.builder()
                .nombres(dto.nombres())
                .apellidos(dto.apellidos())
                .correoInstitucional(dto.correoInstitucional())
                .password(passwordEncoder.encode(dto.password()))
                .rol(RolUsuario.emprendedor)
                .build();

        Usuario guardado = usuarioRepository.save(nuevoUsuario);
        log.info("Usuario registrado con ID {}", guardado.getId());
        return guardado;
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
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional(readOnly = true)
    public UsuarioResponseDTO obtenerUsuarioPorId(Integer id) {
        return toResponseDTO(buscarPorId(id));
    }

    /**
     * @throws NoSuchElementException si el correo no existe
     */
    @Transactional(readOnly = true)
    public Usuario obtenerUsuarioPorCorreo(String correo) {
        return usuarioRepository.findByCorreoInstitucional(correo)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con correo: " + correo));
    }

    // ---------------------------------------------
    // PUT - Actualizacion
    // ---------------------------------------------

    /**
     * Actualiza los datos que el propio usuario puede cambiar.
     *
     * @throws NoSuchElementException   si el ID no existe
     * @throws IllegalArgumentException si el correo nuevo ya es de otro usuario
     */
    @Transactional
    public Usuario actualizarUsuario(Integer id, UsuarioUpdateDTO dto) {
        Usuario usuario = buscarPorId(id);
        validarCorreoDisponible(usuario, dto.correoInstitucional());

        if (dto.nombres() != null)
            usuario.setNombres(dto.nombres());
        if (dto.apellidos() != null)
            usuario.setApellidos(dto.apellidos());
        if (dto.correoInstitucional() != null)
            usuario.setCorreoInstitucional(dto.correoInstitucional());
        if (dto.password() != null && !dto.password().isBlank())
            usuario.setPassword(passwordEncoder.encode(dto.password()));

        return usuarioRepository.save(usuario);
    }

    /**
     * Actualizacion por parte de un administrador: anade rol y adscripcion
     * academica sobre lo que puede cambiar el propio usuario.
     *
     * @throws NoSuchElementException   si el usuario, la sede o el programa no existen
     * @throws IllegalArgumentException si el correo nuevo ya es de otro usuario
     */
    @Transactional
    public Usuario actualizarDesdeAdmin(Integer id, UsuarioAdminUpdateDTO dto) {
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

        // Se resuelven contra la base en vez de crear entidades sueltas con el id:
        // asi un id inexistente falla aqui y no como violacion de FK al hacer flush.
        if (dto.sedeId() != null) {
            Sede sede = sedeRepository.findById(dto.sedeId())
                    .orElseThrow(() -> new NoSuchElementException("No existe una sede con ID: " + dto.sedeId()));
            usuario.setSede(sede);
        }
        if (dto.programaAcademicoId() != null) {
            ProgramaAcademico programa = programaAcademicoRepository.findById(dto.programaAcademicoId())
                    .orElseThrow(() -> new NoSuchElementException(
                            "No existe un programa academico con ID: " + dto.programaAcademicoId()));
            usuario.setProgramaAcademico(programa);
        }

        log.info("Usuario ID {} actualizado por un administrador", id);
        return usuarioRepository.save(usuario);
    }

    // ---------------------------------------------
    // PASSWORD
    // ---------------------------------------------

    /**
     * Estado de la contrasena de un usuario, sin exponer el hash.
     *
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerInfoPassword(Integer id) {
        Usuario usuario = buscarPorId(id);
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("idUsuario", usuario.getId());
        info.put("correoInstitucional", usuario.getCorreoInstitucional());
        info.put("tienePassword", usuario.getPassword() != null && !usuario.getPassword().isBlank());
        info.put("fechaCreacion", usuario.getFechaCreacion() != null ? usuario.getFechaCreacion().toString() : null);
        return info;
    }

    /** Cambio de contrasena del usuario autenticado. */
    @Transactional
    public void cambiarPasswordMe(CambiarPasswordDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("No hay una sesion activa.");
        }
        Usuario usuario = obtenerUsuarioPorCorreo(auth.getName());
        validarYActualizarPassword(usuario, dto, true);
    }

    /** Cambio de contrasena verificando la actual. */
    @Transactional
    public void cambiarPasswordUsuario(Integer id, CambiarPasswordDTO dto) {
        validarYActualizarPassword(buscarPorId(id), dto, true);
    }

    /** Restablecimiento por parte de un admin, sin conocer la contrasena actual. */
    @Transactional
    public void restablecerPasswordAdmin(String correo, CambiarPasswordDTO dto) {
        validarYActualizarPassword(obtenerUsuarioPorCorreo(correo), dto, false);
        log.info("Contrasena restablecida por un administrador");
    }

    /** Restablecimiento por parte de un admin, buscando por ID. */
    @Transactional
    public void restablecerPasswordAdminById(Integer id, CambiarPasswordDTO dto) {
        validarYActualizarPassword(buscarPorId(id), dto, false);
        log.info("Contrasena restablecida por un administrador");
    }

    private void validarYActualizarPassword(Usuario usuario, CambiarPasswordDTO dto, boolean requiereActual) {
        if (requiereActual) {
            if (dto.passwordActual() == null || dto.passwordActual().isBlank()) {
                throw new IllegalArgumentException("Debes proporcionar la contrasena actual.");
            }
            if (!passwordEncoder.matches(dto.passwordActual(), usuario.getPassword())) {
                throw new IllegalArgumentException("La contrasena actual es incorrecta.");
            }
        }
        if (!dto.passwordNueva().equals(dto.confirmacionPassword())) {
            throw new IllegalArgumentException("La nueva contrasena y su confirmacion no coinciden.");
        }
        if (passwordEncoder.matches(dto.passwordNueva(), usuario.getPassword())) {
            throw new IllegalArgumentException("La nueva contrasena no puede ser igual a la actual.");
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

    private void validarCorreoDisponible(Usuario usuario, String correoNuevo) {
        if (correoNuevo != null
                && !correoNuevo.equalsIgnoreCase(usuario.getCorreoInstitucional())
                && usuarioRepository.existsByCorreoInstitucional(correoNuevo)) {
            throw new IllegalArgumentException("El correo " + correoNuevo + " ya pertenece a otro usuario.");
        }
    }

    public UsuarioResponseDTO toResponseDTO(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
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
                .sede(usuario.getSede() != null ? usuario.getSede().getNombre() : null)
                .programaAcademico(programa != null ? programa.getNombre() : null)
                .facultad(programa != null && programa.getFacultad() != null
                        ? programa.getFacultad().getNombre()
                        : null)
                .build();
    }
}
