import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { PRIMER_INGRESO_EVENT, request } from '@/services/apiClient';

/** JWT sin firma verificable, suficiente para jwtDecode: rol y vencimiento en una hora. */
const tokenDe = (role) => {
    const codificar = (objeto) => btoa(JSON.stringify(objeto)).replace(/=+$/, '');
    return `${codificar({ alg: 'HS256' })}.${codificar({ sub: 'marta@empresa.com', role, exp: Date.now() / 1000 + 3600 })}.firma`;
};

/** Última sesión que vio el consumidor, para llamar a login/completarPendiente desde la prueba. */
const sesion = { actual: null };
function Consumidor() {
    const auth = useAuth();
    useEffect(() => {
        sesion.actual = auth;
    });
    return <p>{auth.pendientes.join(',') || 'sin pendientes'}</p>;
}

const renderSesion = () =>
    render(
        <AuthProvider>
            <Consumidor />
        </AuthProvider>,
    );

afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
});

describe('Pendientes de primer ingreso en la sesión', () => {
    it('el login los guarda y completarlos los quita, también de localStorage', () => {
        renderSesion();

        act(() => sesion.actual.login(tokenDe(['ROLE_JURADO']), { email: 'marta@empresa.com' }, ['cambiarPassword', 'autorizarDatos']));
        expect(screen.getByText('cambiarPassword,autorizarDatos')).toBeInTheDocument();
        expect(JSON.parse(localStorage.getItem('pendientes'))).toEqual(['cambiarPassword', 'autorizarDatos']);

        act(() => sesion.actual.completarPendiente('cambiarPassword'));
        expect(screen.getByText('autorizarDatos')).toBeInTheDocument();

        act(() => sesion.actual.completarPendiente('autorizarDatos'));
        expect(screen.getByText('sin pendientes')).toBeInTheDocument();
        expect(localStorage.getItem('pendientes')).toBeNull();
    });

    it('sobreviven a recargar la página', () => {
        localStorage.setItem('token', tokenDe(['ROLE_JURADO']));
        localStorage.setItem('pendientes', JSON.stringify(['autorizarDatos']));

        renderSesion();

        expect(screen.getByText('autorizarDatos')).toBeInTheDocument();
    });

    it('un 403 de la API por primer ingreso los actualiza aunque la sesión ya estuviera al día', async () => {
        renderSesion();
        act(() => sesion.actual.login(tokenDe(['ROLE_MACONDOLAB']), { email: 'carla@unisimon.edu.co' }, []));
        expect(screen.getByText('sin pendientes')).toBeInTheDocument();

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            headers: { get: () => 'application/problem+json' },
            json: async () => ({ detail: 'Antes de continuar, completa tu primer ingreso.', pendientes: ['cambiarPassword'] }),
        }));

        await act(async () => {
            await expect(request('/admin/users')).rejects.toMatchObject({ status: 403 });
        });

        expect(screen.getByText('cambiarPassword')).toBeInTheDocument();
    });

    it('un 403 por falta de rol no toca los pendientes', async () => {
        const escucha = vi.fn();
        window.addEventListener(PRIMER_INGRESO_EVENT, escucha);
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            headers: { get: () => 'application/problem+json' },
            json: async () => ({ detail: 'No tienes permiso para realizar esta acción' }),
        }));

        await expect(request('/admin/users')).rejects.toThrow('No tienes permiso para realizar esta acción');

        expect(escucha).not.toHaveBeenCalled();
        window.removeEventListener(PRIMER_INGRESO_EVENT, escucha);
    });

    it('cerrar sesión los borra', () => {
        renderSesion();
        act(() => sesion.actual.login(tokenDe(['ROLE_JURADO']), {}, ['autorizarDatos']));

        act(() => sesion.actual.logout());

        expect(screen.getByText('sin pendientes')).toBeInTheDocument();
        expect(localStorage.getItem('pendientes')).toBeNull();
    });
});
