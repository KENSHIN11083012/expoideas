package com.dattapro.dattapro_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO para el cambio de contraseña de un usuario.
 * <ul>
 *   <li>{@code passwordActual} – contraseña actual del usuario (requerida para
 *       que el propio usuario la cambie vía PUT).</li>
 *   <li>{@code passwordNueva} – nueva contraseña deseada.</li>
 *   <li>{@code confirmacionPassword} – confirmación de la nueva contraseña.</li>
 * </ul>
 */
public record CambiarPasswordDTO(

        /**
         * Contraseña actual del usuario.
         * Requerida cuando el propio usuario cambia su contraseña (PUT).
         * Puede ser {@code null} cuando un administrador la restablece (POST).
         */
        String passwordActual,

        @NotBlank(message = "La nueva contraseña no puede estar vacía")
        @Pattern(regexp = Validaciones.PASSWORD_REGEX, message = Validaciones.PASSWORD_MENSAJE)
        String passwordNueva,

        @NotBlank(message = "La confirmación de contraseña no puede estar vacía")
        String confirmacionPassword
) {}
