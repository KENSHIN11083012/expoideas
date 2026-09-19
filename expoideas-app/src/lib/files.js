import { API_BASE_URL } from '@/lib/apiClient';

/**
 * Archivos de la plataforma. Las mismas reglas las aplica la API (FileService y
 * FileFormat): aquí solo evitan subir algo que se va a rechazar. La API decide
 * por el contenido real; el navegador solo ve el tipo declarado.
 */

/** Nombre de la parte multipart del archivo en las subidas. */
export const FILE_PART = 'file';

/** Límite de TI por archivo. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** URL para mostrar o descargar un archivo por su identificador; null si no hay. */
export const fileUrl = (id) => (id ? `${API_BASE_URL}/files/${encodeURIComponent(id)}` : null);

/** Mensaje de error si la imagen no se puede subir, o null si parece válida. */
export const validateImage = (file) => {
    if (!file) return 'Elige una imagen.';
    if (!IMAGE_TYPES.includes(file.type)) return 'Formato no permitido. Usa un archivo JPG, PNG o WEBP.';
    if (file.size === 0) return 'El archivo está vacío.';
    if (file.size > MAX_FILE_BYTES) return 'El archivo supera el tamaño máximo permitido de 5 MB.';
    return null;
};
