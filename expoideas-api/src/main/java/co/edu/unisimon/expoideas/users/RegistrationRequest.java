package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.common.ValidationPatterns;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registro público. Toda cuenta nace como estudiante: el rol no se acepta desde
 * el cliente. La adscripción es obligatoria (el programa, opcional).
 */
public record RegistrationRequest(
        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres")
        String firstName,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres")
        String lastName,

        @NotBlank(message = "El correo institucional es obligatorio")
        @Email(message = "El formato del correo no es válido")
        @Size(max = 150, message = "El correo no puede exceder 150 caracteres")
        @Pattern(regexp = ValidationPatterns.INSTITUTIONAL_EMAIL, message = ValidationPatterns.INSTITUTIONAL_EMAIL_MESSAGE)
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Pattern(regexp = ValidationPatterns.PASSWORD, message = ValidationPatterns.PASSWORD_MESSAGE)
        String password,

        @NotNull(message = "La sede es obligatoria")
        Integer campusId,

        @NotNull(message = "La facultad es obligatoria")
        Integer facultyId,

        Integer academicProgramId,

        @NotNull(message = "Debes indicar si autorizas el tratamiento de tus datos")
        @AssertTrue(message = "Debes autorizar el tratamiento de tus datos para registrarte")
        Boolean dataConsent) {
}
