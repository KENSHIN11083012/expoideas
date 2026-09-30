import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { project } from '@/test/fixtures';
import { apiError, renderWithProviders } from '@/test/utils';
import JuryProjectsPage from './JuryProjectsPage';
import { useJuryProjects } from './queries';

vi.mock('./queries', () => ({ useJuryProjects: vi.fn() }));

const renderPage = (query) => {
    useJuryProjects.mockReturnValue({ data: undefined, isPending: false, error: null, refetch: vi.fn(), ...query });
    renderWithProviders(<JuryProjectsPage />);
};

describe('Proyectos por evaluar', () => {
    it('muestra cada proyecto asignado con su equipo y el enlace a la ficha', () => {
        renderPage({ data: [project] });

        expect(screen.getByRole('heading', { name: 'BioSensor' })).toBeInTheDocument();
        expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
        expect(screen.getByText('1 integrante')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Ver proyecto/ })).toHaveAttribute('href', '/proyectos/10');
    });

    it('sin asignaciones lo explica', () => {
        renderPage({ data: [] });

        expect(screen.getByText('Todavía no tienes proyectos asignados')).toBeInTheDocument();
    });

    it('si la API falla ofrece reintentar', () => {
        renderPage({ error: apiError('Error del servidor', 500) });

        expect(screen.getByText('No pudimos cargar tus proyectos')).toBeInTheDocument();
    });
});
