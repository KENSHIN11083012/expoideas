package com.dattapro.dattapro_api.dto;

import com.dattapro.dattapro_api.entity.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Actualización de un usuario por parte de un administrador.
 * Todos los campos son opcionales: solo se aplica lo que llegue.
 */
public record UsuarioAdminUpdateDTO(

                @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

                @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos,

                @Size(max = 50, message = "El número de identificación no puede exceder 50 caracteres") String numeroIdentificacion,

                @Email(message = "El formato del correo no es válido") @Size(max = 150, message = "El correo no puede exceder 150 caracteres") String correoInstitucional,

                @Size(max = 255, message = "La URL de la foto no puede exceder 255 caracteres") String fotoUrl,

                @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres") String password,

                RolUsuario rol,

                Integer sedeId,

                Integer programaAcademicoId) {
}
