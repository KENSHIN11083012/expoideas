package com.dattapro.dattapro_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad JPA mapeada a la tabla `usuarios`.
 *
 * <p>Solo el núcleo de identidad. El perfil extendido de cada rol
 * (emprendedor, mentor, docente) vive en sus propias tablas.
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

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 30)
    @Builder.Default
    private RolUsuario rol = RolUsuario.emprendedor;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_sede")
    @JsonIgnore
    private Sede sede;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_programa_academico")
    @JsonIgnore
    private ProgramaAcademico programaAcademico;

    @PrePersist
    protected void onCreate() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }
        if (this.rol == null) {
            this.rol = RolUsuario.emprendedor;
        }
    }
}
