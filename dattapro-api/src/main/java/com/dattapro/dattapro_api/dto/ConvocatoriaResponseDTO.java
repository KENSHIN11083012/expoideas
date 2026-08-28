package com.dattapro.dattapro_api.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO de respuesta para una convocatoria completa.
 * Expone nombres legibles en lugar de IDs para las relaciones.
 */
@Data
public class ConvocatoriaResponseDTO {

    private Integer id;
    private String titulo;

    // Categoria
    private Integer categoriaId;
    private String categoria;

    // Contenido
    private String subtipo;
    private String descripcion;
    private String criteriosParticipacion;
    private String procesoEvaluacion;
    private String resultadosEsperados;
    private String financiacion;
    private LocalDate fechaInicio;
    private LocalDate fechaLimite;
    private String imagenFondo;
    private String enlace;

    // Contacto
    private String contactoNombre;
    private String contactoCorreo;
    private String contactoDependencia;

    // Entidad
    private Integer entidadId;
    private String entidad;
    private String logoEntidad;
    private Integer usuarioId;
    private Boolean visible;
    private String estado;

    // Relaciones como listas de nombres
    private List<String> areas;
    private List<String> areasEspecialidad;
    private List<String> competenciasTecnicas;
    private List<String> competenciasTransversales;
    private List<String> sectores;
    private List<String> servicios;
    private List<String> tiposProyecto;
    
    // Nuevas relaciones
    private List<String> keywords;
    private List<String> lineasInvestigacion;

    // Relaciones como listas de IDs (útil para pre-poblar formularios de edición)
    private List<Integer> areasIds;
    private List<Integer> areasEspecialidadIds;
    private List<Integer> competenciasTecnicasIds;
    private List<Integer> competenciasTransversalesIds;
    private List<Integer> sectoresIds;
    private List<Integer> serviciosIds;
    private List<Integer> tiposProyectoIds;
}
