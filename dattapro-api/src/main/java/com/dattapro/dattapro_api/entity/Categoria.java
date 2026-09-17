package com.dattapro.dattapro_api.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entidad JPA mapeada a la tabla `categorias`.
 */
@Data
@Entity
@Table(name = "categorias")
public class Categoria implements Catalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 100, unique = true)
    private String nombre;
}
