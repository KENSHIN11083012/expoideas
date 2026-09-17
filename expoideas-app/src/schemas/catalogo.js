import { z } from 'zod';

/** Sedes, facultades, categorías y keywords (CatalogoRequestDTO). */
export const catalogoSchema = z.object({
    nombre: z.string().trim().min(1, 'Ingresa un nombre').max(100, 'Máximo 100 caracteres'),
});

/** Programas académicos (ProgramaAcademicoRequestDTO): el select entrega el id como texto. */
export const programaSchema = z.object({
    nombre: z.string().trim().min(1, 'Ingresa un nombre').max(150, 'Máximo 150 caracteres'),
    facultadId: z.string().min(1, 'Selecciona la facultad a la que pertenece'),
});
