package com.dattapro.dattapro_api.dto;

/**
 * Reglas de validacion compartidas por los DTOs.
 *
 * <p>El frontend aplica las mismas reglas (Register y CambioPasswordView): si
 * cambian aqui, hay que cambiarlas alli.
 */
public final class Validaciones {

    /** 8 a 100 caracteres, con al menos un numero y un simbolo. */
    public static final String PASSWORD_REGEX = "^(?=.*\\d)(?=.*[\\W_]).{8,100}$";
    public static final String PASSWORD_MENSAJE =
            "La contraseña debe tener entre 8 y 100 caracteres, incluyendo números y símbolos";

    public static final String CORREO_INSTITUCIONAL_REGEX = "^[^@\\s]+@unisimon\\.edu\\.co$";
    public static final String CORREO_INSTITUCIONAL_MENSAJE = "El correo debe terminar en @unisimon.edu.co";

    private Validaciones() {
    }
}
