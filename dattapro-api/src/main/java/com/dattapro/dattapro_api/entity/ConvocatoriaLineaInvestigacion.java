package com.dattapro.dattapro_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "convocatoria_lineas_investigacion")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ConvocatoriaLineaInvestigacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convocatoria_id", nullable = false)
    @JsonIgnore
    private Convocatoria convocatoria;

    @Column(name = "linea", nullable = false, length = 255)
    private String linea;
}
