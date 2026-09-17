/**
 * Reglas de validacion compartidas por los esquemas de src/schemas.
 *
 * Son las mismas que aplica la API (dto/Validaciones.java): si cambian alli,
 * hay que cambiarlas aqui.
 */

/** 8 a 100 caracteres, con al menos un numero y un simbolo. */
export const PASSWORD_REGEX = /^(?=.*\d)(?=.*[\W_]).{8,100}$/;
/** Corto a propósito: RequisitosPassword ya muestra el detalle bajo el campo. */
export const PASSWORD_MENSAJE = 'La contraseña no cumple los requisitos';

/** Requisitos de la contraseña, para mostrarlos como lista mientras se escribe. */
export const REQUISITOS_PASSWORD = [
    { texto: 'Entre 8 y 100 caracteres', cumple: (v) => v.length >= 8 && v.length <= 100 },
    { texto: 'Al menos un número', cumple: (v) => /\d/.test(v) },
    { texto: 'Al menos un símbolo', cumple: (v) => /[\W_]/.test(v) },
];

export const DOMINIO_INSTITUCIONAL = '@unisimon.edu.co';
export const CORREO_INSTITUCIONAL_REGEX = /^[^@\s]+@unisimon\.edu\.co$/i;

/**
 * Lleva los errores por campo de un 400 de la API ({ campos: {...} }) a
 * react-hook-form, para mostrarlos junto a cada campo.
 *
 * @param {Error & { body?: { campos?: Record<string, string> } }} error
 * @param {(campo: string, error: { type: string, message: string }) => void} setError
 * @param {Record<string, string>} [equivalencias] nombre en la API -> nombre en el formulario
 * @returns {boolean} true si había errores por campo
 */
export const aplicarErroresDelServidor = (error, setError, equivalencias = {}) => {
    const campos = error?.body?.campos;
    if (!campos || typeof campos !== 'object') return false;

    const entradas = Object.entries(campos).filter(([, mensaje]) => Boolean(mensaje));
    entradas.forEach(([campo, message], indice) => {
        setError(equivalencias[campo] ?? campo, { type: 'server', message }, { shouldFocus: indice === 0 });
    });
    return entradas.length > 0;
};
