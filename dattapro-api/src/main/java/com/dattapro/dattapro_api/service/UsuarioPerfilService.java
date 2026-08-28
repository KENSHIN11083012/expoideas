package com.dattapro.dattapro_api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dattapro.dattapro_api.dto.UsuarioPerfilDTO;
import com.dattapro.dattapro_api.dto.UsuarioPerfilResponseDTO;
import com.dattapro.dattapro_api.entity.CentroInvestigativo;
import com.dattapro.dattapro_api.entity.EstadoFormulario;
import com.dattapro.dattapro_api.entity.ProgramaAcademico;
import com.dattapro.dattapro_api.entity.Sede;
import com.dattapro.dattapro_api.entity.TipoDocumento;
import com.dattapro.dattapro_api.entity.TipoVinculacion;
import com.dattapro.dattapro_api.entity.Usuario;
import com.dattapro.dattapro_api.entity.UsuarioInteresRed;
import com.dattapro.dattapro_api.entity.Certificacion;
import com.dattapro.dattapro_api.repository.CertificacionRepository;
import com.dattapro.dattapro_api.repository.UsuarioPerfilRelacionesRepository;
import com.dattapro.dattapro_api.repository.UsuarioRepository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioPerfilService {

    private static final java.util.Map<String, Integer> ESPECIALIDADES_MAP = java.util.Map.ofEntries(
            java.util.Map.entry("Educación", 1),
            java.util.Map.entry("Salud", 2),
            java.util.Map.entry("Industria", 3),
            java.util.Map.entry("TIC / Software", 4),
            java.util.Map.entry("Emprendimiento", 5),
            java.util.Map.entry("Finanzas / Contabilidad", 6),
            java.util.Map.entry("Derecho / Normativo", 7),
            java.util.Map.entry("Energía / Sostenibilidad", 8),
            java.util.Map.entry("Agroindustria", 9),
            java.util.Map.entry("Economía popular y comunitaria", 10),
            java.util.Map.entry("Logística y comercio", 11));

    private final UsuarioRepository usuarioRepository;
    private final UsuarioPerfilRelacionesRepository relacionesRepository;
    private final CertificacionRepository certificacionRepository;
    private final EntityManager entityManager;

    @Transactional
    public void guardarPerfil(UsuarioPerfilDTO dto) {
        log.info("Guardando perfil para usuario ID: {}", dto.getUsuarioId());

        // 1. Obtener Usuario EXISTENTE (Prioridad ID, luego Correo)
        Usuario usuario = null;

        if (dto.getUsuarioId() != null) {
            usuario = usuarioRepository.findById(dto.getUsuarioId())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + dto.getUsuarioId()));
        } else if (dto.getDatosBasicos() != null && dto.getDatosBasicos().getCorreo() != null) {
            usuario = usuarioRepository.findByCorreoInstitucional(dto.getDatosBasicos().getCorreo())
                    .orElseThrow(() -> new RuntimeException(
                            "Usuario no encontrado con correo: " + dto.getDatosBasicos().getCorreo()));
        } else {
            throw new RuntimeException("No se proporcionó ID ni correo para buscar al usuario.");
        }

        // Asegurar que el objeto que se pasa a repository.save() tenga el ID original
        if (usuario.getId() == null) {
            throw new RuntimeException("Error fatal: El usuario recuperado no tiene un ID asignado.");
        }

        // --- CALCULAR PORCENTAJE AL INICIO ---
        usuario.setPorcentajeCompletitud(calcularPorcentaje(dto));

        // 2. Mapear datos básicos y consentimiento
        UsuarioPerfilDTO.DatosBasicosDTO basicos = dto.getDatosBasicos();
        if (basicos != null) {
            usuario.setDeseaVincularse(basicos.getDeseaVincularse());
            usuario.setAutorizaDatos(basicos.getAutorizaDatos());
            usuario.setNombres(basicos.getNombre());
            usuario.setApellidos(basicos.getApellidos());
            usuario.setNumeroIdentificacion(basicos.getNumeroIdentificacion());
            usuario.setCorreoInstitucional(basicos.getCorreo());

            // --- Lógica para procesar el MEDIUMBLOB ---
            if (basicos.getFoto() != null && !basicos.getFoto().isEmpty()) {
                try {
                    // El frontend a veces envía "data:image/png;base64,iVBOR..."
                    // Necesitamos solo lo que está después de la coma
                    String base64Image = basicos.getFoto();
                    if (base64Image.contains(",")) {
                        base64Image = base64Image.split(",")[1];
                    }

                    // Convertimos el String Base64 a byte[]
                    byte[] fotoBytes = Base64.getDecoder().decode(base64Image);
                    usuario.setFoto(fotoBytes);
                } catch (Exception e) {
                    log.error("Error al decodificar la foto del usuario: {}", e.getMessage());
                }
            }
            // ------------------------------------------

            if (basicos.getTipoDocumentoId() != null)
                usuario.setTipoDocumento(entityManager.getReference(TipoDocumento.class, basicos.getTipoDocumentoId()));
            // if (basicos.getFacultadId() != null)
            // usuario.setFacultad(entityManager.getReference(Facultad.class,
            // basicos.getFacultadId()));
            if (basicos.getProgramaId() != null)
                usuario.setProgramaAcademico(
                        entityManager.getReference(ProgramaAcademico.class, basicos.getProgramaId()));
            if (basicos.getTipoVinculacionId() != null)
                usuario.setTipoVinculacion(
                        entityManager.getReference(TipoVinculacion.class, basicos.getTipoVinculacionId()));
            if (basicos.getSedeId() != null)
                usuario.setSede(entityManager.getReference(Sede.class, basicos.getSedeId()));
            if (basicos.getCentroInvestigativo() != null)
                usuario.setCentroInvestigativo(
                        entityManager.getReference(CentroInvestigativo.class, basicos.getCentroInvestigativo()));
        }

        // 3. Validar consentimiento (Ya manejado en registro, pero mantenemos lógica de estado)
        if (basicos != null && Boolean.FALSE.equals(basicos.getAutorizaDatos())) {
            usuario.setEstadoFormulario(EstadoFormulario.rechazado);
            usuarioRepository.save(usuario);
            log.info("Usuario guardado con estado RECHAZADO por falta de autorización de datos.");
            return;
        }

        // 4. Mapear Perfil
        UsuarioPerfilDTO.PerfilAcademicoDTO perfilAcademico = dto.getPerfilAcademico();
        if (perfilAcademico != null) {
            // Se quitaron nivelFormacion y tituloFormacion de Usuario.java (se guardará en
            // tabla intermedia).
        }

        UsuarioPerfilDTO.ExperienciaDTO exp = dto.getExperiencia();
        if (exp != null) {
            usuario.setAniosProf(exp.getAniosProf());
            usuario.setDescripcionProyectos(exp.getDescripcionProyectos());
            usuario.setPerfilProfesional(exp.getPerfilProfesional());
        }

        // Redes (8)
        UsuarioPerfilDTO.RedesDTO redes = dto.getRedes();
        if (redes != null) {
            usuario.setLinkedin(redes.getLinkedin());
            usuario.setCvlac(redes.getCvlac());
            usuario.setGoogleScholar(redes.getGoogleScholar());
            usuario.setOtraRed(redes.getOtraRed());
        }

        // Intereses y Objetivos
        UsuarioPerfilDTO.InteresesDTO intereses = dto.getIntereses();
        if (intereses != null) {
            usuario.setExperienciaServicios(intereses.getExperienciaServicios());
            usuario.setColaborativos(intereses.getQuiereParticipar() != null ? intereses.getQuiereParticipar() : false);
            usuario.setLiderar(intereses.getQuiereLiderar() != null ? intereses.getQuiereLiderar() : false);
            usuario.setObjetivo(intereses.getObjetivo());
        }

        // 10. Estado del formulario (simulamos que está completo)
        usuario.setEstadoFormulario(EstadoFormulario.completo);

        // 5. Guardar Usuario
        Usuario saved = usuarioRepository.save(usuario);
        Integer uid = saved.getId();

        // 6. Manejar relaciones en tablas puente (MANUALMENTE)

        // Areas
        relacionesRepository.deleteUsuarioArea(uid);
        if (perfilAcademico != null && perfilAcademico.getAreasIds() != null) {
            perfilAcademico.getAreasIds().forEach(areaId -> relacionesRepository.insertUsuarioArea(uid, areaId));
        }

        // Formacion
        relacionesRepository.deleteUsuarioFormacion(uid);
        if (perfilAcademico != null && perfilAcademico.getNivelFormacionId() != null) {
            relacionesRepository.insertUsuarioFormacion(uid, perfilAcademico.getNivelFormacionId(),
                    perfilAcademico.getTituloFormacion() != null ? perfilAcademico.getTituloFormacion() : "");
        }

        // Idiomas
        relacionesRepository.deleteUsuarioIdiomas(uid);
        if (perfilAcademico != null && perfilAcademico.getIdiomas() != null) {
            perfilAcademico.getIdiomas().forEach(
                    idioma -> relacionesRepository.insertUsuarioIdioma(uid, idioma.getIdiomaId(), idioma.getNivelId()));
        }

        // Certificaciones
        relacionesRepository.deleteUsuarioCertificaciones(uid);
        if (perfilAcademico != null && perfilAcademico.getCertificacionesNombres() != null) {
            perfilAcademico.getCertificacionesNombres().forEach(nombre -> {
                if (nombre != null && !nombre.trim().isEmpty()) {
                    Certificacion cert = certificacionRepository.findByNombre(nombre.trim())
                            .orElseGet(() -> {
                                Certificacion newCert = new Certificacion();
                                newCert.setNombre(nombre.trim());
                                return certificacionRepository.save(newCert);
                            });
                    relacionesRepository.insertUsuarioCertificacion(uid, cert.getId());
                }
            });
        }

        // Proyectos
        relacionesRepository.deleteUsuarioProyectos(uid);
        if (exp != null && exp.getTiposProyectoIds() != null) {
            exp.getTiposProyectoIds().forEach(projId -> relacionesRepository.insertUsuarioProyecto(uid, projId));
        }

        // Competencias
        UsuarioPerfilDTO.CompetenciasDTO comp = dto.getCompetencias();
        relacionesRepository.deleteUsuarioCompetenciasTecnicas(uid);
        relacionesRepository.deleteUsuarioCompetenciasTransversales(uid);
        if (comp != null) {
            if (comp.getTecnicas() != null) {
                comp.getTecnicas().forEach(c -> relacionesRepository.insertUsuarioCompetenciaTecnica(uid,
                        c.getCompetenciaId(), c.getNivel()));
            }
            if (comp.getTransversales() != null) {
                comp.getTransversales().forEach(c -> relacionesRepository.insertUsuarioCompetenciaTransversal(uid,
                        c.getCompetenciaId(), c.getNivel()));
            }
        }

        // Intereses - Servicios
        relacionesRepository.deleteUsuarioServicios(uid);
        if (intereses != null && intereses.getServiciosIds() != null) {
            intereses.getServiciosIds().forEach(s -> relacionesRepository.insertUsuarioServicio(uid, s));
        }

        // Intereses - Sectores
        relacionesRepository.deleteUsuarioSectoresExperiencia(uid);
        if (intereses != null && intereses.getSectoresIds() != null) {
            intereses.getSectoresIds().forEach(s -> relacionesRepository.insertUsuarioSectorExperiencia(uid, s));
        }

        // Intereses - Áreas de Especialidad
        relacionesRepository.deleteUsuarioAreaEspecialidad(uid);
        if (dto.getAreasEspecialidad() != null) {
            dto.getAreasEspecialidad().forEach(ae -> {
                if (ae.getNombre() != null) {
                    Integer areaId = ESPECIALIDADES_MAP.get(ae.getNombre().trim());
                    if (areaId != null) {
                        relacionesRepository.insertUsuarioAreaEspecialidad(uid, areaId);
                    } else {
                        log.warn("No se encontró ID para el área de especialidad: {}", ae.getNombre());
                    }
                }
            });
        }

        // Intereses - Redes
        relacionesRepository.deleteUsuariosInteresesRed(uid);
        if (intereses != null && intereses.getInteresesIds() != null) {
            intereses.getInteresesIds().forEach(i -> relacionesRepository.insertUsuarioInteresRed(uid, i));
        }

        log.info("Perfil guardado completamente para el usuario: {}", uid);
    }

    @Transactional(readOnly = true)
    public UsuarioPerfilResponseDTO obtenerPerfilCompleto(Integer id) {
        Usuario usuario = usuarioRepository.findByIdWithBaseInfo(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        UsuarioPerfilResponseDTO response = new UsuarioPerfilResponseDTO();
        response.setId(usuario.getId());
        response.setNombres(usuario.getNombres());
        response.setApellidos(usuario.getApellidos());
        response.setCorreoInstitucional(usuario.getCorreoInstitucional());
        response.setNumeroIdentificacion(usuario.getNumeroIdentificacion());
        // response.setFoto(usuario.getFoto());
        // Dentro de obtenerPerfilCompleto
        // --- Lógica para pasar de byte[] a String Base64 ---
        if (usuario.getFoto() != null && usuario.getFoto().length > 0) {
            String base64 = Base64.getEncoder().encodeToString(usuario.getFoto());
            // Le agregamos el prefijo para que el <img> de React lo reconozca de una
            response.setFoto("data:image/png;base64," + base64);
        } else {
            response.setFoto(null);
        }
        // -------------------------------------------------
        response.setDeseaVincularse(usuario.getDeseaVincularse());
        response.setAutorizaDatos(usuario.getAutorizaDatos());
        response.setEstadoFormulario(
                usuario.getEstadoFormulario() != null ? usuario.getEstadoFormulario().name() : null);
        response.setRol(usuario.getRol() != null ? usuario.getRol().name() : null);
        response.setFechaCreacion(usuario.getFechaCreacion());
        response.setPorcentajeCompletitud(usuario.getPorcentajeCompletitud());

        // Redes
        response.setCvlac(usuario.getCvlac());
        response.setLinkedin(usuario.getLinkedin());
        response.setGoogleScholar(usuario.getGoogleScholar());
        response.setOtraRed(usuario.getOtraRed());

        // Perfil Profesional
        response.setPerfilProfesional(usuario.getPerfilProfesional());
        response.setDescripcionProyectos(usuario.getDescripcionProyectos());
        response.setAniosProf(usuario.getAniosProf());
        response.setColaborativos(usuario.getColaborativos());
        response.setLiderar(usuario.getLiderar());
        response.setObjetivo(usuario.getObjetivo());
        response.setExperienciaServicios(usuario.getExperienciaServicios());

        // Relaciones base
        if (usuario.getTipoDocumento() != null)
            response.setTipoDocumento(usuario.getTipoDocumento().getNombre());
        if (usuario.getTipoVinculacion() != null)
            response.setTipoVinculacion(usuario.getTipoVinculacion().getNombre());
        if (usuario.getSede() != null)
            response.setSede(usuario.getSede().getNombre());
        if (usuario.getCentroInvestigativo() != null)
            response.setCentroInvestigativo(usuario.getCentroInvestigativo().getNombre());
        if (usuario.getProgramaAcademico() != null) {
            response.setProgramaAcademico(usuario.getProgramaAcademico().getNombre());
            if (usuario.getProgramaAcademico().getFacultad() != null) {
                response.setFacultad(usuario.getProgramaAcademico().getFacultad().getNombre());
            }
        }

        // Relaciones múltiples (Mapeo manual para evitar LazyInitializationException)
        response.setFormaciones(usuario.getFormaciones().stream().map(f -> {
            UsuarioPerfilResponseDTO.FormacionDTO d = new UsuarioPerfilResponseDTO.FormacionDTO();
            d.setNivel(f.getNivelFormacion() != null ? f.getNivelFormacion().getNombre() : null);
            d.setTitulo(f.getTitulo());
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setIdiomas(usuario.getIdiomas().stream().map(i -> {
            UsuarioPerfilResponseDTO.IdiomaDTO d = new UsuarioPerfilResponseDTO.IdiomaDTO();
            d.setIdioma(i.getIdioma() != null ? i.getIdioma().getNombre() : null);
            d.setNivel(i.getNivelIdioma() != null ? i.getNivelIdioma().getNombre() : null);
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setAreas(usuario.getAreas().stream().map(a -> {
            UsuarioPerfilResponseDTO.AreaDTO d = new UsuarioPerfilResponseDTO.AreaDTO();
            d.setNombre(a.getArea() != null ? a.getArea().getNombre() : null);
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setAreasEspecialidad(usuario.getAreasEspecialidad().stream().map(ae -> {
            UsuarioPerfilResponseDTO.AreaEspecialidadDTO d = new UsuarioPerfilResponseDTO.AreaEspecialidadDTO();
            d.setNombre(ae.getArea() != null ? ae.getArea().getNombre() : null);
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setCertificaciones(usuario.getCertificaciones().stream().map(c -> {
            UsuarioPerfilResponseDTO.CertificacionDTO d = new UsuarioPerfilResponseDTO.CertificacionDTO();
            d.setNombre(c.getCertificacion() != null ? c.getCertificacion().getNombre() : null);
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setCompetenciasTecnicas(usuario.getCompetenciasTecnicas().stream().map(ct -> {
            UsuarioPerfilResponseDTO.CompetenciaDTO d = new UsuarioPerfilResponseDTO.CompetenciaDTO();
            d.setNombre(ct.getCompetencia() != null ? ct.getCompetencia().getNombre() : null);
            d.setNivel(ct.getNivel());
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setCompetenciasTransversales(usuario.getCompetenciasTransversales().stream().map(ct -> {
            UsuarioPerfilResponseDTO.CompetenciaDTO d = new UsuarioPerfilResponseDTO.CompetenciaDTO();
            d.setNombre(ct.getCompetencia() != null ? ct.getCompetencia().getNombre() : null);
            d.setNivel(ct.getNivel());
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setProyectos(usuario.getProyectos().stream().map(p -> {
            UsuarioPerfilResponseDTO.ProyectoDTO d = new UsuarioPerfilResponseDTO.ProyectoDTO();
            d.setNombre(p.getProyecto() != null ? p.getProyecto().getNombre() : null);
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setSectoresExperiencia(usuario.getSectoresExperiencia().stream().map(s -> {
            UsuarioPerfilResponseDTO.SectorDTO d = new UsuarioPerfilResponseDTO.SectorDTO();
            d.setNombre(s.getSector() != null ? s.getSector().getNombre() : null);
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setServicios(usuario.getServicios().stream().map(s -> {
            UsuarioPerfilResponseDTO.ServicioDTO d = new UsuarioPerfilResponseDTO.ServicioDTO();
            d.setNombre(s.getServicio() != null ? s.getServicio().getNombre() : null);
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        response.setIntereses(usuario.getIntereses().stream().map(i -> {
            UsuarioPerfilResponseDTO.InteresDTO d = new UsuarioPerfilResponseDTO.InteresDTO();
            d.setNombre(i.getInteres() != null ? i.getInteres().getNombre() : null);
            return d;
        }).collect(java.util.stream.Collectors.toList()));

        return response;
    }

    @Transactional(readOnly = true)
    public UsuarioPerfilResponseDTO obtenerPerfilPorCorreo(String correo) {
        Usuario usuario = usuarioRepository.findByCorreoInstitucional(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con correo: " + correo));
        return obtenerPerfilCompleto(usuario.getId());
    }

    @Transactional(readOnly = true)
    public java.util.List<Certificacion> obtenerCertificacionesUnicas() {
        return certificacionRepository.findAll();
    }

    @Transactional
    public Certificacion guardarCertificacion(Certificacion certificacion) {
        if (certificacion == null || certificacion.getNombre() == null || certificacion.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la certificación no puede estar vacío");
        }
        String nombreTrimmed = certificacion.getNombre().trim();
        return certificacionRepository.findByNombreIgnoreCase(nombreTrimmed)
                .orElseGet(() -> {
                    Certificacion nuevaCert = new Certificacion();
                    nuevaCert.setNombre(nombreTrimmed);
                    return certificacionRepository.save(nuevaCert);
                });
    }

    /**
     * Calcula el porcentaje de completitud del perfil basado en 27 campos clave.
     * Un 100% representa un perfil realmente completo y profesional.
     * 
     * @param dto El objeto que llega del frontend
     * @return un entero de 0 a 100
     */
    private int calcularPorcentaje(UsuarioPerfilDTO dto) {
        if (dto == null)
            return 0;

        int camposLlenos = 0;
        final int totalCamposReales = 27;

        // --- 1. Información de Identidad (6) ---
        UsuarioPerfilDTO.DatosBasicosDTO basicos = dto.getDatosBasicos();
        if (basicos != null) {
            if (esValido(basicos.getNombre()))
                camposLlenos++;
            if (esValido(basicos.getApellidos()))
                camposLlenos++;
            if (esValido(basicos.getCorreo()))
                camposLlenos++;
            if (esValido(basicos.getNumeroIdentificacion()))
                camposLlenos++;
            if (basicos.getTipoDocumentoId() != null)
                camposLlenos++;
            if (esValido(basicos.getFoto()))
                camposLlenos++;
        }

        // --- 2. Ubicación Académica (4) ---
        if (basicos != null) {
            if (basicos.getSedeId() != null)
                camposLlenos++;
            if (basicos.getFacultadId() != null)
                camposLlenos++;
            if (basicos.getProgramaId() != null)
                camposLlenos++;
            if (basicos.getCentroInvestigativo() != null)
                camposLlenos++;
        }

        // --- 3. Perfil y Trayectoria (5) ---
        UsuarioPerfilDTO.ExperienciaDTO exp = dto.getExperiencia();
        if (exp != null) {
            if (esValido(exp.getPerfilProfesional()))
                camposLlenos++;
            if (exp.getAniosProf() != null)
                camposLlenos++;
        }
        UsuarioPerfilDTO.InteresesDTO intereses = dto.getIntereses();
        if (intereses != null) {
            if (esValido(intereses.getObjetivo()))
                camposLlenos++;
        }
        UsuarioPerfilDTO.RedesDTO redes = dto.getRedes();
        if (redes != null) {
            if (esValido(redes.getLinkedin()))
                camposLlenos++;
            if (esValido(redes.getCvlac()))
                camposLlenos++;
        }

        // --- 4. Listas y Relaciones (12) ---
        UsuarioPerfilDTO.PerfilAcademicoDTO perfilAcad = dto.getPerfilAcademico();
        UsuarioPerfilDTO.CompetenciasDTO comp = dto.getCompetencias();

        // Formaciones (Nivel de formación)
        if (perfilAcad != null && perfilAcad.getNivelFormacionId() != null)
            camposLlenos++;

        // Certificaciones
        if (perfilAcad != null && perfilAcad.getCertificacionesNombres() != null
                && !perfilAcad.getCertificacionesNombres().isEmpty())
            camposLlenos++;

        // Idiomas
        if (perfilAcad != null && perfilAcad.getIdiomas() != null && !perfilAcad.getIdiomas().isEmpty())
            camposLlenos++;

        // Keywords
        if (dto.getKeywords() != null && !dto.getKeywords().isEmpty())
            camposLlenos++;

        // Áreas de Especialidad
        if (dto.getAreasEspecialidad() != null && !dto.getAreasEspecialidad().isEmpty())
            camposLlenos++;

        // Áreas de Conocimiento
        if (perfilAcad != null && perfilAcad.getAreasIds() != null && !perfilAcad.getAreasIds().isEmpty())
            camposLlenos++;

        // Sectores de Experiencia
        if (intereses != null && intereses.getSectoresIds() != null && !intereses.getSectoresIds().isEmpty())
            camposLlenos++;

        // Competencias Técnicas
        if (comp != null && comp.getTecnicas() != null && !comp.getTecnicas().isEmpty())
            camposLlenos++;

        // Competencias Transversales
        if (comp != null && comp.getTransversales() != null && !comp.getTransversales().isEmpty())
            camposLlenos++;

        // Proyectos
        if (exp != null && exp.getTiposProyectoIds() != null && !exp.getTiposProyectoIds().isEmpty())
            camposLlenos++;

        // Intereses en la red
        if (intereses != null && intereses.getInteresesIds() != null && !intereses.getInteresesIds().isEmpty())
            camposLlenos++;

        // Servicios
        if (intereses != null && intereses.getServiciosIds() != null && !intereses.getServiciosIds().isEmpty())
            camposLlenos++;

        // return (camposLlenos * 100) / totalCamposReales;
        return Math.round((float) camposLlenos * 100 / 27);
    }

    private boolean esValido(String valor) {
        return valor != null && !valor.trim().isEmpty();
    }
}
