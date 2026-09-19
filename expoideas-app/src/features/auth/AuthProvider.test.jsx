import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { request } from '@/lib/apiClient';
import { createTestQueryClient, fakeJwt, jsonResponse } from '@/test/utils';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

/** Última sesión que vio el consumidor, para llamar a login/completeStep desde la prueba. */
const session = { current: null };
function Consumer() {
    const auth = useAuth();
    useEffect(() => {
        session.current = auth;
    });
    return <p>{auth.pendingSteps.join(',') || 'sin pendientes'}</p>;
}

const renderSession = () => {
    const queryClient = createTestQueryClient();
    render(
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Consumer />
            </AuthProvider>
        </QueryClientProvider>,
    );
    return queryClient;
};

afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
});

describe('Pasos de primer ingreso en la sesión', () => {
    it('el login los guarda y completarlos los quita, también de localStorage', () => {
        renderSession();

        act(() => session.current.login(fakeJwt('JUDGE'), { email: 'marta@empresa.com' }, ['CHANGE_PASSWORD', 'DATA_CONSENT']));
        expect(screen.getByText('CHANGE_PASSWORD,DATA_CONSENT')).toBeInTheDocument();
        expect(JSON.parse(localStorage.getItem('pendingSteps'))).toEqual(['CHANGE_PASSWORD', 'DATA_CONSENT']);

        act(() => session.current.completeStep('CHANGE_PASSWORD'));
        expect(screen.getByText('DATA_CONSENT')).toBeInTheDocument();

        act(() => session.current.completeStep('DATA_CONSENT'));
        expect(screen.getByText('sin pendientes')).toBeInTheDocument();
        expect(localStorage.getItem('pendingSteps')).toBeNull();
    });

    it('sobreviven a recargar la página', () => {
        localStorage.setItem('token', fakeJwt('JUDGE'));
        localStorage.setItem('pendingSteps', JSON.stringify(['DATA_CONSENT']));

        renderSession();

        expect(screen.getByText('DATA_CONSENT')).toBeInTheDocument();
    });

    it('un 403 de la API por primer ingreso los actualiza aunque la sesión ya estuviera al día', async () => {
        renderSession();
        act(() => session.current.login(fakeJwt('MACONDOLAB', 'carla@unisimon.edu.co'), { email: 'carla@unisimon.edu.co' }, []));
        expect(screen.getByText('sin pendientes')).toBeInTheDocument();

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(
            { detail: 'Antes de continuar, completa tu primer ingreso.', pendingSteps: ['CHANGE_PASSWORD'] },
            403,
            'application/problem+json',
        )));

        await act(async () => {
            await expect(request('/admin/users')).rejects.toMatchObject({ status: 403 });
        });

        expect(screen.getByText('CHANGE_PASSWORD')).toBeInTheDocument();
    });

    it('cerrar sesión los borra y limpia la caché de datos', () => {
        const queryClient = renderSession();
        queryClient.setQueryData(['profile'], { firstName: 'Marta' });
        act(() => session.current.login(fakeJwt('JUDGE'), {}, ['DATA_CONSENT']));

        act(() => session.current.logout());

        expect(screen.getByText('sin pendientes')).toBeInTheDocument();
        expect(localStorage.getItem('pendingSteps')).toBeNull();
        expect(queryClient.getQueryData(['profile'])).toBeUndefined();
    });
});
