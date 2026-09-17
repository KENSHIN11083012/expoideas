import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Catalogos from './Catalogos';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
// El panel carga datos de la API; aquí solo importa qué pestañas se ofrecen.
vi.mock('@/components/catalogos/CatalogoPanel', () => ({
    CatalogoPanel: ({ catalogo }) => <p>Panel de {catalogo.label}</p>,
}));

const pestanas = () => screen.getAllByRole('tab').map((tab) => tab.textContent);

describe('Catálogos por rol', () => {
    it('el administrador gestiona la estructura institucional y la clasificación', () => {
        useAuth.mockReturnValue({ isAdmin: () => true });
        render(<Catalogos />);

        expect(pestanas()).toEqual(['Sedes', 'Facultades', 'Programas académicos', 'Categorías', 'Palabras clave']);
        expect(screen.getByText('Panel de Sedes')).toBeInTheDocument();
    });

    it('MacondoLab solo ve la clasificación de proyectos', () => {
        useAuth.mockReturnValue({ isAdmin: () => false });
        render(<Catalogos />);

        expect(pestanas()).toEqual(['Categorías', 'Palabras clave']);
        expect(screen.getByText('Panel de Categorías')).toBeInTheDocument();
        expect(screen.queryByText(/Sedes/)).not.toBeInTheDocument();
    });
});
