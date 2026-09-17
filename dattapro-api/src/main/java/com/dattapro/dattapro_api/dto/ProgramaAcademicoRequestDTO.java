package com.dattapro.dattapro_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Alta y edición de un programa académico (POST/PUT /api/v1/programas-academicos).
 *
 * <p>Antes el endpoint recibía la entidad, cuyo campo {@code facultad} lleva
 * {@code @JsonIgnore}: la facultad nunca llegaba y el INSERT fallaba contra el
 * NOT NULL de {@code id_facultad}.
 */
public record ProgramaAcademicoRequestDTO(

        @NotBlank(message = "El nombre es obligatorio") @Size(max = 150, message = "El nombre no puede exceder 150 caracteres") String nombre,

        @NotNull(message = "La facultad es obligatoria") Integer facultadId) {
}
