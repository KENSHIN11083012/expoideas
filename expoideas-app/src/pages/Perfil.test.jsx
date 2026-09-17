import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Perfil from './Perfil';
import { useAuth } from '@/hooks/useAuth';
import { get, put } from '@/services/apiClient';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/services/apiClient', () => ({ get: vi.fn(), put: vi.fn() }));
vi.mock('@/hooks/useCatalogosAdscripcion', () => ({
    useCatalogosAdscripcion: () => ({ sedes: [], facultades: [], programas: [], isLoading: false, error: null }),
}));

const perfilBase = {
    id: 5,
    nombres: 'Marta',
    apellidos: 'Ríos',
    correoInstitucional: 'marta@empresa.com',
    fechaCreacion: '2026-09-17T08:00:00',
};

/** Etiquetas de la tarjeta de identidad (Correo, Sede, Facultad...). */
const datosDeLaTarjeta = () => screen.getAllByRole('term').map((termino) => termino.textContent);

/** Valor que muestra la tarjeta para una etiqueta. */
const datoDeLaTarjeta = (etiqueta) =>
    within(screen.getAllByRole('term').find((termino) => termino.textContent === etiqueta).parentElement)
        .getByRole('definition').textContent;

function renderPerfil(perfil) {
    useAuth.mockReturnValue({ role: perfil.rol.toUpperCase(), updateUser: vi.fn() });
    get.mockResolvedValue(perfil);
    render(<Perfil />, { wrapper: MemoryRouter });
}

describe('Mi perfil según el rol', () => {
    it('un jurado no ve nada de adscripción académica', async () => {
        renderPerfil({ ...perfilBase, rol: 'jurado' });

        expect(await screen.findByLabelText(/^Nombres/)).toHaveValue('Marta');
        expect(screen.queryByText('Adscripción académica')).not.toBeInTheDocument();
        expect(screen.queryByText('Completa tu vínculo con la universidad')).not.toBeInTheDocument();
        expect(datosDeLaTarjeta()).toEqual(['Correo institucional', 'Miembro desde']);
        expect(screen.getByText('Jurado')).toBeInTheDocument();
    });

    it('un jurado guarda solo nombres y apellidos', async () => {
        const user = userEvent.setup();
        put.mockResolvedValue({ ...perfilBase, nombres: 'Marta Lucía', rol: 'jurado' });
        renderPerfil({ ...perfilBase, rol: 'jurado' });

        const nombres = await screen.findByLabelText(/^Nombres/);
        await user.clear(nombres);
        await user.type(nombres, 'Marta Lucía');
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(put).toHaveBeenCalledWith('/usuarios/me', { nombres: 'Marta Lucía', apellidos: 'Ríos' });
    });

    it('un estudiante sin facultad ve el aviso y la adscripción', async () => {
        renderPerfil({ ...perfilBase, correoInstitucional: 'ana@unisimon.edu.co', rol: 'estudiante', facultadId: null });

        expect(await screen.findByText('Completa tu vínculo con la universidad')).toBeInTheDocument();
        expect(screen.getByText('Adscripción académica')).toBeInTheDocument();
        expect(datosDeLaTarjeta()).toEqual(['Correo institucional', 'Sede', 'Facultad', 'Programa académico', 'Miembro desde']);
        expect(datoDeLaTarjeta('Facultad')).toBe('Sin asignar');
    });

    it('un docente con adscripción no ve el aviso', async () => {
        renderPerfil({
            ...perfilBase,
            correoInstitucional: 'pedro@unisimon.edu.co',
            rol: 'docente',
            sedeId: 1,
            sede: 'Barranquilla',
            facultadId: 2,
            facultad: 'Ingeniería',
        });

        expect(await screen.findByText('Adscripción académica')).toBeInTheDocument();
        expect(screen.queryByText('Completa tu vínculo con la universidad')).not.toBeInTheDocument();
        expect(datoDeLaTarjeta('Facultad')).toBe('Ingeniería');
        expect(datoDeLaTarjeta('Programa académico')).toBe('Sin programa');
    });
});
