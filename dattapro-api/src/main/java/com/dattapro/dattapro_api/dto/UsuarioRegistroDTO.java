package com.dattapro.dattapro_api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registro inicial de usuario. El rol no se acepta desde el cliente:
 * toda cuenta nueva nace como emprendedor y solo un admin puede cambiarlo.
 */
public record UsuarioRegistroDTO(

        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos,

        @NotBlank(message = "El correo institucional es obligatorio") @Email(message = "El formato del correo no es válido") @Size(max = 150, message = "El correo no puede exceder 150 caracteres") @Pattern(regexp = Validaciones.CORREO_INSTITUCIONAL_REGEX, message = Validaciones.CORREO_INSTITUCIONAL_MENSAJE) String correoInstitucional,

        @NotBlank(message = "La contraseña es obligatoria") @Pattern(regexp = Validaciones.PASSWORD_REGEX, message = Validaciones.PASSWORD_MENSAJE) String password,

        /** Autorización de tratamiento de datos personales: sin ella no hay registro. */
        @NotNull(message = "Debes indicar si autorizas el tratamiento de tus datos") @AssertTrue(message = "Debes autorizar el tratamiento de tus datos para registrarte") Boolean autorizaDatos) {
}
