package com.dattapro.dattapro_api.service;

import com.dattapro.dattapro_api.dto.ConvocatoriaRequestDTO;
import com.dattapro.dattapro_api.dto.ConvocatoriaResponseDTO;
import com.dattapro.dattapro_api.entity.*;
import com.dattapro.dattapro_api.repository.CategoriaRepository;
import com.dattapro.dattapro_api.repository.ConvocatoriaRelacionesRepository;
import com.dattapro.dattapro_api.repository.ConvocatoriaRepository;
import com.dattapro.dattapro_api.repository.EntidadRepository;
import com.dattapro.dattapro_api.repository.UsuarioRepository;
import com.dattapro.dattapro_api.repository.KeywordRepository;
import com.dattapro.dattapro_api.repository.ConvocatoriaLineaInvestigacionRepository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConvocatoriaService {

    private final ConvocatoriaRepository convocatoriaRepository;
    private final CategoriaRepository categoriaRepository;
    private final EntidadRepository entidadRepository;
    private final ConvocatoriaRelacionesRepository relacionesRepository;
    private final UsuarioRepository usuarioRepository;
    private final KeywordRepository keywordRepository;
    private final ConvocatoriaLineaInvestigacionRepository convocatoriaLineaInvestigacionRepository;
    private final EntityManager entityManager;

    // ==============================
    // CRUD de Convocatorias
    // ==============================

    /**
     * Obtiene todas las convocatorias con sus datos base y relaciones.
     */
    @Transactional(readOnly = true)
    public List<ConvocatoriaResponseDTO> listarTodas() {
        return convocatoriaRepository.findAllWithBaseInfo().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una convocatoria por su ID.
     */
    @Transactional(readOnly = true)
    public ConvocatoriaResponseDTO obtenerPorId(Integer id) {
        Convocatoria convocatoria = convocatoriaRepository.findByIdWithBaseInfo(id)
                .orElseThrow(() -> new RuntimeException("Convocatoria no encontrada con ID: " + id));
        return mapToResponse(convocatoria);
    }

    /**
     * Filtra convocatorias por categoría.
     */
    @Transactional(readOnly = true)
    public List<ConvocatoriaResponseDTO> listarPorCategoria(Integer categoriaId) {
        return convocatoriaRepository.findByCategoriaId(categoriaId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filtra convocatorias por usuario creador.
     */
    @Transactional(readOnly = true)
    public List<ConvocatoriaResponseDTO> listarPorUsuario(Integer usuarioId) {
        return convocatoriaRepository.findByUsuarioId(usuarioId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filtra convocatorias por correo del usuario creador.
     */
    @Transactional(readOnly = true)
    public List<ConvocatoriaResponseDTO> listarPorCorreo(String correo) {
        Usuario usuario = usuarioRepository.findByCorreoInstitucional(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con correo: " + correo));
        return listarPorUsuario(usuario.getId());
    }

    /**
     * Crea una nueva convocatoria con todas sus relaciones.
     */
    @Transactional
    public ConvocatoriaResponseDTO crear(ConvocatoriaRequestDTO dto) {
        log.info("Creando nueva convocatoria: {}", dto.getTitulo());

        Convocatoria convocatoria = new Convocatoria();
        aplicarDatos(convocatoria, dto);
        Convocatoria saved = convocatoriaRepository.save(convocatoria);
        Integer cid = saved.getId();

        guardarRelaciones(cid, dto);

        log.info("Convocatoria creada con ID: {}", cid);
        return obtenerPorId(cid);
    }

    /**
     * Actualiza una convocatoria existente y reemplaza todas sus relaciones.
     */
    @Transactional
    public ConvocatoriaResponseDTO actualizar(Integer id, ConvocatoriaRequestDTO dto) {
        log.info("Actualizando convocatoria ID: {}", id);

        Convocatoria convocatoria = convocatoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Convocatoria no encontrada con ID: " + id));

        aplicarDatos(convocatoria, dto);
        convocatoriaRepository.save(convocatoria);

        // Eliminar y reinsertar relaciones
        eliminarTodasLasRelaciones(id);
        guardarRelaciones(id, dto);

        log.info("Convocatoria actualizada con ID: {}", id);
        return obtenerPorId(id);
    }

    /**
     * Elimina una convocatoria y todas sus relaciones (CASCADE).
     */
    @Transactional
    public void eliminar(Integer id) {
        log.info("Eliminando convocatoria ID: {}", id);
        if (!convocatoriaRepository.existsById(id)) {
            throw new RuntimeException("Convocatoria no encontrada con ID: " + id);
        }
        convocatoriaRepository.deleteById(id);
        log.info("Convocatoria eliminada con ID: {}", id);
    }

    // ==============================
    // CRUD de Categorías y Entidades
    // ==============================

    @Transactional(readOnly = true)
    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll();
    }

    @Transactional
    public Categoria crearCategoria(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    @Transactional(readOnly = true)
    public List<Entidad> listarEntidades() {
        return entidadRepository.findAll();
    }

    @Transactional
    public Entidad crearEntidad(Entidad entidad) {
        return entidadRepository.save(entidad);
    }

    // ==============================
    // Keywords y Líneas
    // ==============================

    @Transactional(readOnly = true)
    public List<Keyword> listarKeywords() {
        return keywordRepository.findAll();
    }

    @Transactional
    public Keyword guardarKeyword(Keyword keyword) {
        if (keyword == null || keyword.getNombre() == null || keyword.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la keyword no puede estar vacío");
        }
        String trimmedName = keyword.getNombre().trim();
        String normalizedName = trimmedName.substring(0, 1).toUpperCase() + trimmedName.substring(1).toLowerCase();
        
        return keywordRepository.findByNombreIgnoreCase(normalizedName)
                .orElseGet(() -> {
                    Keyword newKw = new Keyword();
                    newKw.setNombre(normalizedName);
                    return keywordRepository.save(newKw);
                });
    }

    @Transactional(readOnly = true)
    public List<String> listarLineasInvestigacion() {
        return convocatoriaLineaInvestigacionRepository.findUniqueLineas();
    }

    @Transactional
    public void agregarKeyword(Integer cid, String keywordName) {
        Convocatoria convocatoria = convocatoriaRepository.findById(cid)
                .orElseThrow(() -> new RuntimeException("Convocatoria no encontrada con ID: " + cid));
        
        if (keywordName != null && !keywordName.trim().isEmpty()) {
            String trimmedName = keywordName.trim();
            String normalizedName = trimmedName.substring(0, 1).toUpperCase() + trimmedName.substring(1).toLowerCase();
            Keyword kwEntity = keywordRepository.findByNombreIgnoreCase(normalizedName)
                    .orElseGet(() -> {
                        Keyword newKw = new Keyword();
                        newKw.setNombre(normalizedName);
                        return keywordRepository.save(newKw);
                    });
                    
            ConvocatoriaKeyword keywordEntity = new ConvocatoriaKeyword();
            keywordEntity.setKeyword(kwEntity);
            keywordEntity.setConvocatoria(convocatoria);
            convocatoria.getKeywords().add(keywordEntity);
            convocatoriaRepository.save(convocatoria);
        }
    }

    @Transactional
    public void agregarLinea(Integer cid, String linea) {
        Convocatoria convocatoria = convocatoriaRepository.findById(cid)
                .orElseThrow(() -> new RuntimeException("Convocatoria no encontrada con ID: " + cid));
        
        ConvocatoriaLineaInvestigacion lineaEntity = new ConvocatoriaLineaInvestigacion();
        lineaEntity.setLinea(linea);
        lineaEntity.setConvocatoria(convocatoria);
        convocatoriaLineaInvestigacionRepository.save(lineaEntity);
    }

    // ==============================
    // Métodos privados auxiliares
    // ==============================

    /**
     * Mapea los campos del DTO a la entidad Convocatoria.
     */
    private void aplicarDatos(Convocatoria convocatoria, ConvocatoriaRequestDTO dto) {
        convocatoria.setTitulo(dto.getTitulo());
        convocatoria.setSubtipo(dto.getSubtipo());
        convocatoria.setDescripcion(dto.getDescripcion());
        convocatoria.setCriteriosParticipacion(dto.getCriteriosParticipacion());
        convocatoria.setProcesoEvaluacion(dto.getProcesoEvaluacion());
        convocatoria.setResultadosEsperados(dto.getResultadosEsperados());
        convocatoria.setFinanciacion(dto.getFinanciacion());
        convocatoria.setFechaInicio(dto.getFechaInicio());
        convocatoria.setFechaLimite(dto.getFechaLimite());
        convocatoria.setImagenFondo(dto.getImagenFondo());
        convocatoria.setEnlace(dto.getEnlace());
        convocatoria.setContactoNombre(dto.getContactoNombre());
        convocatoria.setContactoCorreo(dto.getContactoCorreo());
        convocatoria.setContactoDependencia(dto.getContactoDependencia());

        if (dto.getCategoriaId() != null) {
            convocatoria.setCategoria(entityManager.getReference(Categoria.class, dto.getCategoriaId()));
        }
        if (dto.getEntidadId() != null) {
            convocatoria.setEntidad(entityManager.getReference(Entidad.class, dto.getEntidadId()));
        } else {
            convocatoria.setEntidad(null);
        }

        if (dto.getUsuarioId() != null) {
            convocatoria.setUsuario(entityManager.getReference(Usuario.class, dto.getUsuarioId()));
        }

        if (dto.getVisible() != null) {
            convocatoria.setVisible(dto.getVisible());
        }

        if (dto.getEstado() != null) {
            try {
                convocatoria.setEstado(EstadoConvocatoria.valueOf(dto.getEstado()));
            } catch (IllegalArgumentException e) {
                log.warn("Estado inválido recibido: {}. Usando default Abierta", dto.getEstado());
                convocatoria.setEstado(EstadoConvocatoria.Abierta);
            }
        }

        // Manejo de Keywords (Cascade + orphanRemoval)
        if (dto.getKeywords() != null) {
            convocatoria.getKeywords().clear();
            dto.getKeywords().forEach(kwName -> {
                if (kwName != null && !kwName.trim().isEmpty()) {
                    String trimmedName = kwName.trim();
                    String normalizedName = trimmedName.substring(0, 1).toUpperCase() + trimmedName.substring(1).toLowerCase();
                    Keyword kwEntity = keywordRepository.findByNombreIgnoreCase(normalizedName)
                            .orElseGet(() -> {
                                Keyword newKw = new Keyword();
                                newKw.setNombre(normalizedName);
                                return keywordRepository.save(newKw);
                            });

                    ConvocatoriaKeyword keywordEntity = new ConvocatoriaKeyword();
                    keywordEntity.setKeyword(kwEntity);
                    keywordEntity.setConvocatoria(convocatoria);
                    convocatoria.getKeywords().add(keywordEntity);
                }
            });
        }

        // Manejo de Líneas de Investigación (Cascade + orphanRemoval)
        if (dto.getLineasInvestigacion() != null) {
            convocatoria.getLineasInvestigacion().clear();
            dto.getLineasInvestigacion().forEach(li -> {
                ConvocatoriaLineaInvestigacion lineaEntity = new ConvocatoriaLineaInvestigacion();
                lineaEntity.setLinea(li);
                lineaEntity.setConvocatoria(convocatoria);
                convocatoria.getLineasInvestigacion().add(lineaEntity);
            });
        }
    }

    /**
     * Inserta todas las relaciones de la convocatoria en las tablas puente.
     */
    private void guardarRelaciones(Integer cid, ConvocatoriaRequestDTO dto) {
        if (dto.getAreasIds() != null) {
            dto.getAreasIds().forEach(areaId -> relacionesRepository.insertConvocatoriaArea(cid, areaId));
        }
        if (dto.getAreasEspecialidadIds() != null) {
            dto.getAreasEspecialidadIds().forEach(areaId -> relacionesRepository.insertConvocatoriaAreaEspecialidad(cid, areaId));
        }
        if (dto.getCompetenciasTecnicasIds() != null) {
            dto.getCompetenciasTecnicasIds().forEach(compId -> relacionesRepository.insertConvocatoriaCompetenciaTecnica(cid, compId));
        }
        if (dto.getCompetenciasTransversalesIds() != null) {
            dto.getCompetenciasTransversalesIds().forEach(compId -> relacionesRepository.insertConvocatoriaCompetenciaTransversal(cid, compId));
        }
        if (dto.getSectoresIds() != null) {
            dto.getSectoresIds().forEach(sectorId -> relacionesRepository.insertConvocatoriaSector(cid, sectorId));
        }
        if (dto.getServiciosIds() != null) {
            dto.getServiciosIds().forEach(servicioId -> relacionesRepository.insertConvocatoriaServicio(cid, servicioId));
        }
        if (dto.getTiposProyectoIds() != null) {
            dto.getTiposProyectoIds().forEach(tipoId -> relacionesRepository.insertConvocatoriaTipoProyecto(cid, tipoId));
        }
    }

    /**
     * Elimina todas las relaciones de una convocatoria en las tablas puente.
     */
    private void eliminarTodasLasRelaciones(Integer cid) {
        relacionesRepository.deleteConvocatoriaAreas(cid);
        relacionesRepository.deleteConvocatoriaAreasEspecialidad(cid);
        relacionesRepository.deleteConvocatoriaCompetenciasTecnicas(cid);
        relacionesRepository.deleteConvocatoriaCompetenciasTransversales(cid);
        relacionesRepository.deleteConvocatoriaSectores(cid);
        relacionesRepository.deleteConvocatoriaServicios(cid);
        relacionesRepository.deleteConvocatoriaTiposProyecto(cid);
    }

    /**
     * Mapea una entidad Convocatoria a su DTO de respuesta.
     */
    private ConvocatoriaResponseDTO mapToResponse(Convocatoria c) {
        ConvocatoriaResponseDTO dto = new ConvocatoriaResponseDTO();

        dto.setId(c.getId());
        dto.setTitulo(c.getTitulo());
        dto.setSubtipo(c.getSubtipo());
        dto.setDescripcion(c.getDescripcion());
        dto.setCriteriosParticipacion(c.getCriteriosParticipacion());
        dto.setProcesoEvaluacion(c.getProcesoEvaluacion());
        dto.setResultadosEsperados(c.getResultadosEsperados());
        dto.setFinanciacion(c.getFinanciacion());
        dto.setFechaInicio(c.getFechaInicio());
        dto.setFechaLimite(c.getFechaLimite());
        dto.setImagenFondo(c.getImagenFondo());
        dto.setEnlace(c.getEnlace());
        dto.setContactoNombre(c.getContactoNombre());
        dto.setContactoCorreo(c.getContactoCorreo());
        dto.setContactoDependencia(c.getContactoDependencia());

        // Categoría
        if (c.getCategoria() != null) {
            dto.setCategoriaId(c.getCategoria().getId());
            dto.setCategoria(c.getCategoria().getNombre());
        }

        // Entidad
        if (c.getEntidad() != null) {
            dto.setEntidadId(c.getEntidad().getId());
            dto.setEntidad(c.getEntidad().getNombre());
            dto.setLogoEntidad(c.getEntidad().getLogo());
        }

        // Usuario
        if (c.getUsuario() != null) {
            dto.setUsuarioId(c.getUsuario().getId());
        }

        dto.setVisible(c.getVisible());
        dto.setEstado(c.getEstado() != null ? c.getEstado().name() : null);

        // Relaciones - Nombres
        dto.setAreas(c.getAreas() != null
                ? c.getAreas().stream()
                    .filter(a -> a.getArea() != null)
                    .map(a -> a.getArea().getNombre())
                    .collect(Collectors.toList())
                : List.of());

        dto.setAreasEspecialidad(c.getAreasEspecialidad() != null
                ? c.getAreasEspecialidad().stream()
                    .filter(a -> a.getArea() != null)
                    .map(a -> a.getArea().getNombre())
                    .collect(Collectors.toList())
                : List.of());

        dto.setCompetenciasTecnicas(c.getCompetenciasTecnicas() != null
                ? c.getCompetenciasTecnicas().stream()
                    .filter(ct -> ct.getCompetencia() != null)
                    .map(ct -> ct.getCompetencia().getNombre())
                    .collect(Collectors.toList())
                : List.of());

        dto.setCompetenciasTransversales(c.getCompetenciasTransversales() != null
                ? c.getCompetenciasTransversales().stream()
                    .filter(ct -> ct.getCompetencia() != null)
                    .map(ct -> ct.getCompetencia().getNombre())
                    .collect(Collectors.toList())
                : List.of());

        dto.setSectores(c.getSectores() != null
                ? c.getSectores().stream()
                    .filter(s -> s.getSector() != null)
                    .map(s -> s.getSector().getNombre())
                    .collect(Collectors.toList())
                : List.of());

        dto.setServicios(c.getServicios() != null
                ? c.getServicios().stream()
                    .filter(s -> s.getServicio() != null)
                    .map(s -> s.getServicio().getNombre())
                    .collect(Collectors.toList())
                : List.of());

        dto.setTiposProyecto(c.getTiposProyecto() != null
                ? c.getTiposProyecto().stream()
                    .filter(tp -> tp.getTipoProyecto() != null)
                    .map(tp -> tp.getTipoProyecto().getNombre())
                    .collect(Collectors.toList())
                : List.of());

        // Nuevas relaciones
        dto.setKeywords(c.getKeywords() != null
                ? c.getKeywords().stream()
                    .filter(ck -> ck.getKeyword() != null)
                    .map(ck -> ck.getKeyword().getNombre())
                    .collect(Collectors.toList())
                : List.of());

        dto.setLineasInvestigacion(c.getLineasInvestigacion() != null
                ? c.getLineasInvestigacion().stream()
                    .map(ConvocatoriaLineaInvestigacion::getLinea)
                    .collect(Collectors.toList())
                : List.of());

        // Relaciones - IDs (para formularios de edición)
        dto.setAreasIds(c.getAreas() != null
                ? c.getAreas().stream()
                    .filter(a -> a.getArea() != null)
                    .map(a -> a.getArea().getId())
                    .collect(Collectors.toList())
                : List.of());

        dto.setAreasEspecialidadIds(c.getAreasEspecialidad() != null
                ? c.getAreasEspecialidad().stream()
                    .filter(a -> a.getArea() != null)
                    .map(a -> a.getArea().getId())
                    .collect(Collectors.toList())
                : List.of());

        dto.setCompetenciasTecnicasIds(c.getCompetenciasTecnicas() != null
                ? c.getCompetenciasTecnicas().stream()
                    .filter(ct -> ct.getCompetencia() != null)
                    .map(ct -> ct.getCompetencia().getId())
                    .collect(Collectors.toList())
                : List.of());

        dto.setCompetenciasTransversalesIds(c.getCompetenciasTransversales() != null
                ? c.getCompetenciasTransversales().stream()
                    .filter(ct -> ct.getCompetencia() != null)
                    .map(ct -> ct.getCompetencia().getId())
                    .collect(Collectors.toList())
                : List.of());

        dto.setSectoresIds(c.getSectores() != null
                ? c.getSectores().stream()
                    .filter(s -> s.getSector() != null)
                    .map(s -> s.getSector().getId())
                    .collect(Collectors.toList())
                : List.of());

        dto.setServiciosIds(c.getServicios() != null
                ? c.getServicios().stream()
                    .filter(s -> s.getServicio() != null)
                    .map(s -> s.getServicio().getId())
                    .collect(Collectors.toList())
                : List.of());

        dto.setTiposProyectoIds(c.getTiposProyecto() != null
                ? c.getTiposProyecto().stream()
                    .filter(tp -> tp.getTipoProyecto() != null)
                    .map(tp -> tp.getTipoProyecto().getId())
                    .collect(Collectors.toList())
                : List.of());

        return dto;
    }
}
