/**
 * Reglas de validacion compartidas por los formularios.
 *
 * Son las mismas que aplica la API (dto/Validaciones.java): si cambian alli,
 * hay que cambiarlas aqui.
 */

/** 8 a 100 caracteres, con al menos un numero y un simbolo. */
export const PASSWORD_REGEX = /^(?=.*\d)(?=.*[\W_]).{8,100}$/;
export const PASSWORD_MENSAJE = 'La contraseña debe tener al menos 8 caracteres, incluyendo números y símbolos';

export const DOMINIO_INSTITUCIONAL = '@unisimon.edu.co';

/**
 * Une los errores por campo que devuelve la API en un 400 ({ campos: {...} })
 * en un solo mensaje. Devuelve null si no hay.
 */
export const mensajeDeCampos = (error) => {
    const campos = error?.body?.campos;
    if (!campos || typeof campos !== 'object') return null;
    const mensajes = Object.values(campos).filter(Boolean);
    return mensajes.length > 0 ? mensajes.join('. ') : null;
};
