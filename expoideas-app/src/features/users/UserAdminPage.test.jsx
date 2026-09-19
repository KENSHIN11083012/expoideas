import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/features/auth/useAuth';
import { useAffiliationCatalogs } from '@/features/catalogs/queries';
import { ana, carla, luis, marta } from '@/test/fixtures';
import { apiError } from '@/test/utils';
import UserAdminPage from './UserAdminPage';
import { useCreateUser, useDeleteUser, useResetPassword, useUpdateUser, useUsers } from './queries';

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/catalogs/queries', () => ({ useAffiliationCatalogs: vi.fn() }));
vi.mock('./queries', () => ({
    useUsers: vi.fn(),
    useCreateUser: vi.fn(),
    useUpdateUser: vi.fn(),
    useResetPassword: vi.fn(),
    useDeleteUser: vi.fn(),
}));

const mutation = (overrides = {}) => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, variables: undefined, ...overrides });

/** Renderiza la página con la sesión de `me` y devuelve la tabla de escritorio. */
function renderAs(me, role, users = [ana, luis, carla]) {
    useAuth.mockReturnValue({ user: { email: me.email }, role });
    useUsers.mockReturnValue({ data: users, isPending: false, isFetching: false, error: null, refetch: vi.fn() });
    useAffiliationCatalogs.mockReturnValue({
        campuses: [{ id: 1, name: 'Barranquilla' }],
        faculties: [{ id: 2, name: 'Ingeniería' }],
        programs: [],
        isPending: false,
        error: null,
    });
    render(<UserAdminPage />);
    // La página pinta tabla (escritorio) y tarjetas (celular); sin CSS en jsdom se ven ambas.
    return within(screen.getByRole('table'));
}

const row = (table, name) => table.getByText(name, { exact: false }).closest('tr');

const options = (select) => within(select).getAllByRole('option').map((option) => option.textContent);

let updateUser;
let deleteUser;
let createUser;

beforeEach(() => {
    updateUser = mutation();
    deleteUser = mutation();
    createUser = mutation();
    useUpdateUser.mockReturnValue(updateUser);
    useDeleteUser.mockReturnValue(deleteUser);
    useCreateUser.mockReturnValue(createUser);
    useResetPassword.mockReturnValue(mutation());
});

