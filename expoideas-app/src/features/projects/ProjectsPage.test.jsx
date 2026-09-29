import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/features/auth/useAuth';
import { useCatalogItems } from '@/features/catalogs/queries';
import { useEditions } from '@/features/editions/queries';
import { openEdition } from '@/test/fixtures';
import { apiError, renderWithProviders, sessionFor } from '@/test/utils';
import ProjectsPage from './ProjectsPage';
import { downloadProjectsCsv, useProjectDirectory } from './directory';
import { useTeachers } from './queries';

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/editions/queries', () => ({ useEditions: vi.fn() }));
vi.mock('@/features/catalogs/queries', () => ({ useCatalogItems: vi.fn() }));
vi.mock('./queries', () => ({ useTeachers: vi.fn() }));
vi.mock('./directory', () => ({ useProjectDirectory: vi.fn(), downloadProjectsCsv: vi.fn() }));

const summary = {
    id: 10,
    editionId: 1,
    edition: 'Expoideas 2026-2',
    track: 'INNPRENDE_I',
    title: 'BioSensor IoT',
    sector: 'Agroindustria y alimentos',
    teacher: 'Carlos Mendoza',
    leader: 'Ana María Pérez',
    members: 3,
    minMembers: 2,
    requiredDeliverables: 2,
    deliveredDeliverables: 1,
    createdAt: '2026-11-04T09:00:00',
};

const renderPage = ({ projects = [summary], role = 'MACONDOLAB', query = {} } = {}) => {
    useAuth.mockReturnValue(sessionFor({ role }));
    useProjectDirectory.mockReturnValue({ data: projects, isPending: false, error: null, refetch: vi.fn(), ...query });
    useEditions.mockReturnValue({ data: [openEdition], isPending: false });
    useCatalogItems.mockReturnValue({ data: [{ id: 3, name: 'Agroindustria y alimentos' }], isPending: false });
    useTeachers.mockReturnValue({ data: [{ id: 7, fullName: 'Carlos Mendoza', faculty: 'Ingeniería' }], isPending: false });
    renderWithProviders(<ProjectsPage />);
};

/** Último filtro con el que se pidió la lista. */
const lastFilters = () => useProjectDirectory.mock.calls.at(-1)[0];

beforeEach(() => {
    downloadProjectsCsv.mockResolvedValue(undefined);
});

describe('Listado para la gestión', () => {
    it('muestra cada proyecto con su equipo y sus entregables', () => {
        renderPage();
        const table = within(screen.getByRole('table'));

        expect(table.getByRole('link', { name: 'BioSensor IoT' })).toHaveAttribute('href', '/proyectos/10');
        expect(table.getByText(/Expoideas 2026-2 · INNPRENDE I/)).toBeInTheDocument();
        expect(table.getByText('Carlos Mendoza')).toBeInTheDocument();
        expect(table.getByText('Faltan 1')).toBeInTheDocument();
        expect(screen.getByText('1 proyecto')).toBeInTheDocument();
    });

    it('avisa cuando el equipo no llega al mínimo', () => {
        renderPage({ projects: [{ ...summary, members: 1 }] });

        expect(screen.getByText(/1 integrante · mínimo 2/)).toBeInTheDocument();
    });

    it('marca como entregado al que completó lo obligatorio', () => {
        renderPage({ projects: [{ ...summary, deliveredDeliverables: 2 }] });

        expect(screen.getByText('Entregado')).toBeInTheDocument();
    });

    it('filtra por cátedra y por sector', async () => {
        renderPage();

        await userEvent.selectOptions(screen.getByLabelText('Cátedra'), 'INNPRENDE_II');
        await userEvent.selectOptions(screen.getByLabelText('Sector'), '3');

        await waitFor(() => expect(lastFilters()).toMatchObject({ track: 'INNPRENDE_II', sectorId: '3' }));
    });

    it('descarga el CSV con los filtros puestos', async () => {
        renderPage();

        await userEvent.selectOptions(screen.getByLabelText('Cátedra'), 'INNPRENDE_I');
        await userEvent.click(screen.getByRole('button', { name: /Descargar CSV/ }));

        await waitFor(() => expect(downloadProjectsCsv).toHaveBeenCalledWith(expect.objectContaining({ track: 'INNPRENDE_I' })));
    });

    it('sin proyectos lo dice, y con filtros ofrece quitarlos', async () => {
        renderPage({ projects: [] });
        expect(screen.getByText('Todavía no hay proyectos inscritos')).toBeInTheDocument();

        await userEvent.selectOptions(screen.getByLabelText('Cátedra'), 'INNPRENDE_I');

        expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }));
        expect(screen.getByText('Todavía no hay proyectos inscritos')).toBeInTheDocument();
    });

    it('si la API falla ofrece reintentar', () => {
        renderPage({ projects: [], query: { data: undefined, error: apiError('Error del servidor', 500) } });

        expect(screen.getByText('No pudimos cargar los proyectos')).toBeInTheDocument();
    });
});

describe('Listado para un docente', () => {
    it('no ofrece filtrar por docente, porque solo ve los suyos', () => {
        renderPage({ role: 'TEACHER' });

        expect(screen.queryByLabelText('Docente')).not.toBeInTheDocument();
        expect(screen.getByText(/te nombraron como docente del grupo/)).toBeInTheDocument();
    });
});
