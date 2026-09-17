package co.edu.unisimon.expoideas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Alta y edición de un catálogo que solo tiene nombre: sedes, facultades,
 * categorías y keywords. El límite de 100 es el de la columna más corta.
 */
public record CatalogoRequestDTO(

        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "El nombre no puede exceder 100 caracteres") String nombre) {
}
