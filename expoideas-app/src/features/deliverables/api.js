import { del, get, post, put, request } from '@/lib/apiClient';

/** Entregables: lo que pide cada cátedra y lo que sube cada proyecto. */
const TYPES = '/deliverable-types';

export const deliverableApi = {
    listTypes: (editionId, track) => get(`${TYPES}?editionId=${editionId}&track=${track}`),
    createType: (body) => post(TYPES, body),
    updateType: (id, body) => put(`${TYPES}/${id}`, body),
    removeType: (id) => del(`${TYPES}/${id}`),

    listOfProject: (projectId) => get(`/projects/${projectId}/deliverables`),
    /** El navegador arma el multipart; el tipo de entregable va en la URL. */
    upload: (projectId, deliverableTypeId, file) => {
        const body = new FormData();
        body.append('file', file);
        return request(`/projects/${projectId}/deliverables?deliverableTypeId=${deliverableTypeId}`, {
            method: 'POST',
            body,
        });
    },
    remove: (projectId, deliverableId) => del(`/projects/${projectId}/deliverables/${deliverableId}`),
};
