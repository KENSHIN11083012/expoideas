package co.edu.unisimon.expoideas.entity;

/**
 * Rol del usuario en la tabla `usuarios`.
 *
 * <p>Los valores se persisten como texto en una columna VARCHAR con un CHECK
 * (ver V4__roles_expoideas.sql). Agregar un rol nuevo es añadirlo aquí y
 * actualizar la constraint con una migración.
 *
 * <p>En Spring Security cada rol es ROLE_ + el nombre en mayúsculas, y
 * SecurityConfig declara que ROLE_ADMIN implica ROLE_MACONDOLAB.
 */
public enum RolUsuario {
    /** Parte técnica de la plataforma. Puede todo lo de MacondoLab y además gestionar cuentas de gestión. */
    admin,
    /** Coordinación de INNPRENDE I y II: operación completa, sin la parte técnica. */
    macondolab,
    docente,
    /** Evalúa proyectos. Puede ser externo a la universidad. */
    jurado,
    /** Rol con el que nace toda cuenta registrada. */
    estudiante;

    /** Si el rol pertenece a la comunidad académica y debe declarar sede y facultad. */
    public boolean requiereAdscripcion() {
        return this == docente || this == estudiante;
    }

    /** Roles con acceso a la gestión de la plataforma (usuarios, catálogos). */
    public boolean esDeGestion() {
        return this == admin || this == macondolab;
    }

    /**
     * Si quien tiene este rol puede administrar una cuenta con el rol {@code otro}:
     * editarla, cambiarle el rol o restablecer su contraseña. MacondoLab gestiona
     * estudiantes, docentes y jurados; las cuentas de gestión solo las toca un
     * administrador.
     */
    public boolean puedeGestionar(RolUsuario otro) {
        return switch (this) {
            case admin -> true;
            case macondolab -> !otro.esDeGestion();
            default -> false;
        };
    }
}
