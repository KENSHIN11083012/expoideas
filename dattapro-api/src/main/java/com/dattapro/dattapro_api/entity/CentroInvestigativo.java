package com.dattapro.dattapro_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad JPA mapeada a la tabla `centro_investigativo`.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "centro_investigativo")
public class CentroInvestigativo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 200)
    private String nombre;

    @Column(name = "subtitulo", columnDefinition = "TEXT", nullable = false)
    private String subtitulo;
}
