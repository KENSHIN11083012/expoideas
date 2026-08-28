package com.dattapro.dattapro_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad JPA mapeada a la tabla `convocatorias`.
 * Contiene las relaciones con categorias, entidades y tablas puente.
 */
@Data
@Entity
@Table(name = "convocatorias")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Convocatoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "titulo", nullable = false, length = 255)
    private String titulo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    @JsonIgnore
    private Categoria categoria;

    @Column(name = "subtipo", length = 100)
    private String subtipo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "criterios_participacion", columnDefinition = "TEXT", nullable = false)
    private String criteriosParticipacion;

    @Column(name = "proceso_evaluacion", columnDefinition = "TEXT")
    private String procesoEvaluacion;

    @Column(name = "resultados_esperados", columnDefinition = "TEXT")
    private String resultadosEsperados;

    @Column(name = "financiacion", nullable = false, length = 200)
    private String financiacion;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_limite")
    private LocalDate fechaLimite;

    @Column(name = "imagen_fondo", columnDefinition = "TEXT")
    private String imagenFondo;

    @Column(name = "enlace", columnDefinition = "TEXT", nullable = false)
    private String enlace;

    @Column(name = "contacto_nombre", length = 150)
    private String contactoNombre;

    @Column(name = "contacto_correo", length = 150)
    private String contactoCorreo;

    @Column(name = "contacto_dependencia", length = 150)
    private String contactoDependencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidad_id", nullable = true)
    @JsonIgnore
    private Entidad entidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    @JsonIgnore
    private Usuario usuario;

    @Column(name = "visible", nullable = false)
    private Boolean visible = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoConvocatoria estado = EstadoConvocatoria.Abierta;

    // --- Relaciones OneToMany con tablas puente y nuevas entidades ---

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaArea> areas = new ArrayList<>();

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaAreaEspecialidad> areasEspecialidad = new ArrayList<>();

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaCompetenciaTecnica> competenciasTecnicas = new ArrayList<>();

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaCompetenciaTransversal> competenciasTransversales = new ArrayList<>();

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaSector> sectores = new ArrayList<>();

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaServicio> servicios = new ArrayList<>();

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaTipoProyecto> tiposProyecto = new ArrayList<>();

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaLineaInvestigacion> lineasInvestigacion = new ArrayList<>();

    @OneToMany(mappedBy = "convocatoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ConvocatoriaKeyword> keywords = new ArrayList<>();
}
