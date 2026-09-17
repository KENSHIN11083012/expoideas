package co.edu.unisimon.expoideas.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

/** Autorización de tratamiento de datos dada por el propio usuario (PUT /usuarios/me/autorizacion-datos). */
public record AutorizacionDatosDTO(

        @NotNull(message = "Debes indicar si autorizas el tratamiento de tus datos") @AssertTrue(message = "Debes autorizar el tratamiento de tus datos para usar la plataforma") Boolean autorizaDatos) {
}
