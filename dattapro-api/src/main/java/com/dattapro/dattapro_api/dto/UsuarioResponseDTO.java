package com.dattapro.dattapro_api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Datos de un usuario para el propio usuario (/usuarios/me) y para el admin.
 *
 * <p>No incluye el hash de la contraseña: la versión de Dattapro sí lo exponía,
 * y GET /api/v1/usuarios era permitAll. Tampoco es apto para un listado público
 * (lleva correo y número de identificación).
 */
@Data
@Builder
public class UsuarioResponseDTO {
    private Integer id;
    private String nombres;
    private String apellidos;
    private String correoInstitucional;
    private String numeroIdentificacion;
    private String fotoUrl;
    private String rol;
    private LocalDateTime fechaCreacion;

    private String sede;
    private String programaAcademico;
    private String facultad;
}
