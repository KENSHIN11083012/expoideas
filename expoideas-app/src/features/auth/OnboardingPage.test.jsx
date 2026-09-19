import { createContext, useContext, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { apiError } from '@/test/utils';
import OnboardingPage from './OnboardingPage';
import { accountApi } from './api';
import { useAuth } from './useAuth';

vi.mock('./useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('./api', () => ({ accountApi: { changePassword: vi.fn(), giveDataConsent: vi.fn() } }));

const TestSession = createContext(null);

/** Sesión con estado real: completar un paso lo quita de la lista, como AuthProvider. */
function Session({ initialPendingSteps, role, children }) {
    const [pendingSteps, setPendingSteps] = useState(initialPendingSteps);
    const value = {
        token: 'token',
        role,
        user: { fullName: 'Marta Ríos' },
        pendingSteps,
        completeStep: (step) => setPendingSteps((steps) => steps.filter((s) => s !== step)),
        logout: vi.fn(),
    };
    return <TestSession.Provider value={value}>{children}</TestSession.Provider>;
}

function renderOnboarding(pendingSteps, role = 'JUDGE') {
    useAuth.mockImplementation(() => useContext(TestSession));
    render(
        <Session initialPendingSteps={pendingSteps} role={role}>
            <MemoryRouter initialEntries={[ROUTES.ONBOARDING]}>
                <Routes>
                    <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
                    <Route path={ROUTES.HOME} element={<p>Inicio</p>} />
                    <Route path={ROUTES.USERS} element={<p>Pantalla de usuarios</p>} />
                    <Route path={ROUTES.LOGIN} element={<p>Inicia sesión</p>} />
                </Routes>
            </MemoryRouter>
        </Session>,
    );
}

async function changePassword(user, { current = 'Temporal#2026', next = 'Propia#2026' } = {}) {
    await user.type(screen.getByLabelText(/^Contraseña temporal/), current);
    await user.type(screen.getByLabelText(/^Nueva contraseña/), next);
    await user.type(screen.getByLabelText(/^Confirmar nueva contraseña/), next);
    await user.click(screen.getByRole('button', { name: /Guardar y continuar/ }));
}

describe('Primer ingreso', () => {
    it('una cuenta nueva cambia la contraseña, autoriza sus datos y llega al inicio', async () => {
        const user = userEvent.setup();
        accountApi.changePassword.mockResolvedValue(null);
        accountApi.giveDataConsent.mockResolvedValue(null);
        renderOnboarding(['CHANGE_PASSWORD', 'DATA_CONSENT']);

        expect(screen.getByText('Primer ingreso · Paso 1 de 2')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Crea tu contraseña' })).toBeInTheDocument();
        await changePassword(user);

        expect(accountApi.changePassword).toHaveBeenCalledWith({
            currentPassword: 'Temporal#2026',
            newPassword: 'Propia#2026',
            confirmPassword: 'Propia#2026',
        });
        expect(await screen.findByText('Primer ingreso · Paso 2 de 2')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Autoriza el tratamiento de tus datos' })).toBeInTheDocument();

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /Aceptar y continuar/ }));

        expect(accountApi.giveDataConsent).toHaveBeenCalled();
        expect(await screen.findByText('Inicio')).toBeInTheDocument();
    });

    it('una contraseña temporal incorrecta se muestra en su campo y no avanza', async () => {
        const user = userEvent.setup();
        accountApi.changePassword.mockRejectedValue(
            apiError('La contraseña actual es incorrecta.', 400, {
                fields: { currentPassword: 'La contraseña actual es incorrecta.' },
            }),
        );
        renderOnboarding(['CHANGE_PASSWORD', 'DATA_CONSENT']);

        await changePassword(user, { current: 'Otra#2026' });

        expect(await screen.findByText('La contraseña actual es incorrecta.')).toBeInTheDocument();
        expect(screen.getByText('Primer ingreso · Paso 1 de 2')).toBeInTheDocument();
    });

    it('la nueva contraseña debe ser distinta de la temporal', async () => {
        const user = userEvent.setup();
        renderOnboarding(['CHANGE_PASSWORD']);

        await changePassword(user, { current: 'Temporal#2026', next: 'Temporal#2026' });

        expect(await screen.findByText('La nueva contraseña debe ser distinta de la actual')).toBeInTheDocument();
        expect(accountApi.changePassword).not.toHaveBeenCalled();
    });

    it('sin marcar la autorización no continúa', async () => {
        const user = userEvent.setup();
        renderOnboarding(['DATA_CONSENT']);

        expect(screen.getByText('Primer ingreso · Paso 1 de 1')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Aceptar y continuar/ }));

        expect(await screen.findByText('Debes autorizar el tratamiento de tus datos para usar la plataforma')).toBeInTheDocument();
        expect(accountApi.giveDataConsent).not.toHaveBeenCalled();
    });

    it('MacondoLab termina en Usuarios', async () => {
        const user = userEvent.setup();
        accountApi.giveDataConsent.mockResolvedValue(null);
        renderOnboarding(['DATA_CONSENT'], 'MACONDOLAB');

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /Aceptar y continuar/ }));

        expect(await screen.findByText('Pantalla de usuarios')).toBeInTheDocument();
    });

    it('sin pasos pendientes no se queda en la pantalla', () => {
        renderOnboarding([]);

        expect(screen.getByText('Inicio')).toBeInTheDocument();
    });
});
