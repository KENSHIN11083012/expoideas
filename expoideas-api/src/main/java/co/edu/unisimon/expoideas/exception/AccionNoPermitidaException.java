package co.edu.unisimon.expoideas.exception;

/**
 * El usuario tiene sesión y acceso a la ruta, pero su rol no le permite esta
 * operación concreta (p. ej. MacondoLab editando a un administrador, o alguien
 * cambiando su propio rol). GlobalExceptionHandler la traduce a 403 con el
 * motivo en {@code detail}.
 */
public class AccionNoPermitidaException extends RuntimeException {

    public AccionNoPermitidaException(String message) {
        super(message);
    }
}
