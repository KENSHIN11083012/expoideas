package com.dattapro.dattapro_api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class UsuarioPerfilDTO {
    private Integer usuarioId;

    private DatosBasicosDTO datosBasicos;
    private PerfilAcademicoDTO perfilAcademico;
    private ExperienciaDTO experiencia;
    private CompetenciasDTO competencias;
    private RedesDTO redes;
    private InteresesDTO intereses;
    private List<String> keywords;

    @JsonProperty("areasEspecialidad")
    private List<AreaEspecialidadDTO> areasEspecialidad;

    @Data
    public static class AreaEspecialidadDTO {
        private String nombre;
    }

    @Data
    public static class DatosBasicosDTO {
        private String nombre;
        private String apellidos;
        private Integer tipoDocumentoId;
        private String numeroIdentificacion;
        private String correo;
        private Integer facultadId;
        private Integer programaId;
        private Integer tipoVinculacionId;
        private Integer sedeId;
        private Integer centroInvestigativo;
        private String foto;

        @JsonProperty("deseavincularse")
        private Boolean deseaVincularse;

        @JsonProperty("autorizadatos")
        private Boolean autorizaDatos;
    }

    @Data
    public static class PerfilAcademicoDTO {
        private Integer nivelFormacionId;
        private String tituloFormacion;
        private List<Integer> areasIds;
        private List<IdiomaNivelDTO> idiomas;
        private List<String> certificacionesNombres;
    }

    @Data
    public static class IdiomaNivelDTO {
        private Integer idiomaId;
        private Integer nivelId;
    }

    @Data
    public static class ExperienciaDTO {
        private Integer aniosProf;
        private List<Integer> tiposProyectoIds;
        private String descripcionProyectos;
        private String perfilProfesional;
    }

    @Data
    public static class CompetenciaDTO {
        private Integer competenciaId;
        private Integer nivel;
    }

    @Data
    public static class CompetenciasDTO {
        private List<CompetenciaDTO> tecnicas;
        private List<CompetenciaDTO> transversales;
    }

    @Data
    public static class RedesDTO {
        private String linkedin;
        private String cvlac;
        private String googleScholar;
        private String otraRed;
    }

    @Data
    public static class InteresesDTO {
        private List<Integer> serviciosIds;
        private String experienciaServicios;
        private List<Integer> sectoresIds;
        private Boolean quiereParticipar;
        private Boolean quiereLiderar;
        private List<Integer> interesesIds;
        private String objetivo;
    }
}
