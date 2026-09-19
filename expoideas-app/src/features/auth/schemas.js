import { z } from 'zod';
import { affiliationShape } from '@/lib/affiliation';
import { newPasswordShape, passwordsMatch, rules } from '@/lib/validation';

export const loginSchema = z.object({
    email: z.string().trim().min(1, 'Ingresa tu correo institucional'),
    password: z.string().min(1, 'Ingresa tu contraseña'),
});

export const registrationSchema = z
    .object({
        firstName: rules.firstName(),
        lastName: rules.lastName(),
        email: rules.institutionalEmail(),
        password: rules.password(),
        confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
        ...affiliationShape,
        dataConsent: rules.dataConsent('Debes autorizar el tratamiento de tus datos para crear la cuenta'),
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });

/** Cambio de la propia contraseña: exige la actual. */
export const passwordChangeSchema = z
    .object({
        currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
        ...newPasswordShape,
    })
    .refine(...passwordsMatch)
    .refine((values) => values.newPassword !== values.currentPassword, {
        message: 'La nueva contraseña debe ser distinta de la actual',
        path: ['newPassword'],
    });

/** Autorización de datos en el primer ingreso de una cuenta creada desde la gestión. */
export const dataConsentSchema = z.object({
    dataConsent: rules.dataConsent('Debes autorizar el tratamiento de tus datos para usar la plataforma'),
});
