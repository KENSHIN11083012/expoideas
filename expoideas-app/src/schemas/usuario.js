import { z } from 'zod';
import { CORREO_INSTITUCIONAL_REGEX, DOMINIO_INSTITUCIONAL, PASSWORD_MENSAJE, PASSWORD_REGEX } from '@/utils/validaciones';
import { ROLES, requiereAdscripcion } from '@/utils/roles';
import { adscripcionShape } from './adscripcion';

/** Lo que cualquier rol edita de sí mismo. */
export const datosPersonalesSchema = z.object({
    nombres: z.string().trim().min(1, 'Ingresa tus nombres').max(100, 'Máximo 100 caracteres'),
    apellidos: z.string().trim().min(1, 'Ingresa tus apellidos').max(100, 'Máximo 100 caracteres'),
});

/** Perfil de los roles con adscripción académica (docentes y estudiantes). */
export const perfilSchema = datosPersonalesSchema.extend(adscripcionShape);

/**
 * Alta de una cuenta desde la gestión. Las reglas dependen del rol elegido, como
 * en la API: correo externo solo para jurados y adscripción solo para docentes y
 * estudiantes.
 */
export const nuevaCuentaSchemaPara = (rol) =>
    z.object({
        rol: z.string().min(1, 'Selecciona el rol'),
        nombres: z.string().trim().min(1, 'Ingresa los nombres').max(100, 'Máximo 100 caracteres'),
        apellidos: z.string().trim().min(1, 'Ingresa los apellidos').max(100, 'Máximo 100 caracteres'),
        correoInstitucional:
            rol === ROLES.JURADO
                ? z.string().trim().min(1, 'Ingresa el correo').max(150, 'Máximo 150 caracteres').pipe(z.email('Ingresa un correo válido'))
                : z
                    .string()
                    .trim()
                    .min(1, 'Ingresa el correo')
                    .max(150, 'Máximo 150 caracteres')
                    .regex(CORREO_INSTITUCIONAL_REGEX, `Usa un correo ${DOMINIO_INSTITUCIONAL}; solo los jurados pueden tener uno externo`),
        password: z.string().regex(PASSWORD_REGEX, PASSWORD_MENSAJE),
        ...(requiereAdscripcion(rol) ? adscripcionShape : {}),
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

/** Autorización de datos en el primer ingreso de una cuenta creada desde la gestión. */
export const autorizacionDatosSchema = z.object({
    autorizaDatos: z.boolean().refine((valor) => valor === true, {
        message: 'Debes autorizar el tratamiento de tus datos para usar la plataforma',
    }),
});

/** Restablecimiento por un administrador: sin la actual. */
export const resetPasswordSchema = z.object(passwordNuevaConConfirmacion).refine(coinciden, errorCoinciden);
