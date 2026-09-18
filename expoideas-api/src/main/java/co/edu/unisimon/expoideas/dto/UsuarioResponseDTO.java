package co.edu.unisimon.expoideas.dto;

import lombok.Builder;
import lombok.Data;

import co.edu.unisimon.expoideas.entity.PendienteDeIngreso;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Datos de un usuario para el propio usuario (/usuarios/me) y para el admin.
 *
 * <p>No incluye el hash de la contraseña: la versión de Dattapro sí lo exponía,
 * y GET /api/v1/usuarios era permitAll. Tampoco es apto para un listado público
 * (lleva el correo).
 *
 * <p>La adscripción viaja con nombre (para mostrar) e id (para los formularios).
 */
@Data
@Builder
public class UsuarioResponseDTO {
    private Integer id;
    private String nombres;
    private String apellidos;
    private String correoInstitucional;
    /** Identificador de la foto de perfil (GET /api/v1/archivos/{fotoId}), o null. */
    private String fotoId;
    private String rol;
    private LocalDateTime fechaCreacion;

    private Integer sedeId;
    private String sede;
    private Integer facultadId;
    private String facultad;
    private Integer programaAcademicoId;
    private String programaAcademico;

    /** Pasos de primer ingreso sin completar; vacío si la cuenta puede usar la plataforma. */
    private List<PendienteDeIngreso> pendientes;
}
