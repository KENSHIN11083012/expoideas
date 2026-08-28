package com.dattapro.dattapro_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad JPA mapeada a la tabla `tipo_documento_identidad`.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tipo_documento_identidad")
public class TipoDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;
}