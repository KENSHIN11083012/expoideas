import { z } from 'zod';

/** Qué archivos acepta un entregable. Espejo de DeliverableKind en la API. */
export const KINDS = {
    DOCUMENT: 'DOCUMENT',
    IMAGE: 'IMAGE',
    ANY: 'ANY',
};

const KIND_LABELS = {
    [KINDS.DOCUMENT]: 'PDF',
    [KINDS.IMAGE]: 'Imagen (JPG, PNG o WEBP)',
    [KINDS.ANY]: 'PDF o imagen',
};

/** Lo que el navegador ofrece en el selector de archivos. */
export const KIND_ACCEPT = {
    [KINDS.DOCUMENT]: 'application/pdf',
    [KINDS.IMAGE]: 'image/jpeg,image/png,image/webp',
    [KINDS.ANY]: 'application/pdf,image/jpeg,image/png,image/webp',
};

export const kindLabel = (kind) => KIND_LABELS[kind] ?? kind;

/** Entregable de una cátedra (DeliverableTypeRequest). */
export const deliverableTypeSchema = z.object({
    name: z.string().trim().min(1, 'Ingresa el nombre del entregable').max(100, 'Máximo 100 caracteres'),
    description: z.string().trim().max(300, 'Máximo 300 caracteres'),
    kind: z.string().min(1, 'Indica qué archivos se aceptan'),
    required: z.boolean(),
    maxFiles: z
        .string()
        .trim()
        .min(1, 'Ingresa cuántos archivos se aceptan')
        .pipe(z.coerce.number().int('Usa un número entero').min(1, 'Mínimo 1').max(10, 'Máximo 10')),
});

export const toTypeRequest = (values, editionId, track) => ({
    editionId,
    track,
    name: values.name,
    description: values.description || null,
    kind: values.kind,
    required: values.required,
    maxFiles: values.maxFiles,
    sortOrder: values.sortOrder ?? 0,
});

export const toTypeFormValues = (type) => ({
    name: type?.name ?? '',
    description: type?.description ?? '',
    kind: type?.kind ?? KINDS.DOCUMENT,
    required: type?.required ?? true,
    maxFiles: type ? String(type.maxFiles) : '1',
    sortOrder: type?.sortOrder ?? 0,
});
