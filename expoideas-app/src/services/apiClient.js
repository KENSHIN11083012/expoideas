import { API_BASE_URL } from '@/config/api';

/**
 * Cliente HTTP único de la app: arma las cabeceras, adjunta el token de la
 * sesión y traduce los errores de la API a mensajes para el usuario.
 */

const TOKEN_KEY = 'token';

/** Se dispara cuando la API responde 401: AuthProvider lo escucha y cierra la sesión. */
export const UNAUTHORIZED_EVENT = 'expoideas:unauthorized';

/**
 * Se dispara cuando la API responde 403 porque la cuenta tiene pasos de primer
 * ingreso sin completar; el detalle trae la lista. AuthProvider la guarda y las
 * rutas protegidas llevan a /primer-ingreso.
 */
export const PRIMER_INGRESO_EVENT = 'expoideas:primer-ingreso';

const MENSAJES_POR_ESTADO = {
    400: 'Los datos enviados no son válidos.',
    401: 'Tu sesión expiró. Inicia sesión nuevamente.',
    403: 'No tienes permiso para realizar esta acción.',
    404: 'El recurso no fue encontrado.',
    409: 'El recurso ya existe.',
    413: 'El archivo supera el tamaño máximo permitido de 5 MB.',
};

/**
 * Los errores de la API vienen en formato Problem Details (RFC 9457): el texto
 * para el usuario está en `detail`, y en los 400 de validación `campos` trae el
 * mensaje de cada campo (ver utils/validaciones.js).
 */
const mensajeDeError = (status, cuerpo) =>
    cuerpo?.detail
    || MENSAJES_POR_ESTADO[status]
    || (status >= 500 ? 'Error del servidor. Intenta nuevamente más tarde.' : `Error inesperado (${status}).`);

/** application/json y también application/problem+json, el tipo de los errores. */
const esJson = (contentType) => /application\/([\w.-]+\+)?json/.test(contentType);

const parsearCuerpo = async (response) => {
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!esJson(contentType)) return null;
    return response.json().catch(() => null);
};

/**
 * @param {string} path  ruta relativa a la API, p. ej. '/usuarios'
 * @param {object} options  method, body (objeto plano o FormData), auth (por defecto true)
 * @throws {Error} con .status y, si la hubo, .body
 */
export const request = async (path, { method = 'GET', body, auth = true } = {}) => {
    const token = auth ? localStorage.getItem(TOKEN_KEY) : null;
    // Con FormData (archivos) el navegador arma el Content-Type multipart con su boundary.
    const esFormulario = body instanceof FormData;

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                Accept: 'application/json',
                ...(body !== undefined && !esFormulario ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...(body !== undefined ? { body: esFormulario ? body : JSON.stringify(body) } : {}),
        });
    } catch {
        const networkError = new Error('Error de red. Verifica tu conexión.');
        networkError.status = 0;
        throw networkError;
    }

    const cuerpo = await parsearCuerpo(response);

    if (!response.ok) {
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
        }
        if (response.status === 403 && Array.isArray(cuerpo?.pendientes) && cuerpo.pendientes.length > 0) {
            window.dispatchEvent(new CustomEvent(PRIMER_INGRESO_EVENT, { detail: cuerpo.pendientes }));
        }
        const error = new Error(mensajeDeError(response.status, cuerpo));
        error.status = response.status;
        error.body = cuerpo;
        throw error;
    }

    return cuerpo;
};

export const get = (path, options) => request(path, { ...options, method: 'GET' });
export const post = (path, body, options) => request(path, { ...options, method: 'POST', body });
export const put = (path, body, options) => request(path, { ...options, method: 'PUT', body });
export const del = (path, options) => request(path, { ...options, method: 'DELETE' });
