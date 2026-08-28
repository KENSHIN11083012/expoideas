package com.dattapro.dattapro_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Entidad JPA mapeada a la tabla `facultades`.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "facultades")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Facultad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;
}