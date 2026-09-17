package com.dattapro.dattapro_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Datos que el propio usuario puede cambiar (PUT /api/v1/usuarios/me).
 *
 * <p>Es un reemplazo completo, como corresponde a PUT: llegan todos los campos.
 * La adscripción depende del rol, así que la valida el servicio y no una
 * anotación: si el rol la requiere ({@code RolUsuario#requiereAdscripcion}),
 * sede y facultad son obligatorias; si no (administrador), se ignoran.
 * {@code programaAcademicoId} en null significa "sin programa" (docentes y
 * mentores pueden no tenerlo); si llega, debe ser de la facultad indicada.
 *
 * <p>El correo no está aquí a propósito: es el login y el subject del JWT, así
 * que cambiarlo invalida la sesión activa. Solo lo cambia un administrador. La
 * contraseña tiene su propio flujo en /usuarios/me/password, que exige la actual.
 */
public record UsuarioUpdateDTO(

        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos,

        Integer sedeId,

        Integer facultadId,

        Integer programaAcademicoId

) {
}
