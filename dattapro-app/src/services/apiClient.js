import { API_BASE_URL } from '../config/api';

/**
 * Cliente HTTP unico de la app.
 *
 * En Dattapro habia catorce archivos llamando a fetch() por su cuenta, cada uno
 * leyendo el token de localStorage y armando sus headers. Aqui esa logica vive
 * en un solo sitio, junto con el manejo de 401.
 */

const TOKEN_KEY = 'token';

/** El token guardado puede traer comillas o saltos de linea de versiones viejas. */
const readToken = () => (localStorage.getItem(TOKEN_KEY) || '').replace(/[\n\r"'\s]/g, '');

/** Se dispara cuando la API responde 401: AuthContext lo escucha y cierra sesion. */
export const UNAUTHORIZED_EVENT = 'expoideas:unauthorized';

const MENSAJES_POR_ESTADO = {
    400: 'Los datos enviados no son validos.',
    401: 'Tu sesion expiro. Inicia sesion nuevamente.',
    403: 'No tienes permiso para realizar esta accion.',
    404: 'El recurso no fue encontrado.',
    409: 'El recurso ya existe.',
};

const mensajeDeError = (status, cuerpo) =>
    cuerpo?.message
    || cuerpo?.error
    || MENSAJES_POR_ESTADO[status]
    || (status >= 500 ? 'Error del servidor. Intenta nuevamente mas tarde.' : `Error inesperado (${status}).`);

const parsearCuerpo = async (response) => {
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return response.json().catch(() => null);
};

/**
 * @param {string} path  ruta relativa a la API, p. ej. '/usuarios'
 * @param {object} options  method, body (objeto plano), auth (por defecto true)
 * @throws {Error} con .status y, si la hubo, .body
 */
export const request = async (path, { method = 'GET', body, auth = true, headers = {} } = {}) => {
    const token = auth ? readToken() : '';

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                Accept: 'application/json',
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
    } catch {
        const networkError = new Error('Error de red. Verifica tu conexion.');
        networkError.status = 0;
        throw networkError;
    }

    const cuerpo = await parsearCuerpo(response);

    if (!response.ok) {
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
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
