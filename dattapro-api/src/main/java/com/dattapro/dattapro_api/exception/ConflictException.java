package com.dattapro.dattapro_api.exception;

/**
 * La operación choca con un dato que ya existe (p. ej. un correo registrado).
 * GlobalExceptionHandler la traduce a 409 Conflict.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
