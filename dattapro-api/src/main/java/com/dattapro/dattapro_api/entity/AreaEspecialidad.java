package com.dattapro.dattapro_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "areas_especialidad")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AreaEspecialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(length = 150, nullable = false)
    private String nombre;
}
