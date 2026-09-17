package co.edu.unisimon.expoideas.dto;

import co.edu.unisimon.expoideas.entity.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Alta de una cuenta desde la gestión (POST /api/v1/admin/users), para quien no
 * se registra por su cuenta: jurados externos o cuentas que nacen con un rol
 * distinto de estudiante.
 *
 * <p>Reglas que dependen del rol y valida el servicio: el correo debe ser
 * institucional salvo para jurados, y docentes y estudiantes declaran sede y
 * facultad (programa opcional). Para los demás roles la adscripción se ignora.
 *
 * <p>La contraseña es temporal: quien crea la cuenta se la entrega a la persona.
 */
public record UsuarioAdminCreateDTO(

        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres") String nombres,

        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres") String apellidos,

        @NotBlank(message = "El correo es obligatorio") @Email(message = "El formato del correo no es válido") @Size(max = 150, message = "El correo no puede exceder 150 caracteres") String correoInstitucional,

        @NotBlank(message = "La contraseña es obligatoria") @Pattern(regexp = Validaciones.PASSWORD_REGEX, message = Validaciones.PASSWORD_MENSAJE) String password,

        @NotNull(message = "El rol es obligatorio") RolUsuario rol,

        Integer sedeId,

        Integer facultadId,

        Integer programaAcademicoId) {
}
