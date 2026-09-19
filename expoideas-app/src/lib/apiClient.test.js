import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/utils';
import { ONBOARDING_REQUIRED_EVENT, UNAUTHORIZED_EVENT, put, request } from './apiClient';

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
});

const listen = (eventName) => {
    const listener = vi.fn();
    window.addEventListener(eventName, listener);
    return { listener, stop: () => window.removeEventListener(eventName, listener) };
};

describe('apiClient', () => {
    it('envía objetos como JSON con su Content-Type y el token de la sesión', async () => {
        const fetch = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }));
        vi.stubGlobal('fetch', fetch);
        localStorage.setItem('token', 'abc');

        await put('/users/me', { firstName: 'Ana' });

        const [, options] = fetch.mock.calls[0];
        expect(options.headers['Content-Type']).toBe('application/json');
        expect(options.headers.Authorization).toBe('Bearer abc');
        expect(options.body).toBe('{"firstName":"Ana"}');
    });

    it('envía archivos como FormData sin fijar Content-Type (el navegador pone el boundary)', async () => {
        const fetch = vi.fn().mockResolvedValue(jsonResponse({ photoId: 'x' }));
        vi.stubGlobal('fetch', fetch);
        const form = new FormData();
        form.append('file', new File(['x'], 'yo.png', { type: 'image/png' }));

        await put('/users/me/photo', form);

        const [, options] = fetch.mock.calls[0];
        expect(options.body).toBe(form);
        expect(options.headers).not.toHaveProperty('Content-Type');
    });

    it('un error trae el mensaje de la API, su estado y el cuerpo', async () => {
        const body = { detail: 'Datos inválidos', fields: { email: 'El correo debe terminar en @unisimon.edu.co' } };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body, 400, 'application/problem+json')));

        await expect(request('/auth/register', { method: 'POST', body: {} })).rejects.toMatchObject({
            status: 400,
            message: 'Datos inválidos',
            body,
        });
    });

    it('sin detalle usa un mensaje según el estado', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 413, headers: { get: () => 'text/html' } }));

        await expect(request('/users/me/photo')).rejects.toMatchObject({
            status: 413,
            message: 'El archivo supera el tamaño máximo permitido de 5 MB.',
        });
    });

    it('sin red lanza un error con estado 0', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

        await expect(request('/users/me')).rejects.toMatchObject({ status: 0, message: 'Error de red. Verifica tu conexión.' });
    });

    it('un 401 avisa para cerrar la sesión', async () => {
        const { listener, stop } = listen(UNAUTHORIZED_EVENT);
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Debes iniciar sesión' }, 401)));

        await expect(request('/users/me')).rejects.toMatchObject({ status: 401 });

        expect(listener).toHaveBeenCalledTimes(1);
        stop();
    });

    it('un 403 por primer ingreso avisa con los pasos pendientes', async () => {
        const { listener, stop } = listen(ONBOARDING_REQUIRED_EVENT);
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(
            { detail: 'Antes de continuar, completa tu primer ingreso.', pendingSteps: ['CHANGE_PASSWORD'] },
            403,
        )));

        await expect(request('/admin/users')).rejects.toMatchObject({ status: 403 });

        expect(listener.mock.calls[0][0].detail).toEqual(['CHANGE_PASSWORD']);
        stop();
    });

    it('un 403 por falta de rol no toca el primer ingreso', async () => {
        const { listener, stop } = listen(ONBOARDING_REQUIRED_EVENT);
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'No tienes permiso para realizar esta acción' }, 403)));

        await expect(request('/admin/users')).rejects.toThrow('No tienes permiso para realizar esta acción');

        expect(listener).not.toHaveBeenCalled();
        stop();
    });
});
