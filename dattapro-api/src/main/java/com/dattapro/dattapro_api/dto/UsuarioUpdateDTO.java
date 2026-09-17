package com.dattapro.dattapro_api.dto;

import jakarta.validation.constraints.Size;

/**
 * Datos que el propio usuario puede cambiar (PUT /api/v1/usuarios/me).
 * Todos los campos son opcionales: solo se actualiza lo que se envíe.
 *
 * <p>El correo no está aquí a propósito: es el login y el subject del JWT, así
 * que cambiarlo invalida la sesión activa. Solo lo cambia un administrador. La
 * contraseña tiene su propio flujo en /usuarios/me/password, que exige la actual.
 */
public record UsuarioUpdateDTO(

        @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

        @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos

) {
}
