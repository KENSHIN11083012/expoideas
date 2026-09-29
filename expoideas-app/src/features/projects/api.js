import { del, get, post, put } from '@/lib/apiClient';

/** Proyectos, equipo e invitaciones. Todo pide sesión. */
const PROJECTS = '/projects';
const INVITATIONS = '/invitations';

export const projectApi = {
    listMine: () => get(`${PROJECTS}/mine`),
    get: (id) => get(`${PROJECTS}/${id}`),
    create: (body) => post(PROJECTS, body),
    update: (id, body) => put(`${PROJECTS}/${id}`, body),
    remove: (id) => del(`${PROJECTS}/${id}`),
    invite: (id, email) => post(`${PROJECTS}/${id}/invitations`, { email }),
    removeMember: (id, userId) => del(`${PROJECTS}/${id}/members/${userId}`),
    listInvitations: () => get(INVITATIONS),
    acceptInvitation: (id) => post(`${INVITATIONS}/${id}/acceptance`),
    declineInvitation: (id) => post(`${INVITATIONS}/${id}/rejection`),
    listTeachers: () => get('/teachers'),
};
