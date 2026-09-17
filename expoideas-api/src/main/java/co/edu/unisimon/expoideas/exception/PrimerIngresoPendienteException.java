package co.edu.unisimon.expoideas.exception;

import co.edu.unisimon.expoideas.entity.PendienteDeIngreso;

import java.util.List;

/**
 * La cuenta tiene pasos de primer ingreso sin completar y pidió algo distinto de
 * resolverlos. GlobalExceptionHandler la traduce a 403 con {@code pendientes}.
 */
public class PrimerIngresoPendienteException extends RuntimeException {

    private final List<PendienteDeIngreso> pendientes;

    public PrimerIngresoPendienteException(List<PendienteDeIngreso> pendientes) {
        super("Antes de continuar, completa tu primer ingreso.");
        this.pendientes = List.copyOf(pendientes);
    }

    public List<PendienteDeIngreso> getPendientes() {
        return pendientes;
    }
}