describe('Usuarios como administrador', () => {
    it('ve todos los roles pero no puede cambiar el suyo', () => {
        const table = renderAs(luis, 'ADMIN');

        expect(options(table.getByRole('combobox', { name: 'Rol de Ana María Pérez' }))).toEqual([
            'Estudiante',
            'Docente',
            'Jurado',
            'MacondoLab',
            'Administrador',
        ]);
        expect(table.getByRole('combobox', { name: 'Rol de Carla Díaz' })).toBeInTheDocument();
        expect(table.queryByRole('combobox', { name: 'Rol de Luis Gómez' })).not.toBeInTheDocument();
        expect(within(row(table, 'Luis Gómez')).getByText('Administrador')).toBeInTheDocument();
    });

    it('pide confirmación antes de dar un rol de gestión', async () => {
        const user = userEvent.setup();
        const table = renderAs(luis, 'ADMIN');

        await user.selectOptions(table.getByRole('combobox', { name: 'Rol de Ana María Pérez' }), 'MACONDOLAB');

        const confirm = await screen.findByRole('alertdialog');
        expect(within(confirm).getByText('¿Dar el rol MacondoLab a Ana María Pérez?')).toBeInTheDocument();
        expect(updateUser.mutate).not.toHaveBeenCalled();

        await user.click(within(confirm).getByRole('button', { name: 'Dar el rol' }));
        expect(updateUser.mutate).toHaveBeenCalledWith({ id: ana.id, changes: { role: 'MACONDOLAB' } }, expect.anything());
    });

    it('los demás roles se aplican sin confirmar', async () => {
        const user = userEvent.setup();
        const table = renderAs(luis, 'ADMIN');

        await user.selectOptions(table.getByRole('combobox', { name: 'Rol de Ana María Pérez' }), 'JUDGE');

        expect(updateUser.mutate).toHaveBeenCalledWith({ id: ana.id, changes: { role: 'JUDGE' } }, expect.anything());
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('puede eliminar otras cuentas', async () => {
        const user = userEvent.setup();
        const table = renderAs(luis, 'ADMIN');

        await user.click(table.getByRole('button', { name: 'Acciones para Ana María Pérez' }));

        expect(await screen.findByRole('menuitem', { name: 'Eliminar usuario' })).toBeInTheDocument();
    });
});

describe('Primer ingreso en la lista', () => {
    it('marca las cuentas que aún no completan su primer ingreso', () => {
        const table = renderAs(carla, 'MACONDOLAB', [ana, marta]);

        expect(within(row(table, 'Marta Ríos')).getByText('Primer ingreso pendiente')).toBeInTheDocument();
        expect(within(row(table, 'Ana María Pérez')).queryByText('Primer ingreso pendiente')).not.toBeInTheDocument();
    });
});

describe('Usuarios como MacondoLab', () => {
    it('no ve controles sobre cuentas de gestión ni sobre la suya', () => {
        const table = renderAs(carla, 'MACONDOLAB');

        expect(table.queryByRole('combobox', { name: 'Rol de Luis Gómez' })).not.toBeInTheDocument();
        expect(table.queryByRole('button', { name: 'Acciones para Luis Gómez' })).not.toBeInTheDocument();
        expect(table.queryByRole('combobox', { name: 'Rol de Carla Díaz' })).not.toBeInTheDocument();
        expect(table.queryByRole('button', { name: 'Acciones para Carla Díaz' })).not.toBeInTheDocument();
    });

    it('solo asigna estudiante, docente o jurado', () => {
        const table = renderAs(carla, 'MACONDOLAB');

        expect(options(table.getByRole('combobox', { name: 'Rol de Ana María Pérez' }))).toEqual(['Estudiante', 'Docente', 'Jurado']);
    });

    it('no puede eliminar cuentas', async () => {
        const user = userEvent.setup();
        const table = renderAs(carla, 'MACONDOLAB');

        await user.click(table.getByRole('button', { name: 'Acciones para Ana María Pérez' }));

        expect(await screen.findByRole('menuitem', { name: 'Restablecer contraseña' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Editar adscripción' })).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: 'Eliminar usuario' })).not.toBeInTheDocument();
    });
});

describe('Nueva cuenta', () => {
    async function openDialog(user) {
        renderAs(carla, 'MACONDOLAB');
        await user.click(screen.getByRole('button', { name: 'Nueva cuenta' }));
        return within(await screen.findByRole('dialog'));
    }

    async function fill(dialog, user, { email }) {
        await user.type(dialog.getByLabelText(/^Nombres/), 'Marta');
        await user.type(dialog.getByLabelText(/^Apellidos/), 'Ríos');
        await user.type(dialog.getByLabelText(/^Correo/), email);
        await user.type(dialog.getByLabelText(/^Contraseña temporal/), 'Temporal#2026');
    }

    it('sugiere jurado sin adscripción y la pide al elegir docente', async () => {
        const user = userEvent.setup();
        const dialog = await openDialog(user);

        const role = dialog.getByLabelText(/^Rol/);
        expect(role).toHaveValue('JUDGE');
        expect(options(role)).toEqual(['Estudiante', 'Docente', 'Jurado']);
        expect(dialog.getByText('Puede ser personal o de su organización.')).toBeInTheDocument();
        expect(dialog.queryByText('Adscripción académica')).not.toBeInTheDocument();

        await user.selectOptions(role, 'TEACHER');

        expect(dialog.getByText('Adscripción académica')).toBeInTheDocument();
        expect(dialog.getByText('Debe terminar en @unisimon.edu.co')).toBeInTheDocument();
    });

    it('a un docente le exige correo institucional, sede y facultad', async () => {
        const user = userEvent.setup();
        const dialog = await openDialog(user);

        await user.selectOptions(dialog.getByLabelText(/^Rol/), 'TEACHER');
        await fill(dialog, user, { email: 'pedro@gmail.com' });
        await user.click(dialog.getByRole('button', { name: 'Crear cuenta' }));

        await dialog.findAllByRole('alert');
        expect(dialog.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
            'Usa un correo @unisimon.edu.co; solo los jurados pueden tener uno externo',
            'Selecciona la sede',
            'Selecciona la facultad',
        ]);
        expect(createUser.mutateAsync).not.toHaveBeenCalled();
    });

    it('crea un jurado externo con el cuerpo que espera la API', async () => {
        const user = userEvent.setup();
        createUser.mutateAsync.mockResolvedValue({ id: 9, firstName: 'Marta', lastName: 'Ríos' });
        const dialog = await openDialog(user);

        await fill(dialog, user, { email: 'marta@empresa.com' });
        await user.click(dialog.getByRole('button', { name: 'Crear cuenta' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(createUser.mutateAsync).toHaveBeenCalledWith({
            firstName: 'Marta',
            lastName: 'Ríos',
            email: 'marta@empresa.com',
            password: 'Temporal#2026',
            role: 'JUDGE',
        });
    });

    it('un docente se crea con su adscripción', async () => {
        const user = userEvent.setup();
        createUser.mutateAsync.mockResolvedValue({ id: 10, firstName: 'Marta', lastName: 'Ríos' });
        const dialog = await openDialog(user);

        await user.selectOptions(dialog.getByLabelText(/^Rol/), 'TEACHER');
        await fill(dialog, user, { email: 'pedro@unisimon.edu.co' });
        await user.selectOptions(dialog.getByLabelText(/^Sede/), '1');
        await user.selectOptions(dialog.getByLabelText(/^Facultad/), '2');
        await user.click(dialog.getByRole('button', { name: 'Crear cuenta' }));

        expect(createUser.mutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({ role: 'TEACHER', campusId: 1, facultyId: 2, academicProgramId: null }),
        );
    });

    it('un correo repetido se muestra junto al campo', async () => {
        const user = userEvent.setup();
        createUser.mutateAsync.mockRejectedValue(apiError('El correo marta@empresa.com ya pertenece a otro usuario.', 409));
        const dialog = await openDialog(user);

        await fill(dialog, user, { email: 'marta@empresa.com' });
        await user.click(dialog.getByRole('button', { name: 'Crear cuenta' }));

        expect(await dialog.findByText('El correo marta@empresa.com ya pertenece a otro usuario.')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
