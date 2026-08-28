package com.dattapro.dattapro_api.dto;

import com.dattapro.dattapro_api.entity.EstadoFormulario;
import com.dattapro.dattapro_api.entity.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * DTO para la actualización completa de un usuario por parte de un
 * administrador.
 * Permite editar todos los campos, incluyendo el rol.
 */
public record UsuarioAdminUpdateDTO(

                @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

                @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos,

                @Size(max = 50, message = "El número de identificación no puede exceder 50 caracteres") String numeroIdentificacion,

                @Email(message = "El formato del correo no es válido") @Size(max = 150, message = "El correo no puede exceder 150 caracteres") String correoInstitucional,

                String perfilProfesional,

                String descripcionProyectos,

                Integer aniosProf,

                Boolean colaborativos,

                Boolean liderar,

                @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres") String password,

                RolUsuario rol,

                EstadoFormulario estadoFormulario,

                Integer tipoDocumentoId,

                Integer tipoVinculacionId,

                Integer sedeId,

                Integer centroInvestigativoId,

                Integer programaAcademicoId) {
}
