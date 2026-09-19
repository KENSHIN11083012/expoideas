import { z } from 'zod';

/**
 * Reglas de validación compartidas por los formularios. Son las mismas que
 * aplica la API (ValidationPatterns): si cambian allá, hay que cambiarlas aquí.
 */

/** 8 a 100 caracteres, con al menos un número y un símbolo. */
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[\W_]).{8,100}$/;

/** Corto a propósito: PasswordRequirements ya muestra el detalle bajo el campo. */
const PASSWORD_MESSAGE = 'La contraseña no cumple los requisitos';

/** Requisitos de la contraseña, para mostrarlos como lista mientras se escribe. */
export const PASSWORD_REQUIREMENTS = [
    { text: 'Entre 8 y 100 caracteres', met: (value) => value.length >= 8 && value.length <= 100 },
    { text: 'Al menos un número', met: (value) => /\d/.test(value) },
    { text: 'Al menos un símbolo', met: (value) => /[\W_]/.test(value) },
];

export const INSTITUTIONAL_DOMAIN = '@unisimon.edu.co';
const INSTITUTIONAL_EMAIL_REGEX = /^[^@\s]+@unisimon\.edu\.co$/i;

// ── Reglas zod reutilizables ─────────────────────────────────────────────

const name = (missing) => z.string().trim().min(1, missing).max(100, 'Máximo 100 caracteres');

export const rules = {
    firstName: (missing = 'Ingresa tus nombres') => name(missing),
    lastName: (missing = 'Ingresa tus apellidos') => name(missing),
    /** Correo @unisimon.edu.co, recortando espacios. */
    institutionalEmail: (
        message = `Usa tu correo institucional (${INSTITUTIONAL_DOMAIN})`,
        missing = 'Ingresa tu correo institucional',
    ) => z.string().trim().min(1, missing).max(150, 'Máximo 150 caracteres').regex(INSTITUTIONAL_EMAIL_REGEX, message),
    /** Cualquier correo válido (jurados externos). */
    anyEmail: () =>
        z.string().trim().min(1, 'Ingresa el correo').max(150, 'Máximo 150 caracteres').pipe(z.email('Ingresa un correo válido')),
    password: () => z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE),
    dataConsent: (message) => z.boolean().refine((value) => value === true, { message }),
};

/** Contraseña nueva con su confirmación; añade el refine `passwordsMatch` al objeto. */
export const newPasswordShape = {
    newPassword: rules.password(),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
};

export const passwordsMatch = [
    (values) => values.newPassword === values.confirmPassword,
    { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] },
];

// ── Errores de la API ────────────────────────────────────────────────────

/**
 * Lleva los errores por campo de un 400 de la API ({ fields: {...} }) a
 * react-hook-form, para mostrarlos junto a cada campo. Los formularios usan los
 * mismos nombres de campo que la API.
 *
 * @param {Error & { body?: { fields?: Record<string, string> } }} error
 * @param {(field: string, error: { type: string, message: string }, options?: object) => void} setError
 * @returns {boolean} true si había errores por campo
 */
export const applyServerErrors = (error, setError) => {
    const fields = error?.body?.fields;
    if (!fields || typeof fields !== 'object') return false;

    const entries = Object.entries(fields).filter(([, message]) => Boolean(message));
    entries.forEach(([field, message], index) => {
        setError(field, { type: 'server', message }, { shouldFocus: index === 0 });
    });
    return entries.length > 0;
};

/**
 * Manejo estándar del error de un formulario: errores por campo junto a cada
 * campo; el resto, como error general (errors.root).
 */
export const handleFormError = (error, setError) => {
    if (!applyServerErrors(error, setError)) {
        setError('root', { type: 'server', message: error.message });
    }
};
