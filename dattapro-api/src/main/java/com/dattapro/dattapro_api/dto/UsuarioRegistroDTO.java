package com.dattapro.dattapro_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de registro inicial de usuario.
 * Utiliza Java Record para inmutabilidad y concisión.
 * Solo contiene los campos del primer formulario de registro.
 */
public record UsuarioRegistroDTO(

        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos,

        @NotBlank(message = "El correo institucional es obligatorio") @Email(message = "El formato del correo no es válido") @Size(max = 150, message = "El correo no puede exceder 150 caracteres") String correoInstitucional,

        @NotBlank(message = "La contraseña es obligatoria") @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres") String password,

        Boolean autorizaDatos) {
}
