package co.edu.unisimon.expoideas.entity;

/** Quién puede descargar un archivo. */
public enum VisibilidadArchivo {
    /** Cualquiera que tenga el enlace, sin sesión (p. ej. fotos de perfil). */
    publico,
    /** Solo el propietario y la gestión; cada módulo puede ampliar quién más. */
    privado
}
