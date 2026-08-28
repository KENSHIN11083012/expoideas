package com.dattapro.dattapro_api.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entidad JPA mapeada a la tabla `keywords`.
 * Centraliza los nombres de las etiquetas para evitar duplicados.
 */
@Data
@Entity
@Table(name = "keywords")
public class Keyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nombre", nullable = false, unique = true, length = 100)
    private String nombre;
}
