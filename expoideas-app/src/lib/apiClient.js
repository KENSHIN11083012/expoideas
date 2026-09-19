import { session } from '@/lib/session';

/**
 * Cliente HTTP único de la app: arma las cabeceras, adjunta el token de la
 * sesión y traduce los errores de la API a mensajes para el usuario.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/** Se dispara cuando la API responde 401: AuthProvider lo escucha y cierra la sesión. */
export const UNAUTHORIZED_EVENT = 'expoideas:unauthorized';

/**
 * Se dispara cuando la API responde 403 porque la cuenta tiene pasos de primer
 * ingreso sin completar; el detalle trae la lista. AuthProvider la guarda y las
 * rutas protegidas llevan al primer ingreso.
 */
export const ONBOARDING_REQUIRED_EVENT = 'expoideas:onboarding-required';

const MESSAGES_BY_STATUS = {
    400: 'Los datos enviados no son válidos.',
    401: 'Tu sesión expiró. Inicia sesión nuevamente.',
    403: 'No tienes permiso para realizar esta acción.',
    404: 'El recurso no fue encontrado.',
    409: 'El recurso ya existe.',
    413: 'El archivo supera el tamaño máximo permitido de 5 MB.',
};

/**
 * Los errores de la API vienen en formato Problem Details (RFC 9457): el texto
 * para el usuario está en `detail`, y en los 400 de validación `fields` trae el
 * mensaje de cada campo (ver applyServerErrors en lib/validation.js).
 */
const errorMessage = (status, body) =>
    body?.detail ||
    MESSAGES_BY_STATUS[status] ||
    (status >= 500 ? 'Error del servidor. Intenta nuevamente más tarde.' : `Error inesperado (${status}).`);

/** application/json y también application/problem+json, el tipo de los errores. */
const isJson = (contentType) => /application\/([\w.-]+\+)?json/.test(contentType);

const parseBody = async (response) => {
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!isJson(contentType)) return null;
    return response.json().catch(() => null);
};

/**
 * @param {string} path  ruta relativa a la API, p. ej. '/users/me'
 * @param {object} options  method, body (objeto plano o FormData) y auth (por defecto true)
 * @throws {Error} con .status y, si lo hubo, .body
 */
export const request = async (path, { method = 'GET', body, auth = true } = {}) => {
    const token = auth ? session.token() : null;
    // Con FormData (archivos) el navegador arma el Content-Type multipart con su boundary.
    const isForm = body instanceof FormData;

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                Accept: 'application/json',
                ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...(body !== undefined ? { body: isForm ? body : JSON.stringify(body) } : {}),
        });
    } catch {
        const networkError = new Error('Error de red. Verifica tu conexión.');
        networkError.status = 0;
        throw networkError;
    }

    const responseBody = await parseBody(response);

    if (!response.ok) {
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
        }
        const pendingSteps = responseBody?.pendingSteps;
        if (response.status === 403 && Array.isArray(pendingSteps) && pendingSteps.length > 0) {
            window.dispatchEvent(new CustomEvent(ONBOARDING_REQUIRED_EVENT, { detail: pendingSteps }));
        }
        const error = new Error(errorMessage(response.status, responseBody));
        error.status = response.status;
        error.body = responseBody;
        throw error;
    }

    return responseBody;
};

export const get = (path, options) => request(path, { ...options, method: 'GET' });
export const post = (path, body, options) => request(path, { ...options, method: 'POST', body });
export const put = (path, body, options) => request(path, { ...options, method: 'PUT', body });
export const del = (path, options) => request(path, { ...options, method: 'DELETE' });
