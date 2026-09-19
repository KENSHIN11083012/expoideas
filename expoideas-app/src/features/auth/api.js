import { post, put } from '@/lib/apiClient';

export const authApi = {
    login: (credentials) => post('/auth/login', credentials, { auth: false }),
    register: (body) => post('/auth/register', body, { auth: false }),
};

/** Pasos del primer ingreso; también los usa la página de Seguridad. */
export const accountApi = {
    changePassword: (body) => put('/users/me/password', body),
    giveDataConsent: () => put('/users/me/data-consent', { dataConsent: true }),
};
