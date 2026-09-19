package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.common.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Cambio de la propia contraseña: exige la actual. */
public record PasswordChangeRequest(
        @NotBlank(message = "Debes proporcionar la contraseña actual.")
        String currentPassword,

        @NotBlank(message = "La nueva contraseña no puede estar vacía")
        @Pattern(regexp = ValidationPatterns.PASSWORD, message = ValidationPatterns.PASSWORD_MESSAGE)
        String newPassword,

        @NotBlank(message = "La confirmación de contraseña no puede estar vacía")
        String confirmPassword) {
}
