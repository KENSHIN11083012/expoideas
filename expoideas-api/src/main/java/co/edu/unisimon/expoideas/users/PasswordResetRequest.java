package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.common.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Contraseña que la gestión pone a otra cuenta; queda como temporal. */
public record PasswordResetRequest(
        @NotBlank(message = "La nueva contraseña no puede estar vacía")
        @Pattern(regexp = ValidationPatterns.PASSWORD, message = ValidationPatterns.PASSWORD_MESSAGE)
        String newPassword,

        @NotBlank(message = "La confirmación de contraseña no puede estar vacía")
        String confirmPassword) {
}
