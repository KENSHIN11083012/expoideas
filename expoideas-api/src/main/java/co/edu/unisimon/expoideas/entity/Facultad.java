package co.edu.unisimon.expoideas.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad JPA mapeada a la tabla `facultades`.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "facultades")
public class Facultad implements Catalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;
}
