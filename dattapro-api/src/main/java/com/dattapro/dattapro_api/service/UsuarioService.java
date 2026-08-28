package com.dattapro.dattapro_api.service;

import com.dattapro.dattapro_api.dto.CambiarPasswordDTO;
import com.dattapro.dattapro_api.dto.UsuarioAdminUpdateDTO;
import com.dattapro.dattapro_api.dto.UsuarioRegistroDTO;
import com.dattapro.dattapro_api.dto.UsuarioUpdateDTO;
import com.dattapro.dattapro_api.dto.UsuarioResponseDTO;
import com.dattapro.dattapro_api.entity.Usuario;
import com.dattapro.dattapro_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

/**
 * Servicio de lógica de negocio para la entidad Usuario.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registra un nuevo usuario en el sistema a partir del DTO del formulario
     * inicial.
     * Valida que el correo institucional no esté duplicado antes de persistir.
     *
     * @throws IllegalArgumentException si el correo institucional ya está en uso
     */
    @Transactional
    public Usuario registrarUsuario(UsuarioRegistroDTO dto) {
        log.info("Intentando registrar usuario con correo: {}", dto.correoInstitucional());

        if (usuarioRepository.existsByCorreoInstitucional(dto.correoInstitucional())) {
            log.warn("El correo ya está registrado: {}", dto.correoInstitucional());
            throw new IllegalArgumentException(
                    "El correo institucional '" + dto.correoInstitucional() + "' ya está registrado.");
        }

        // TODO: Implementar BCrypt para encriptar la contraseña antes de guardar
        // TipoDocumento tipoDocumento = new TipoDocumento();
        // tipoDocumento.setId(dto.tipoDocumentoId());

        Usuario nuevoUsuario = Usuario.builder()
                .nombres(dto.nombres())
                .apellidos(dto.apellidos())
                .correoInstitucional(dto.correoInstitucional())
                .password(passwordEncoder.encode(dto.password()))
                .autorizaDatos(dto.autorizaDatos() != null ? dto.autorizaDatos() : false)
                .deseaVincularse(true) // Siempre True por defecto según requerimiento
                .build();

        Usuario guardado = usuarioRepository.save(nuevoUsuario);
        log.info("Usuario registrado con ID: {}", guardado.getId());
        return guardado;
    }

    // ─────────────────────────────────────────────
    // GET – Consultas
    // ─────────────────────────────────────────────

    /**
     * Devuelve todos los usuarios registrados.
     */
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarUsuarios() {
        log.info("Listando todos los usuarios");
        return usuarioRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Busca un usuario por su ID.
     *
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional(readOnly = true)
    public UsuarioResponseDTO obtenerUsuarioPorId(Integer id) {
        log.info("Buscando usuario con ID: {}", id);
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con ID: " + id));
        return toResponseDTO(usuario);
    }

    /**
     * Busca un usuario por su correo institucional.
     */
    @Transactional(readOnly = true)
    public Usuario obtenerUsuarioPorCorreo(String correo) {
        log.info("Buscando usuario con correo: {}", correo);
        return usuarioRepository.findByCorreoInstitucional(correo)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con correo: " + correo));
    }

    // ─────────────────────────────────────────────
    // PUT – Actualización
    // ─────────────────────────────────────────────

    /**
     * Actualiza los campos básicos de un usuario existente.
     * Solo modifica los campos presentes en {@link UsuarioUpdateDTO}.
     *
     * @throws NoSuchElementException   si el ID no existe
     * @throws IllegalArgumentException si el nuevo correo ya pertenece a otro
     *                                  usuario
     */
    @Transactional
    public Usuario actualizarUsuario(Integer id, UsuarioUpdateDTO dto) {
        log.info("Actualizando usuario con ID: {}", id);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con ID: " + id));

        // Validar correo único solo si está cambiando
        if (dto.correoInstitucional() != null
                && !dto.correoInstitucional().equalsIgnoreCase(usuario.getCorreoInstitucional())
                && usuarioRepository.existsByCorreoInstitucional(dto.correoInstitucional())) {
            throw new IllegalArgumentException(
                    "El correo '" + dto.correoInstitucional() + "' ya pertenece a otro usuario.");
        }

        if (dto.nombres() != null)
            usuario.setNombres(dto.nombres());
        if (dto.apellidos() != null)
            usuario.setApellidos(dto.apellidos());
        if (dto.correoInstitucional() != null)
            usuario.setCorreoInstitucional(dto.correoInstitucional());
        if (dto.password() != null && !dto.password().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.password()));
        }

        Usuario actualizado = usuarioRepository.save(usuario);
        log.info("Usuario ID {} actualizado exitosamente", id);
        return actualizado;
    }

    /**
     * Actualiza todos los campos de un usuario por parte de un administrador.
     * Incluye la actualización del rol y otros campos de perfil extendidos.
     *
     * @throws NoSuchElementException   si el ID no existe
     * @throws IllegalArgumentException si el nuevo correo pertenece a otro usuario
     */
    @Transactional
    public Usuario actualizarDesdeAdmin(Integer id, UsuarioAdminUpdateDTO dto) {
        log.info("Actualizando usuario desde admin con ID: {}", id);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con ID: " + id));

        // Validar correo único solo si está cambiando
        if (dto.correoInstitucional() != null
                && !dto.correoInstitucional().equalsIgnoreCase(usuario.getCorreoInstitucional())
                && usuarioRepository.existsByCorreoInstitucional(dto.correoInstitucional())) {
            throw new IllegalArgumentException(
                    "El correo '" + dto.correoInstitucional() + "' ya pertenece a otro usuario.");
        }

        if (dto.nombres() != null)
            usuario.setNombres(dto.nombres());
        if (dto.apellidos() != null)
            usuario.setApellidos(dto.apellidos());
        if (dto.numeroIdentificacion() != null)
            usuario.setNumeroIdentificacion(dto.numeroIdentificacion());
        if (dto.correoInstitucional() != null)
            usuario.setCorreoInstitucional(dto.correoInstitucional());
        if (dto.perfilProfesional() != null) usuario.setPerfilProfesional(dto.perfilProfesional());
        if (dto.descripcionProyectos() != null) usuario.setDescripcionProyectos(dto.descripcionProyectos());
        if (dto.aniosProf() != null) usuario.setAniosProf(dto.aniosProf());
        if (dto.colaborativos() != null) usuario.setColaborativos(dto.colaborativos());
        if (dto.liderar() != null) usuario.setLiderar(dto.liderar());
        if (dto.password() != null && !dto.password().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.password()));
        }
        if (dto.rol() != null)
            usuario.setRol(dto.rol());
        if (dto.estadoFormulario() != null)
            usuario.setEstadoFormulario(dto.estadoFormulario());

        // Referencias a otras entidades (si se evían)
        if (dto.tipoDocumentoId() != null) {
            com.dattapro.dattapro_api.entity.TipoDocumento td = new com.dattapro.dattapro_api.entity.TipoDocumento();
            td.setId(dto.tipoDocumentoId());
            usuario.setTipoDocumento(td);
        }
        if (dto.tipoVinculacionId() != null) {
            com.dattapro.dattapro_api.entity.TipoVinculacion tv = new com.dattapro.dattapro_api.entity.TipoVinculacion();
            tv.setId(dto.tipoVinculacionId());
            usuario.setTipoVinculacion(tv);
        }
        if (dto.sedeId() != null) {
            com.dattapro.dattapro_api.entity.Sede sede = new com.dattapro.dattapro_api.entity.Sede();
            sede.setId(dto.sedeId());
            usuario.setSede(sede);
        }
        if (dto.centroInvestigativoId() != null) {
            com.dattapro.dattapro_api.entity.CentroInvestigativo ci = new com.dattapro.dattapro_api.entity.CentroInvestigativo();
            ci.setId(dto.centroInvestigativoId());
            usuario.setCentroInvestigativo(ci);
        }
        if (dto.programaAcademicoId() != null) {
            com.dattapro.dattapro_api.entity.ProgramaAcademico pa = new com.dattapro.dattapro_api.entity.ProgramaAcademico();
            pa.setId(dto.programaAcademicoId());
            usuario.setProgramaAcademico(pa);
        }

        Usuario actualizado = usuarioRepository.save(usuario);
        log.info("Usuario ID {} actualizado exitosamente desde admin", id);
        return actualizado;
    }

    // ─────────────────────────────────────────────
    // PASSWORD – Gestión de contraseña
    // ─────────────────────────────────────────────

    /**
     * Devuelve información básica sobre el estado de la contraseña del usuario
     * (sin exponer el hash). Útil para saber si el usuario tiene contraseña
     * establecida y cuándo fue creado.
     *
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerInfoPassword(Integer id) {
        log.info("Consultando info de contraseña del usuario ID: {}", id);
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con ID: " + id));
        return Map.of(
                "idUsuario", usuario.getId(),
                "correoInstitucional", usuario.getCorreoInstitucional(),
                "tienePassword", usuario.getPassword() != null && !usuario.getPassword().isBlank(),
                "fechaCreacion", usuario.getFechaCreacion() != null ? usuario.getFechaCreacion().toString() : "");
    }

    /**
     * Permite al propio usuario autenticado cambiar su contraseña.
     * Obtiene el correo del SecurityContextHolder.
     *
     * @throws NoSuchElementException   si el usuario no existe en la DB
     * @throws IllegalArgumentException si la contraseña actual no coincide, las
     *                                  contraseñas nuevas no coinciden o la nueva
     *                                  es igual a la actual
     */
    @Transactional
    public void cambiarPasswordMe(CambiarPasswordDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = auth.getName();
        log.info("Usuario {} solicitando cambio de contraseña personal", correo);

        Usuario usuario = usuarioRepository.findByCorreoInstitucional(correo)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con correo: " + correo));

        validarYActualizarPassword(usuario, dto, true);
    }

    /**
     * Permite al propio usuario cambiar su contraseña verificando primero la
     * contraseña actual.
     *
     * @throws NoSuchElementException   si el ID no existe
     * @throws IllegalArgumentException si la contraseña actual no coincide, las
     *                                  contraseñas nuevas no coinciden o la nueva
     *                                  es igual a la actual
     */
    @Transactional
    public void cambiarPasswordUsuario(Integer id, CambiarPasswordDTO dto) {
        log.info("Usuario ID {} solicitando cambio de contraseña", id);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con ID: " + id));

        validarYActualizarPassword(usuario, dto, true);
    }

    /**
     * Lógica interna para validar y actualizar la contraseña.
     */
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
            throw new IllegalArgumentException("La nueva contraseña no puede ser igual a la contraseña actual.");
        }

        usuario.setPassword(passwordEncoder.encode(dto.passwordNueva()));
        usuarioRepository.save(usuario);
    }

    /**
     * Permite a un administrador restablecer la contraseña de un usuario sin
     * necesidad de conocer la contraseña actual, buscando por correo.
     *
     * @throws NoSuchElementException   si el correo no existe
     * @throws IllegalArgumentException si las contraseñas nuevas no coinciden
     */
    @Transactional
    public void restablecerPasswordAdmin(String correo, CambiarPasswordDTO dto) {
        log.info("Admin restableciendo contraseña del usuario: {}", correo);

        Usuario usuario = usuarioRepository.findByCorreoInstitucional(correo)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con correo: " + correo));

        validarYActualizarPassword(usuario, dto, false);
        log.info("Contraseña restablecida por admin para el usuario {}", correo);
    }

    /**
     * Permite a un administrador restablecer la contraseña de un usuario por ID.
     */
    @Transactional
    public void restablecerPasswordAdminById(Integer id, CambiarPasswordDTO dto) {
        log.info("Admin restableciendo contraseña del usuario ID: {}", id);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con ID: " + id));

        validarYActualizarPassword(usuario, dto, false);
    }

    // ─────────────────────────────────────────────
    // DELETE – Eliminación
    // ─────────────────────────────────────────────

    /**
     * Elimina un usuario por su ID.
     *
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional
    public void eliminarUsuario(Integer id) {
        log.info("Eliminando usuario con ID: {}", id);
        if (!usuarioRepository.existsById(id)) {
            throw new NoSuchElementException("No existe un usuario con ID: " + id);
        }
        usuarioRepository.deleteById(id);
        log.info("Usuario ID {} eliminado", id);
    }

    public UsuarioResponseDTO toResponseDTO(Usuario usuario) {
        if (usuario == null) return null;
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.setId(usuario.getId());
        dto.setNombres(usuario.getNombres());
        dto.setApellidos(usuario.getApellidos());
        dto.setFoto(usuario.getFoto());
        dto.setNumeroIdentificacion(usuario.getNumeroIdentificacion());
        dto.setCorreoInstitucional(usuario.getCorreoInstitucional());
        dto.setDeseaVincularse(usuario.getDeseaVincularse());
        dto.setAutorizaDatos(usuario.getAutorizaDatos());
        dto.setEstadoFormulario(usuario.getEstadoFormulario() != null ? usuario.getEstadoFormulario().name() : null);
        dto.setCvlac(usuario.getCvlac());
        dto.setLinkedin(usuario.getLinkedin());
        dto.setGoogleScholar(usuario.getGoogleScholar());
        dto.setOtraRed(usuario.getOtraRed());
        dto.setObjetivo(usuario.getObjetivo());
        dto.setExperienciaServicios(usuario.getExperienciaServicios());
        dto.setPerfilProfesional(usuario.getPerfilProfesional());
        dto.setDescripcionProyectos(usuario.getDescripcionProyectos());
        dto.setAniosProf(usuario.getAniosProf());
        dto.setColaborativos(usuario.getColaborativos());
        dto.setLiderar(usuario.getLiderar());
        dto.setPassword(usuario.getPassword());
        dto.setRol(usuario.getRol() != null ? usuario.getRol().name() : null);
        dto.setPorcentajeCompletitud(usuario.getPorcentajeCompletitud());
        dto.setFechaCreacion(usuario.getFechaCreacion());

        // Mapear programa académico
        if (usuario.getProgramaAcademico() != null) {
            dto.setProgramaAcademico(usuario.getProgramaAcademico().getNombre());
            if (usuario.getProgramaAcademico().getFacultad() != null) {
                dto.setFacultad(usuario.getProgramaAcademico().getFacultad().getNombre());
            }
        }

        // Mapear sectores de experiencia
        if (usuario.getSectoresExperiencia() != null) {
            dto.setSectoresExperiencia(usuario.getSectoresExperiencia().stream().map(se -> {
                UsuarioResponseDTO.SectorDTO sDto = new UsuarioResponseDTO.SectorDTO();
                sDto.setNombre(se.getSector() != null ? se.getSector().getNombre() : null);
                return sDto;
            }).collect(java.util.stream.Collectors.toList()));
        }

        // Mapear competencias técnicas
        if (usuario.getCompetenciasTecnicas() != null) {
            dto.setCompetenciasTecnicas(usuario.getCompetenciasTecnicas().stream().map(ct -> {
                UsuarioResponseDTO.CompetenciaDTO cDto = new UsuarioResponseDTO.CompetenciaDTO();
                cDto.setNombre(ct.getCompetencia() != null ? ct.getCompetencia().getNombre() : null);
                cDto.setNivel(ct.getNivel());
                return cDto;
            }).collect(java.util.stream.Collectors.toList()));
        }

        // Mapear competencias transversales
        if (usuario.getCompetenciasTransversales() != null) {
            dto.setCompetenciasTransversales(usuario.getCompetenciasTransversales().stream().map(ct -> {
                UsuarioResponseDTO.CompetenciaDTO cDto = new UsuarioResponseDTO.CompetenciaDTO();
                cDto.setNombre(ct.getCompetencia() != null ? ct.getCompetencia().getNombre() : null);
                cDto.setNivel(ct.getNivel());
                return cDto;
            }).collect(java.util.stream.Collectors.toList()));
        }

        // Mapear idiomas
        if (usuario.getIdiomas() != null) {
            dto.setIdiomas(usuario.getIdiomas().stream().map(i -> {
                UsuarioResponseDTO.IdiomaDTO iDto = new UsuarioResponseDTO.IdiomaDTO();
                iDto.setIdioma(i.getIdioma() != null ? i.getIdioma().getNombre() : null);
                iDto.setNivel(i.getNivelIdioma() != null ? i.getNivelIdioma().getNombre() : null);
                return iDto;
            }).collect(java.util.stream.Collectors.toList()));
        }

        return dto;
    }
}
