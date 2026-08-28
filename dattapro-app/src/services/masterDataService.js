import { API_BASE_URL } from '../config/api';

/**
 * Returns standard auth + content-type headers using the existing token pattern.
 */
const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '')}`,
});

/**
 * Maps HTTP status codes to user-friendly Spanish messages.
 */
const getErrorMessage = (status) => {
    switch (status) {
        case 401: return 'Sesión expirada. Por favor inicia sesión nuevamente.';
        case 403: return 'No tienes permiso para realizar esta acción.';
        case 404: return 'El recurso no fue encontrado.';
        default:  return status >= 500
            ? 'Error del servidor. Intenta nuevamente más tarde.'
            : `Error inesperado (${status}).`;
    }
};

/**
 * Handles a fetch Response: parses JSON on success, throws typed error on failure.
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        const message = getErrorMessage(response.status);
        const err = new Error(message);
        err.status = response.status;
        throw err;
    }
    // Some PUT endpoints may return 204 No Content
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    return null;
};

/**
 * GET all records for a catalog.
 * @param {string} endpoint  e.g. 'tipos-vinculacion'
 */
export const getAll = async (endpoint) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            headers: authHeaders(),
        });
        return handleResponse(response);
    } catch (err) {
        if (err.status) throw err;
        const networkErr = new Error('Error de red. Verifica tu conexión.');
        networkErr.status = 0;
        throw networkErr;
    }
};

/**
 * POST a new record to a catalog.
 * @param {string} endpoint  e.g. 'tipos-vinculacion'
 * @param {object} body      e.g. { nombre } or { nombre, subtitulo }
 */
export const create = async (endpoint, body) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    } catch (err) {
        if (err.status !== undefined) throw err;
        const networkErr = new Error('Error de red. Verifica tu conexión.');
        networkErr.status = 0;
        throw networkErr;
    }
};

/**
 * PUT (update) an existing record in a catalog.
 * @param {string} endpoint  e.g. 'tipos-vinculacion'
 * @param {number} id        Backend-generated numeric ID
 * @param {object} body      e.g. { nombre } or { nombre, subtitulo }
 */
export const update = async (endpoint, id, body) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    } catch (err) {
        if (err.status !== undefined) throw err;
        const networkErr = new Error('Error de red. Verifica tu conexión.');
        networkErr.status = 0;
        throw networkErr;
    }
};
