package co.edu.unisimon.expoideas.common;

/**
 * Reglas de validación compartidas por las peticiones.
 *
 * <p>El frontend aplica las mismas (lib/validation.js): si cambian aquí, hay que
 * cambiarlas allá.
 */
public final class ValidationPatterns {

    /** 8 a 100 caracteres, con al menos un número y un símbolo. */
    public static final String PASSWORD = "^(?=.*\\d)(?=.*[\\W_]).{8,100}$";

    public static final String PASSWORD_MESSAGE =
            "La contraseña debe tener entre 8 y 100 caracteres, incluyendo números y símbolos";

    public static final String INSTITUTIONAL_EMAIL = "^[^@\\s]+@unisimon\\.edu\\.co$";

    public static final String INSTITUTIONAL_EMAIL_MESSAGE = "El correo debe terminar en @unisimon.edu.co";

    private ValidationPatterns() {
    }
}
