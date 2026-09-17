package co.edu.unisimon.expoideas.dto;

import co.edu.unisimon.expoideas.entity.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Actualización de un usuario por parte de un administrador.
 * Todos los campos son opcionales: solo se aplica lo que llegue. La foto no está
 * aquí: la sube cada persona desde su perfil.
 *
 * <p>Adscripción: si llega {@code facultadId}, se reemplaza completa (facultad y
 * programa; {@code programaAcademicoId} en null significa "sin programa"). Si
 * solo llega {@code programaAcademicoId}, la facultad se toma de ese programa.
 */
public record UsuarioAdminUpdateDTO(

                @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

                @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos,

                @Size(max = 50, message = "El número de identificación no puede exceder 50 caracteres") String numeroIdentificacion,

                @Email(message = "El formato del correo no es válido") @Size(max = 150, message = "El correo no puede exceder 150 caracteres") String correoInstitucional,

                @Pattern(regexp = Validaciones.PASSWORD_REGEX, message = Validaciones.PASSWORD_MENSAJE) String password,

                RolUsuario rol,

                Integer sedeId,

                Integer facultadId,

                Integer programaAcademicoId) {
}
