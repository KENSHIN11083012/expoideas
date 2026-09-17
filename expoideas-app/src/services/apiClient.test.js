import { afterEach, describe, expect, it, vi } from 'vitest';
import { put, request } from './apiClient';

const respuestaJson = (cuerpo, status = 200) => ({
    ok: status < 400,
    status,
    headers: { get: () => 'application/json' },
    json: async () => cuerpo,
});

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe('apiClient', () => {
    it('envía objetos como JSON con su Content-Type', async () => {
        const fetch = vi.fn().mockResolvedValue(respuestaJson({ id: 1 }));
        vi.stubGlobal('fetch', fetch);

        await put('/usuarios/me', { nombres: 'Ana' });

        const [, opciones] = fetch.mock.calls[0];
        expect(opciones.headers['Content-Type']).toBe('application/json');
        expect(opciones.body).toBe('{"nombres":"Ana"}');
    });

    it('envía archivos como FormData sin fijar Content-Type (el navegador pone el boundary)', async () => {
        const fetch = vi.fn().mockResolvedValue(respuestaJson({ fotoId: 'x' }));
        vi.stubGlobal('fetch', fetch);
        localStorage.setItem('token', 'abc');
        const formulario = new FormData();
        formulario.append('archivo', new File(['x'], 'yo.png', { type: 'image/png' }));

        await put('/usuarios/me/foto', formulario);

        const [, opciones] = fetch.mock.calls[0];
        expect(opciones.body).toBe(formulario);
        expect(opciones.headers).not.toHaveProperty('Content-Type');
        expect(opciones.headers.Authorization).toBe('Bearer abc');
    });

    it('un 413 llega con el mensaje de la API', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 413,
            headers: { get: () => 'application/problem+json' },
            json: async () => ({ detail: 'El archivo supera el tamaño máximo permitido de 5 MB' }),
        }));

        await expect(request('/usuarios/me/foto', { method: 'PUT', body: new FormData() }))
            .rejects.toMatchObject({ status: 413, message: 'El archivo supera el tamaño máximo permitido de 5 MB' });
    });
});
