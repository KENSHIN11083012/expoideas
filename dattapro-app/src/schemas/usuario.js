import { z } from 'zod';
import { PASSWORD_MENSAJE, PASSWORD_REGEX } from '@/utils/validaciones';

export const perfilSchema = z.object({
    nombres: z.string().trim().min(1, 'Ingresa tus nombres').max(100, 'Máximo 100 caracteres'),
    apellidos: z.string().trim().min(1, 'Ingresa tus apellidos').max(100, 'Máximo 100 caracteres'),
});

const passwordNuevaConConfirmacion = {
    passwordNueva: z.string().regex(PASSWORD_REGEX, PASSWORD_MENSAJE),
    confirmacionPassword: z.string().min(1, 'Confirma la nueva contraseña'),
};

const coinciden = (datos) => datos.passwordNueva === datos.confirmacionPassword;
const errorCoinciden = { message: 'Las contraseñas no coinciden', path: ['confirmacionPassword'] };

/** Cambio de la propia contraseña: exige la actual. */
export const cambioPasswordSchema = z
    .object({
        passwordActual: z.string().min(1, 'Ingresa tu contraseña actual'),
        ...passwordNuevaConConfirmacion,
    })
    .refine(coinciden, errorCoinciden)
    .refine((datos) => datos.passwordNueva !== datos.passwordActual, {
        message: 'La nueva contraseña debe ser distinta de la actual',
        path: ['passwordNueva'],
    });

/** Restablecimiento por un administrador: sin la actual. */
export const resetPasswordSchema = z.object(passwordNuevaConConfirmacion).refine(coinciden, errorCoinciden);
