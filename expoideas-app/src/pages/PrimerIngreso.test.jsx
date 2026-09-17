import { createContext, useContext, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrimerIngreso from './PrimerIngreso';
import { useAuth } from '@/hooks/useAuth';
import { put } from '@/services/apiClient';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/services/apiClient', () => ({ put: vi.fn() }));

const SesionDePrueba = createContext(null);

/** Sesión con estado real: completar un paso lo quita de la lista, como AuthProvider. */
function Sesion({ pendientesIniciales, role, children }) {
    const [pendientes, setPendientes] = useState(pendientesIniciales);
    const valor = {
        token: 'token',
        role,
        user: { name: 'Marta Ríos' },
        pendientes,
        completarPendiente: (paso) => setPendientes((lista) => lista.filter((p) => p !== paso)),
        logout: vi.fn(),
    };
    return <SesionDePrueba.Provider value={valor}>{children}</SesionDePrueba.Provider>;
}

function renderPrimerIngreso(pendientes, role = 'JURADO') {
    useAuth.mockImplementation(() => useContext(SesionDePrueba));
    render(
        <Sesion pendientesIniciales={pendientes} role={role}>
            <MemoryRouter initialEntries={['/primer-ingreso']}>
                <Routes>
                    <Route path="/primer-ingreso" element={<PrimerIngreso />} />
                    <Route path="/" element={<p>Inicio</p>} />
                    <Route path="/admin/usuarios" element={<p>Pantalla de usuarios</p>} />
                    <Route path="/login" element={<p>Inicia sesión</p>} />
                </Routes>
            </MemoryRouter>
        </Sesion>,
    );
}

async function cambiarPassword(user, { temporal = 'Temporal#2026', nueva = 'Propia#2026' } = {}) {
    await user.type(screen.getByLabelText(/^Contraseña temporal/), temporal);
    await user.type(screen.getByLabelText(/^Nueva contraseña/), nueva);
    await user.type(screen.getByLabelText(/^Confirmar nueva contraseña/), nueva);
    await user.click(screen.getByRole('button', { name: /Guardar y continuar/ }));
}

describe('Primer ingreso', () => {
    it('una cuenta nueva cambia la contraseña, autoriza sus datos y llega al inicio', async () => {
        const user = userEvent.setup();
        put.mockResolvedValue(null);
        renderPrimerIngreso(['cambiarPassword', 'autorizarDatos']);

        expect(screen.getByText('Primer ingreso · Paso 1 de 2')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Crea tu contraseña' })).toBeInTheDocument();
        await cambiarPassword(user);

        expect(put).toHaveBeenCalledWith('/usuarios/me/password', {
            passwordActual: 'Temporal#2026',
            passwordNueva: 'Propia#2026',
            confirmacionPassword: 'Propia#2026',
        });
        expect(await screen.findByText('Primer ingreso · Paso 2 de 2')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Autoriza el tratamiento de tus datos' })).toBeInTheDocument();

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /Aceptar y continuar/ }));

        expect(put).toHaveBeenLastCalledWith('/usuarios/me/autorizacion-datos', { autorizaDatos: true });
        expect(await screen.findByText('Inicio')).toBeInTheDocument();
    });

    it('una contraseña temporal incorrecta se muestra en su campo y no avanza', async () => {
        const user = userEvent.setup();
        put.mockRejectedValue(Object.assign(new Error('La contraseña actual es incorrecta.'), { status: 400 }));
        renderPrimerIngreso(['cambiarPassword', 'autorizarDatos']);

        await cambiarPassword(user, { temporal: 'Otra#2026' });

        expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual es incorrecta.');
        expect(screen.getByText('Primer ingreso · Paso 1 de 2')).toBeInTheDocument();
    });

    it('la nueva contraseña debe ser distinta de la temporal', async () => {
        const user = userEvent.setup();
        renderPrimerIngreso(['cambiarPassword']);

        await cambiarPassword(user, { temporal: 'Temporal#2026', nueva: 'Temporal#2026' });

        expect(await screen.findByText('La nueva contraseña debe ser distinta de la actual')).toBeInTheDocument();
        expect(put).not.toHaveBeenCalled();
    });

    it('sin marcar la autorización no continúa', async () => {
        const user = userEvent.setup();
        renderPrimerIngreso(['autorizarDatos']);

        expect(screen.getByText('Primer ingreso · Paso 1 de 1')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Aceptar y continuar/ }));

        expect(await screen.findByText('Debes autorizar el tratamiento de tus datos para usar la plataforma')).toBeInTheDocument();
        expect(put).not.toHaveBeenCalled();
    });

    it('MacondoLab termina en Usuarios', async () => {
        const user = userEvent.setup();
        put.mockResolvedValue(null);
        renderPrimerIngreso(['autorizarDatos'], 'MACONDOLAB');

        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /Aceptar y continuar/ }));

        expect(await screen.findByText('Pantalla de usuarios')).toBeInTheDocument();
    });

    it('sin pasos pendientes no se queda en la pantalla', () => {
        renderPrimerIngreso([]);

        expect(screen.getByText('Inicio')).toBeInTheDocument();
    });
});
