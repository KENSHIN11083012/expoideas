import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ROLES, isManagement } from '@/lib/roles';
import { useAuth } from '@/features/auth/useAuth';
import { SiteHeader } from './SiteHeader';

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }));

const sessionAs = (role, user = {}) =>
    useAuth.mockReturnValue({
        token: 'token',
        pendingSteps: [],
        user: { firstName: 'Marta', lastName: 'Ríos', fullName: 'Marta Ríos', email: 'marta@empresa.com', photoId: null, ...user },
        role,
        isManagement: isManagement(role),
        logout: vi.fn(),
    });

const menuLinks = () =>
    within(screen.getByRole('navigation', { name: 'Principal' }))
        .getAllByRole('link')
        .map((link) => link.textContent);

describe('Menú principal por rol', () => {
    it.each([ROLES.STUDENT, ROLES.TEACHER, ROLES.JUDGE])('%s no ve la gestión', (role) => {
        sessionAs(role);
        render(<SiteHeader />, { wrapper: MemoryRouter });

        expect(menuLinks()).toEqual(['Inicio', 'Mi perfil']);
    });

    it.each([ROLES.MACONDOLAB, ROLES.ADMIN])('%s ve Usuarios y Catálogos', (role) => {
        sessionAs(role);
        render(<SiteHeader />, { wrapper: MemoryRouter });

        expect(menuLinks()).toEqual(['Inicio', 'Mi perfil', 'Usuarios', 'Catálogos']);
    });
});

describe('Cuenta en la cabecera', () => {
    it('las iniciales toman el primer nombre y el primer apellido, aunque sean compuestos', () => {
        sessionAs(ROLES.STUDENT, { firstName: 'Ana María', lastName: 'Pérez Gómez', fullName: 'Ana María Pérez Gómez' });
        render(<SiteHeader />, { wrapper: MemoryRouter });

        expect(screen.getAllByText('AP').length).toBeGreaterThan(0);
        expect(screen.queryByText('AM')).not.toBeInTheDocument();
        expect(screen.getByText('Ana María Pérez Gómez')).toBeInTheDocument();
    });
});
