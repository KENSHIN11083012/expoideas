import { API_BASE_URL } from '@/config/api';

/**
 * Archivos de la plataforma. Las mismas reglas las aplica la API
 * (ArchivoService y FormatoArchivo): aquí solo evitan subir algo que se va a
 * rechazar. La API decide por el contenido real; el navegador solo ve el tipo
 * declarado.
 */

/** Límite de TI por archivo. */
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

/** URL para mostrar o descargar un archivo por su identificador; null si no hay. */
export const urlDeArchivo = (id) => (id ? `${API_BASE_URL}/archivos/${encodeURIComponent(id)}` : null);

/** Mensaje de error si la imagen no se puede subir, o null si parece válida. */
export const validarImagen = (archivo) => {
    if (!archivo) return 'Elige una imagen.';
    if (!TIPOS_IMAGEN.includes(archivo.type)) return 'Formato no permitido. Usa un archivo JPG, PNG o WEBP.';
    if (archivo.size === 0) return 'El archivo está vacío.';
    if (archivo.size > TAMANO_MAXIMO_BYTES) return 'El archivo supera el tamaño máximo permitido de 5 MB';
    return null;
};
