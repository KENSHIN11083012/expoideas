import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '@/hooks/useAuth';
import { post } from '@/services/apiClient';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/services/apiClient', () => ({ post: vi.fn() }));

const tokenDe = (role) => {
    const codificar = (objeto) => btoa(JSON.stringify(objeto)).replace(/=+$/, '');
    return `${codificar({ alg: 'HS256' })}.${codificar({ sub: 'marta@empresa.com', role, exp: Date.now() / 1000 + 3600 })}.firma`;
};

function renderLogin() {
    const login = vi.fn();
    useAuth.mockReturnValue({ login });
    render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/primer-ingreso" element={<p>Pantalla de primer ingreso</p>} />
                <Route path="/admin/usuarios" element={<p>Pantalla de usuarios</p>} />
                <Route path="/" element={<p>Inicio</p>} />
            </Routes>
        </MemoryRouter>,
    );
    return login;
}

async function ingresar(user, correo) {
    await user.type(screen.getByLabelText(/^Correo institucional/), correo);
    await user.type(screen.getByLabelText(/^Contraseña/), 'Temporal#2026');
    await user.click(screen.getByRole('button', { name: /Ingresar|Iniciar sesión/ }));
}

describe('Login', () => {
    it('con pasos de primer ingreso pendientes lleva a resolverlos', async () => {
        const user = userEvent.setup();
        post.mockResolvedValue({
            token: tokenDe('ROLE_MACONDOLAB'),
            rol: 'macondolab',
            id: 3,
            nombres: 'Carla',
            apellidos: 'Díaz',
            pendientes: ['cambiarPassword', 'autorizarDatos'],
        });
        const login = renderLogin();

        await ingresar(user, 'coordinacion@unisimon.edu.co');

        expect(login).toHaveBeenCalledWith(
            expect.any(String),
            { id: 3, email: 'coordinacion@unisimon.edu.co', name: 'Carla Díaz' },
            'MACONDOLAB',
            ['cambiarPassword', 'autorizarDatos'],
        );
        expect(await screen.findByText('Pantalla de primer ingreso')).toBeInTheDocument();
    });

    it('sin pendientes va al inicio de su rol', async () => {
        const user = userEvent.setup();
        post.mockResolvedValue({ token: tokenDe('ROLE_MACONDOLAB'), rol: 'macondolab', id: 3, nombres: 'Carla', apellidos: 'Díaz', pendientes: [] });
        renderLogin();

        await ingresar(user, 'coordinacion@unisimon.edu.co');

        expect(await screen.findByText('Pantalla de usuarios')).toBeInTheDocument();
    });
});
