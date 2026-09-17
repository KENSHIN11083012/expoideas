import { get, post, put } from './apiClient';

/**
 * CRUD generico de catalogos maestros sobre el apiClient.
 * @param {string} endpoint  p. ej. 'sedes'
 */
export const getAll = (endpoint) => get(`/${endpoint}`);

export const create = (endpoint, body) => post(`/${endpoint}`, body);

export const update = (endpoint, id, body) => put(`/${endpoint}/${id}`, body);
