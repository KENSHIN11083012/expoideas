package co.edu.unisimon.expoideas.entity;

/**
 * Paso que la cuenta debe completar antes de usar la plataforma. Viaja tal cual
 * en JSON ("cambiarPassword", "autorizarDatos") y se resuelve en la pantalla de
 * primer ingreso.
 */
public enum PendienteDeIngreso {
    /** La contraseña actual la puso la gestión y es temporal. */
    cambiarPassword,
    /** Falta la autorización de tratamiento de datos personales (Ley 1581 de 2012). */
    autorizarDatos
}
