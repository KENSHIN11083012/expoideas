package co.edu.unisimon.expoideas.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad JPA mapeada a la tabla `usuarios`.
 *
 * <p>Solo el núcleo de identidad. El perfil extendido de cada rol
 * (estudiante, docente, jurado) vive en sus propias tablas.
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

    @Column(name = "correo_institucional", nullable = false, unique = true, length = 150)
    private String correoInstitucional;

    /** Hash BCrypt. @JsonIgnore para que no salga por la API ni por error. */
    @JsonIgnore
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    /** La contraseña la puso la gestión (cuenta creada o restablecida): es temporal. */
    @Column(name = "debe_cambiar_password", nullable = false)
    @Builder.Default
    private Boolean debeCambiarPassword = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 30)
    @Builder.Default
    private RolUsuario rol = RolUsuario.estudiante;

    /**
     * Ruta o URL de la foto. En Dattapro era un MEDIUMBLOB dentro de esta misma
     * tabla: inviable para un feed y por encima del límite de 5 MB/archivo de TI.
     */
    @Column(name = "foto_url", length = 255)
    private String fotoUrl;

    @Column(name = "numero_identificacion", length = 50, unique = true)
    private String numeroIdentificacion;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    /** Autorización de tratamiento de datos personales dada en el registro. */
    @Column(name = "autoriza_datos", nullable = false)
    @Builder.Default
    private Boolean autorizaDatos = false;

    @Column(name = "fecha_autorizacion_datos")
    private LocalDateTime fechaAutorizacionDatos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_sede")
    @JsonIgnore
    private Sede sede;

    /**
     * Facultad del usuario. Se guarda aparte del programa porque un docente
     * pertenece a una facultad sin estar en un programa concreto.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_facultad")
    @JsonIgnore
    private Facultad facultad;

    /** Opcional; si existe, pertenece a {@link #facultad}. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_programa_academico")
    @JsonIgnore
    private ProgramaAcademico programaAcademico;

    /** Lo que la cuenta debe resolver antes de usar la plataforma, en el orden en que se pide. */
    public List<PendienteDeIngreso> pendientesDeIngreso() {
        List<PendienteDeIngreso> pendientes = new ArrayList<>();
        if (Boolean.TRUE.equals(debeCambiarPassword))
            pendientes.add(PendienteDeIngreso.cambiarPassword);
        if (!Boolean.TRUE.equals(autorizaDatos))
            pendientes.add(PendienteDeIngreso.autorizarDatos);
        return pendientes;
    }

    @PrePersist
    protected void onCreate() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }
        if (this.rol == null) {
            this.rol = RolUsuario.estudiante;
        }
    }
}
