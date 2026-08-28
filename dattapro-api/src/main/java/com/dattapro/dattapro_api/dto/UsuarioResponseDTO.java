package com.dattapro.dattapro_api.dto;

import lombok.Data;
import java.util.List;
import java.time.LocalDateTime;

@Data
public class UsuarioResponseDTO {
    private Integer id;
    private String nombres;
    private String apellidos;
    private byte[] foto;
    private String numeroIdentificacion;
    private String correoInstitucional;
    private Boolean deseaVincularse;
    private Boolean autorizaDatos;
    private String estadoFormulario;
    private String cvlac;
    private String linkedin;
    private String googleScholar;
    private String otraRed;
    private String objetivo;
    private String experienciaServicios;
    private String perfilProfesional;
    private String descripcionProyectos;
    private Integer aniosProf;
    private Boolean colaborativos;
    private Boolean liderar;
    private String password;
    private String rol;
    private Integer porcentajeCompletitud;
    private LocalDateTime fechaCreacion;

    // Relaciones
    private String programaAcademico;
    private String facultad;
    private List<SectorDTO> sectoresExperiencia;
    private List<CompetenciaDTO> competenciasTecnicas;
    private List<CompetenciaDTO> competenciasTransversales;
    private List<IdiomaDTO> idiomas;

    @Data
    public static class SectorDTO {
        private String nombre;
    }

    @Data
    public static class CompetenciaDTO {
        private String nombre;
        private Integer nivel;
    }

    @Data
    public static class IdiomaDTO {
        private String idioma;
        private String nivel;
    }
}
