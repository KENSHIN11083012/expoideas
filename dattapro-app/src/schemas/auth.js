import { z } from 'zod';
import { CORREO_INSTITUCIONAL_REGEX, DOMINIO_INSTITUCIONAL, PASSWORD_MENSAJE, PASSWORD_REGEX } from '@/utils/validaciones';

export const loginSchema = z.object({
    email: z.string().trim().min(1, 'Ingresa tu correo institucional'),
    password: z.string().min(1, 'Ingresa tu contraseña'),
});

export const registroSchema = z
    .object({
        nombres: z.string().trim().min(1, 'Ingresa tus nombres').max(100, 'Máximo 100 caracteres'),
        apellidos: z.string().trim().min(1, 'Ingresa tus apellidos').max(100, 'Máximo 100 caracteres'),
        correoInstitucional: z
            .string()
            .trim()
            .min(1, 'Ingresa tu correo institucional')
            .max(150, 'Máximo 150 caracteres')
            .regex(CORREO_INSTITUCIONAL_REGEX, `Usa tu correo institucional (${DOMINIO_INSTITUCIONAL})`),
        password: z.string().regex(PASSWORD_REGEX, PASSWORD_MENSAJE),
        confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
        autorizaDatos: z.boolean().refine((valor) => valor === true, {
            message: 'Debes autorizar el tratamiento de tus datos para crear la cuenta',
        }),
    })
    .refine((datos) => datos.password === datos.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });
