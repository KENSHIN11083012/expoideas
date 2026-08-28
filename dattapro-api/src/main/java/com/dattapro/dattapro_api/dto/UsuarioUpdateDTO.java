package com.dattapro.dattapro_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * DTO para actualizar un usuario existente (PUT /api/v1/usuarios/{id}).
 * Todos los campos son opcionales: solo se actualiza lo que se envíe.
 */
public record UsuarioUpdateDTO(

        @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

        @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos,

        @Email(message = "El formato del correo no es válido") @Size(max = 150, message = "El correo no puede exceder 150 caracteres") String correoInstitucional,

        @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres") String password

) {
}
