import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { SiteHeader } from './layout/SiteHeader';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, ROLES_DE_GESTION, esDeGestion } from '@/utils/roles';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));

const sesionDe = (role, pendientes = []) =>
    useAuth.mockReturnValue({
        token: 'token',
        pendientes,
        user: { nombres: 'Marta', apellidos: 'Ríos', nombreCompleto: 'Marta Ríos', email: 'marta@empresa.com' },
        role,
        esGestion: () => esDeGestion(role),
        logout: vi.fn(),
    });

const enlacesDelMenu = () =>
    within(screen.getByRole('navigation', { name: 'Principal' }))
        .getAllByRole('link')
        .map((enlace) => enlace.textContent);

describe('Menú principal por rol', () => {
    it.each([ROLES.ESTUDIANTE, ROLES.DOCENTE, ROLES.JURADO])('%s no ve la gestión', (rol) => {
        sesionDe(rol);
        render(<SiteHeader />, { wrapper: MemoryRouter });

        expect(enlacesDelMenu()).toEqual(['Inicio', 'Mi perfil']);
    });

    it.each([ROLES.MACONDOLAB, ROLES.ADMIN])('%s ve Usuarios y Catálogos', (rol) => {
        sesionDe(rol);
        render(<SiteHeader />, { wrapper: MemoryRouter });

        expect(enlacesDelMenu()).toEqual(['Inicio', 'Mi perfil', 'Usuarios', 'Catálogos']);
    });
});

describe('Cuenta en la cabecera', () => {
    it('las iniciales toman el primer nombre y el primer apellido, aunque sean compuestos', () => {
        useAuth.mockReturnValue({
            token: 'token',
            pendientes: [],
            role: ROLES.ESTUDIANTE,
            user: { nombres: 'Ana María', apellidos: 'Pérez Gómez', nombreCompleto: 'Ana María Pérez Gómez', email: 'ana@unisimon.edu.co' },
            esGestion: () => false,
            logout: vi.fn(),
        });
        render(<SiteHeader />, { wrapper: MemoryRouter });

        expect(screen.getAllByText('AP').length).toBeGreaterThan(0);
        expect(screen.queryByText('AM')).not.toBeInTheDocument();
        expect(screen.getByText('Ana María Pérez Gómez')).toBeInTheDocument();
    });
});

describe('Rutas de gestión', () => {
    const renderRuta = () =>
        render(
            <MemoryRouter initialEntries={['/admin/usuarios']}>
                <Routes>
                    <Route
                        path="/admin/usuarios"
                        element={<ProtectedRoute allowedRoles={ROLES_DE_GESTION}><p>Pantalla de usuarios</p></ProtectedRoute>}
                    />
                    <Route path="/unauthorized" element={<p>Sin permiso</p>} />
                    <Route path="/primer-ingreso" element={<p>Primer ingreso</p>} />
                    <Route path="/login" element={<p>Inicia sesión</p>} />
                </Routes>
            </MemoryRouter>,
        );

    it('un jurado que escribe la URL termina en "sin permiso"', () => {
        sesionDe(ROLES.JURADO);
        renderRuta();

        expect(screen.getByText('Sin permiso')).toBeInTheDocument();
    });

    it('MacondoLab entra', () => {
        sesionDe(ROLES.MACONDOLAB);
        renderRuta();

        expect(screen.getByText('Pantalla de usuarios')).toBeInTheDocument();
    });

    it('con el primer ingreso pendiente va a resolverlo antes que nada', () => {
        sesionDe(ROLES.MACONDOLAB, ['cambiarPassword']);
        renderRuta();

        expect(screen.getByText('Primer ingreso')).toBeInTheDocument();
    });

    it('sin sesión va al login', () => {
        useAuth.mockReturnValue({ token: null, role: null });
        renderRuta();

        expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
    });
});
