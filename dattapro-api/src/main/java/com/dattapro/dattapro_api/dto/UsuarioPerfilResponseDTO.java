package com.dattapro.dattapro_api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;
import java.time.LocalDateTime;

@Data
public class UsuarioPerfilResponseDTO {
    private Integer id;
    private String nombres;
    private String apellidos;
    private String correoInstitucional;
    private String numeroIdentificacion;
    private String foto;
    @JsonProperty("deseavincularse")
    private Boolean deseaVincularse;
    @JsonProperty("autorizadatos")
    private Boolean autorizaDatos;
    private String estadoFormulario;
    private String rol;
    private LocalDateTime fechaCreacion;
    private Integer porcentajeCompletitud;

    // Redes
    private String cvlac;
    private String linkedin;
    private String googleScholar;
    private String otraRed;

    // Perfil Profesional
    private String perfilProfesional;
    private String descripcionProyectos;
    private Integer aniosProf;
    private Boolean colaborativos;
    private Boolean liderar;
    private String objetivo;
    private String experienciaServicios;

    // Relaciones base (Maestros)
    private String tipoDocumento;
    private String tipoVinculacion;
    private String sede;
    private String centroInvestigativo;
    private String programaAcademico;
    private String facultad;

    // Relaciones múltiples
    private List<FormacionDTO> formaciones;
    private List<IdiomaDTO> idiomas;
    private List<AreaDTO> areas;
    private List<AreaEspecialidadDTO> areasEspecialidad;
    private List<CertificacionDTO> certificaciones;
    private List<CompetenciaDTO> competenciasTecnicas;
    private List<CompetenciaDTO> competenciasTransversales;
    private List<ProyectoDTO> proyectos;
    private List<SectorDTO> sectoresExperiencia;
    private List<ServicioDTO> servicios;
    private List<InteresDTO> intereses;

    @Data
    public static class FormacionDTO {
        private String nivel;
        private String titulo;
    }

    @Data
    public static class IdiomaDTO {
        private String idioma;
        private String nivel;
    }

    @Data
    public static class AreaDTO {
        private String nombre;
    }

    @Data
    public static class AreaEspecialidadDTO {
        private String nombre;
    }

    @Data
    public static class CertificacionDTO {
        private String nombre;
    }

    @Data
    public static class CompetenciaDTO {
        private String nombre;
        private Integer nivel;
    }

    @Data
    public static class ProyectoDTO {
        private String nombre;
    }

    @Data
    public static class SectorDTO {
        private String nombre;
    }

    @Data
    public static class ServicioDTO {
        private String nombre;
    }

    @Data
    public static class InteresDTO {
        private String nombre;
    }
}
