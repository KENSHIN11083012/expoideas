package com.dattapro.dattapro_api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Vista pública de un usuario.
 *
 * <p>No incluye el hash de la contraseña: la versión de Dattapro sí lo exponía,
 * y GET /api/v1/usuarios es un endpoint permitAll.
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
