package co.edu.unisimon.expoideas.common;

import co.edu.unisimon.expoideas.security.OnboardingRequiredException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Manejo centralizado de errores. Toda respuesta de error de la API sale en
 * formato Problem Details (RFC 9457, {@code application/problem+json}):
 * {@code type}, {@code title}, {@code status}, {@code detail} e {@code instance}.
 * El frontend muestra {@code detail}; los errores de validación añaden
 * {@code fields} con el mensaje de cada campo.
 *
 * <p>Las excepciones propias de Spring MVC (ruta inexistente, método no
 * soportado, JSON mal formado, archivo demasiado grande...) las resuelve
 * {@link ResponseEntityExceptionHandler}; sus textos en español están en
 * {@code messages.properties}. Los rechazos de Spring Security y del primer
 * ingreso llegan aquí desde los filtros de seguridad.
 *
 * <p>Nunca se envían trazas al cliente: van al log del servidor.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ProblemDetail handleBadCredentials() {
        // Mismo mensaje para usuario inexistente y contraseña incorrecta:
        // distinguirlos permitiría enumerar cuentas.
        return problem(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleUnauthenticated() {
        return problem(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para acceder a este recurso");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied() {
        return problem(HttpStatus.FORBIDDEN, "No tienes permiso para realizar esta acción");
    }

    /** Regla de negocio sobre roles: a diferencia del 403 genérico, explica el motivo. */
    @ExceptionHandler(ForbiddenActionException.class)
    public ProblemDetail handleForbiddenAction(ForbiddenActionException ex) {
        return problem(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    /** Primer ingreso sin completar: el cliente lleva a la persona a resolver {@code pendingSteps}. */
    @ExceptionHandler(OnboardingRequiredException.class)
    public ProblemDetail handleOnboardingRequired(OnboardingRequiredException ex) {
        ProblemDetail body = problem(HttpStatus.FORBIDDEN, ex.getMessage());
        body.setProperty("pendingSteps", ex.getPendingSteps());
        return body;
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ProblemDetail handleNotFound(NoSuchElementException ex) {
        return problem(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflict(ConflictException ex) {
        return problem(HttpStatus.CONFLICT, ex.getMessage());
    }

    /** Violación de una restricción de la BD (p. ej. un nombre de catálogo repetido). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Conflicto de integridad: {}", ex.getMostSpecificCause().getMessage());
        return problem(HttpStatus.CONFLICT, "Ya existe un registro con esos datos");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        return problem(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Validación por campo hecha en el servicio: mismo formato que la de Bean Validation. */
    @ExceptionHandler(InvalidFieldsException.class)
    public ProblemDetail handleInvalidFields(InvalidFieldsException ex) {
        return invalidFields(HttpStatus.BAD_REQUEST, ex.getFields());
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex, WebRequest request) {
        log.error("Error no controlado en {}", request.getDescription(false), ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor");
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return handleExceptionInternal(ex, invalidFields(status, fields), headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, "El cuerpo de la petición no es un JSON válido");
        return handleExceptionInternal(ex, body, headers, status, request);
    }

    private static ProblemDetail invalidFields(HttpStatusCode status, Map<String, String> fields) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, "Datos inválidos");
        body.setProperty("fields", fields);
        return body;
    }

    private static ProblemDetail problem(HttpStatus status, String detail) {
        return ProblemDetail.forStatusAndDetail(status, detail);
    }
}
