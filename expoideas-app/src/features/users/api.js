import { del, get, post, put } from '@/lib/apiClient';

/** Gestión de cuentas (MacondoLab y administradores). */
export const usersApi = {
    list: () => get('/admin/users'),
    create: (body) => post('/admin/users', body),
    /** Rol y adscripción. */
    update: (id, body) => put(`/admin/users/${id}`, body),
    resetPassword: (id, body) => post(`/admin/users/${id}/password-reset`, body),
    remove: (id) => del(`/admin/users/${id}`),
};
