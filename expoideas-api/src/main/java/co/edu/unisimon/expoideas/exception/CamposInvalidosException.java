package co.edu.unisimon.expoideas.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Validación que depende del estado (p. ej. del rol del usuario) y por eso no
 * cabe en las anotaciones del DTO. GlobalExceptionHandler la traduce a un 400
 * con {@code campos}, igual que los errores de Bean Validation, para que el
 * cliente la muestre en cada campo.
 */
public class CamposInvalidosException extends RuntimeException {

    private final Map<String, String> campos;

    public CamposInvalidosException(Map<String, String> campos) {
        super("Datos inválidos");
        this.campos = Collections.unmodifiableMap(new LinkedHashMap<>(campos));
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
