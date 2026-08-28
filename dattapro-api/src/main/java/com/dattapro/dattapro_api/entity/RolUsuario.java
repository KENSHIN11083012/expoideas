package com.dattapro.dattapro_api.entity;

/**
 * Rol del usuario en la tabla `usuarios`.
 *
 * <p>Los valores se persisten como texto en una columna VARCHAR con un CHECK
 * (ver V1__baseline.sql). Agregar un rol nuevo es añadirlo aquí y actualizar la
 * constraint con una migración; no hace falta reescribir el tipo de la columna,
 * como sí exigía el ENUM de MySQL que usaba Dattapro.
 *
 * <p>Herencia de Dattapro: su rol {@code profesor} es aquí {@code docente}.
 * {@code directivo} no se trasladó.
 */
public enum RolUsuario {
    admin,
    docente,
    emprendedor,
    mentor,
    visitante
}
