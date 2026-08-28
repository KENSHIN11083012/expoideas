package com.dattapro.dattapro_api.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO para crear o actualizar una convocatoria.
 * Los IDs de relaciones se reciben como listas de enteros.
 */
@Data
public class ConvocatoriaRequestDTO {

    private String titulo;
    private Integer categoriaId;
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
    private String contactoNombre;
    private String contactoCorreo;
    private String contactoDependencia;
    private Integer entidadId;
    private Integer usuarioId;
    private Boolean visible;
    private String estado; // String para recibir del JSON, se mapeará al Enum

    // IDs de relaciones muchos a muchos
    private List<Integer> areasIds;
    private List<Integer> areasEspecialidadIds;
    private List<Integer> competenciasTecnicasIds;
    private List<Integer> competenciasTransversalesIds;
    private List<Integer> sectoresIds;
    private List<Integer> serviciosIds;
    private List<Integer> tiposProyectoIds;

    // Nuevas listas de strings para keywords y líneas de investigación
    private List<String> keywords;
    private List<String> lineasInvestigacion;
}
