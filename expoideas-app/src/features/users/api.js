import { del, get, post, put } from '@/lib/apiClient';
import { FILE_PART } from '@/lib/files';

/** Gestión de cuentas (MacondoLab y administradores). */
export const usersApi = {
    list: () => get('/admin/users'),
    create: (body) => post('/admin/users', body),
    /** Rol y adscripción. */
    update: (id, body) => put(`/admin/users/${id}`, body),
    resetPassword: (id, body) => post(`/admin/users/${id}/password-reset`, body),
    remove: (id) => del(`/admin/users/${id}`),
    /** Aprobaciones de cátedra: las que nacen de un proyecto y las manuales. */
    listApprovals: (userId) => get(`/admin/track-approvals?userId=${userId}`),
    createApproval: (body) => post('/admin/track-approvals', body),
    removeApproval: (id) => del(`/admin/track-approvals/${id}`),
    /** Listado de la cátedra: quién se registra con qué rol. */
    listRoster: () => get('/admin/roster'),
    importRoster: (file) => {
        const body = new FormData();
        body.append(FILE_PART, file);
        return post('/admin/roster', body);
    },
    removeRosterEntry: (id) => del(`/admin/roster/${id}`),
    clearRoster: () => del('/admin/roster'),
};
