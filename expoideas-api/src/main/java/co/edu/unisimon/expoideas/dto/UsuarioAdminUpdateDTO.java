package co.edu.unisimon.expoideas.dto;

import co.edu.unisimon.expoideas.entity.RolUsuario;

/**
 * Cambios que la gestión hace sobre una cuenta: rol y adscripción académica.
 * Todos los campos son opcionales: solo se aplica lo que llegue. Los datos
 * personales y la foto los cambia cada persona desde su perfil, y la contraseña
 * se restablece por su propia ruta (queda como temporal).
 *
 * <p>Adscripción: si llega {@code facultadId}, se reemplaza completa (facultad y
 * programa; {@code programaAcademicoId} en null significa "sin programa"). Si
 * solo llega {@code programaAcademicoId}, la facultad se toma de ese programa.
 */
public record UsuarioAdminUpdateDTO(

        RolUsuario rol,
        Integer sedeId,
        Integer facultadId,
        Integer programaAcademicoId) {
}
