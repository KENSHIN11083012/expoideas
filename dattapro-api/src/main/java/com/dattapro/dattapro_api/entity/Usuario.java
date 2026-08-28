package com.dattapro.dattapro_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Entidad JPA mapeada a la tabla `usuarios` de la base de datos dattapro2.
 * Las relaciones con Sede, Programa, etc., se completan en el segundo
 * formulario.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    // @Column(name = "foto", columnDefinition = "TEXT")
    // private String foto;
    @Lob
    @Column(name = "foto", columnDefinition = "MEDIUMBLOB")
    private byte[] foto;

    @Column(name = "numero_identificacion", length = 50, unique = true)
    private String numeroIdentificacion;

    @Column(name = "correo_institucional", nullable = false, unique = true, length = 150)
    private String correoInstitucional;

    // SECCIÓN 1. CONSENTIMIENTO E INTENCIÓN DE VINCULACIÓN
    @Column(name = "desea_vincularse")
    @Builder.Default
    private Boolean deseaVincularse = true;

    @Column(name = "autoriza_datos")
    @Builder.Default
    private Boolean autorizaDatos = false;

    // ESTADO DEL FORMULARIO
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_formulario")
    @Builder.Default
    private EstadoFormulario estadoFormulario = EstadoFormulario.pendiente;

    // REDES PROFESIONALES
    @Column(name = "cvlac", length = 255)
    private String cvlac;

    @Column(name = "linkedin", length = 255)
    private String linkedin;

    @Column(name = "google_scholar", length = 255)
    private String googleScholar;

    @Column(name = "otra_red", length = 255)
    private String otraRed;

    // CAMPOS FINALES DEL FORMULARIO
    @Column(name = "objetivo", columnDefinition = "TEXT")
    private String objetivo;

    @Column(name = "experiencia_servicios", length = 50)
    private String experienciaServicios;

    // @Column(name = "biostatement", columnDefinition = "TEXT")
    // private String biostatement;

    // @Column(name = "proyectos_text", columnDefinition = "TEXT")
    // private String proyectosText;
    @Column(name = "perfil_profesional", columnDefinition = "TEXT")
    private String perfilProfesional;

    @Column(name = "descripcion_proyectos", columnDefinition = "TEXT")
    private String descripcionProyectos;

    // @Column(name = "años_prof")
    // private Integer añosProf;
    @Column(name = "anios_prof")
    private Integer aniosProf;

    @Column(name = "colaborativos")
    @Builder.Default
    private Boolean colaborativos = false;

    @Column(name = "liderar")
    @Builder.Default
    private Boolean liderar = false;

    // TODO: Implementar BCrypt para hashear la contraseña antes de guardar
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", columnDefinition = "ENUM('admin','profesor','directivo')")
    @Builder.Default
    private RolUsuario rol = RolUsuario.profesor;

    @Column(name = "porcentaje_completitud")
    @Builder.Default
    private Integer porcentajeCompletitud = 0;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    // --- Relaciones (se completan en el segundo formulario) ---

    /**
     * Tipo de documento de identidad (ej: CC, CE, Pasaporte).
     * Nullable → se llenará en el segundo formulario.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_documento", nullable = true)
    @JsonIgnore
    private TipoDocumento tipoDocumento;

    /**
     * Tipo de vinculación del docente (planta / período académico).
     * Nullable → se llenará en el segundo formulario.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_vinculacion", nullable = true)
    @JsonIgnore
    private TipoVinculacion tipoVinculacion;

    /**
     * Sede a la que pertenece el usuario.
     * Nullable → se llenará en el segundo formulario.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_sede", nullable = true)
    @JsonIgnore
    private Sede sede;

    /**
     * Centro investigativo al que pertenece el usuario.
     * Nullable → se llenará en el segundo formulario.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_centro_investigativo", nullable = true)
    @JsonIgnore
    private CentroInvestigativo centroInvestigativo;

    /**
     * Programa académico del usuario.
     * Nullable → se llenará en el segundo formulario.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_programa_academico", nullable = true)
    @JsonIgnore
    private ProgramaAcademico programaAcademico;

    // --- Relaciones intermedias OneToMany ---

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioArea> areas;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioAreaEspecialidad> areasEspecialidad;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioCertificacion> certificaciones;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioCompetenciaTecnica> competenciasTecnicas;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioCompetenciaTransversal> competenciasTransversales;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioFormacion> formaciones;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioIdioma> idiomas;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioProyecto> proyectos;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioSectorExperiencia> sectoresExperiencia;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioServicio> servicios;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<UsuarioInteresRed> intereses;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.colaborativos == null)
            this.colaborativos = false;

        if (this.liderar == null)
            this.liderar = false;

        if (this.deseaVincularse == null)
            this.deseaVincularse = true;

        if (this.porcentajeCompletitud == null)
            this.porcentajeCompletitud = 0;

        if (this.rol == null)
            this.rol = RolUsuario.profesor;

        if (this.estadoFormulario == null)
            this.estadoFormulario = EstadoFormulario.pendiente;
    }
}
