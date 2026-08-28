package com.dattapro.dattapro_api.entity;

/**
 * Enum que representa el rol del usuario en la tabla `usuarios`.
 * Valores válidos: admin, profesor, directivo (deben coincidir exactamente con el
 * ENUM de MySQL).
 */
public enum RolUsuario {
    admin,
    profesor,
    directivo
}
