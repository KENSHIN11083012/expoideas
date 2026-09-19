package co.edu.unisimon.expoideas.users;

/**
 * Paso que la cuenta debe completar antes de usar la plataforma (primer
 * ingreso). Viaja tal cual en JSON y lo resuelve la pantalla de primer ingreso.
 */
public enum OnboardingStep {
    /** La contraseña actual la puso la gestión y es temporal. */
    CHANGE_PASSWORD,
    /** Falta la autorización de tratamiento de datos personales (Ley 1581 de 2012). */
    DATA_CONSENT
}
