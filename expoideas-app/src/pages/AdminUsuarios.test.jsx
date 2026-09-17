import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUsuarios from './AdminUsuarios';
import { useAuth } from '@/hooks/useAuth';
import { useUserManagement } from '@/hooks/useUserManagement';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/useUserManagement', () => ({ useUserManagement: vi.fn() }));
vi.mock('@/hooks/useCatalogosAdscripcion', () => ({
    useCatalogosAdscripcion: () => ({
        sedes: [{ id: 1, nombre: 'Barranquilla' }],
        facultades: [{ id: 2, nombre: 'Ingeniería' }],
        programas: [],
        isLoading: false,
        error: null,
    }),
}));

const ana = {
    id: 1,
    nombres: 'Ana María',
    apellidos: 'Pérez',
    correoInstitucional: 'ana@unisimon.edu.co',
    rol: 'estudiante',
    sedeId: 1,
    sede: 'Barranquilla',
    facultadId: 2,
    facultad: 'Ingeniería',
};
const luis = { id: 2, nombres: 'Luis', apellidos: 'Gómez', correoInstitucional: 'luis@unisimon.edu.co', rol: 'admin' };
const carla = { id: 3, nombres: 'Carla', apellidos: 'Díaz', correoInstitucional: 'coordinacion@unisimon.edu.co', rol: 'macondolab' };

const gestion = {
    fetchUsuarios: vi.fn(),
    crearUsuario: vi.fn(),
    handleRoleChange: vi.fn(),
    updateAdscripcion: vi.fn(),
    resetPassword: vi.fn(),
    handleDeleteUser: vi.fn(),
};

/** Renderiza la página con la sesión de `cuenta` y devuelve la tabla de escritorio. */
function renderComo(cuenta, role) {
    useAuth.mockReturnValue({ user: { email: cuenta.correoInstitucional }, role });
    useUserManagement.mockReturnValue({ usuarios: [ana, luis, carla], isLoading: false, error: null, updatingId: null, ...gestion });
    render(<AdminUsuarios />);
    // La página pinta tabla (escritorio) y tarjetas (celular); sin CSS en jsdom se ven ambas.
    return within(screen.getByRole('table'));
}

const fila = (tabla, nombre) => tabla.getByText(nombre, { exact: false }).closest('tr');

const opciones = (select) => within(select).getAllByRole('option').map((opcion) => opcion.textContent);

describe('Usuarios como administrador', () => {
    it('ve todos los roles pero no puede cambiar el suyo', () => {
        const tabla = renderComo(luis, 'ADMIN');

        expect(opciones(tabla.getByRole('combobox', { name: 'Rol de Ana María Pérez' }))).toEqual([
            'Estudiante',
            'Docente',
            'Jurado',
            'MacondoLab',
            'Administrador',
        ]);
        expect(tabla.getByRole('combobox', { name: 'Rol de Carla Díaz' })).toBeInTheDocument();
        expect(tabla.queryByRole('combobox', { name: 'Rol de Luis Gómez' })).not.toBeInTheDocument();
        expect(within(fila(tabla, 'Luis Gómez')).getByText('Administrador')).toBeInTheDocument();
    });

    it('pide confirmación antes de dar un rol de gestión', async () => {
        const user = userEvent.setup();
        const tabla = renderComo(luis, 'ADMIN');

        await user.selectOptions(tabla.getByRole('combobox', { name: 'Rol de Ana María Pérez' }), 'MACONDOLAB');

        const confirmacion = await screen.findByRole('alertdialog');
        expect(within(confirmacion).getByText('¿Dar el rol MacondoLab a Ana María Pérez?')).toBeInTheDocument();
        expect(gestion.handleRoleChange).not.toHaveBeenCalled();

        await user.click(within(confirmacion).getByRole('button', { name: 'Dar el rol' }));
        expect(gestion.handleRoleChange).toHaveBeenCalledWith(ana, 'macondolab');
    });

    it('los demás roles se aplican sin confirmar', async () => {
        const user = userEvent.setup();
        const tabla = renderComo(luis, 'ADMIN');

        await user.selectOptions(tabla.getByRole('combobox', { name: 'Rol de Ana María Pérez' }), 'JURADO');

        expect(gestion.handleRoleChange).toHaveBeenCalledWith(ana, 'jurado');
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('puede eliminar otras cuentas', async () => {
        const user = userEvent.setup();
        const tabla = renderComo(luis, 'ADMIN');

        await user.click(tabla.getByRole('button', { name: 'Acciones para Ana María Pérez' }));

        expect(await screen.findByRole('menuitem', { name: 'Eliminar usuario' })).toBeInTheDocument();
    });
});

describe('Usuarios como MacondoLab', () => {
    it('no ve controles sobre cuentas de gestión ni sobre la suya', () => {
        const tabla = renderComo(carla, 'MACONDOLAB');

        expect(tabla.queryByRole('combobox', { name: 'Rol de Luis Gómez' })).not.toBeInTheDocument();
        expect(tabla.queryByRole('button', { name: 'Acciones para Luis Gómez' })).not.toBeInTheDocument();
        expect(tabla.queryByRole('combobox', { name: 'Rol de Carla Díaz' })).not.toBeInTheDocument();
        expect(tabla.queryByRole('button', { name: 'Acciones para Carla Díaz' })).not.toBeInTheDocument();
    });

    it('solo asigna estudiante, docente o jurado', () => {
        const tabla = renderComo(carla, 'MACONDOLAB');

        expect(opciones(tabla.getByRole('combobox', { name: 'Rol de Ana María Pérez' }))).toEqual([
            'Estudiante',
            'Docente',
            'Jurado',
        ]);
    });

    it('no puede eliminar cuentas', async () => {
        const user = userEvent.setup();
        const tabla = renderComo(carla, 'MACONDOLAB');

        await user.click(tabla.getByRole('button', { name: 'Acciones para Ana María Pérez' }));

        expect(await screen.findByRole('menuitem', { name: 'Restablecer contraseña' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Editar adscripción' })).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: 'Eliminar usuario' })).not.toBeInTheDocument();
    });
});

describe('Nueva cuenta', () => {
    async function abrirDialogo(user) {
        renderComo(carla, 'MACONDOLAB');
        await user.click(screen.getByRole('button', { name: 'Nueva cuenta' }));
        return within(await screen.findByRole('dialog'));
    }

    async function llenar(dialogo, user, { correo }) {
        await user.type(dialogo.getByLabelText(/^Nombres/), 'Marta');
        await user.type(dialogo.getByLabelText(/^Apellidos/), 'Ríos');
        await user.type(dialogo.getByLabelText(/^Correo/), correo);
        await user.type(dialogo.getByLabelText(/^Contraseña temporal/), 'Temporal#2026');
    }

    it('sugiere jurado sin adscripción y la pide al elegir docente', async () => {
        const user = userEvent.setup();
        const dialogo = await abrirDialogo(user);

        const rol = dialogo.getByLabelText(/^Rol/);
        expect(rol).toHaveValue('JURADO');
        expect(opciones(rol)).toEqual(['Estudiante', 'Docente', 'Jurado']);
        expect(dialogo.getByText('Puede ser personal o de su organización.')).toBeInTheDocument();
        expect(dialogo.queryByText('Adscripción académica')).not.toBeInTheDocument();

        await user.selectOptions(rol, 'DOCENTE');

        expect(dialogo.getByText('Adscripción académica')).toBeInTheDocument();
        expect(dialogo.getByText('Debe terminar en @unisimon.edu.co')).toBeInTheDocument();
    });

    it('a un docente le exige correo institucional, sede y facultad', async () => {
        const user = userEvent.setup();
        const dialogo = await abrirDialogo(user);

        await user.selectOptions(dialogo.getByLabelText(/^Rol/), 'DOCENTE');
        await llenar(dialogo, user, { correo: 'pedro@gmail.com' });
        await user.click(dialogo.getByRole('button', { name: 'Crear cuenta' }));

        await dialogo.findAllByRole('alert');
        expect(dialogo.getAllByRole('alert').map((alerta) => alerta.textContent)).toEqual([
            'Usa un correo @unisimon.edu.co; solo los jurados pueden tener uno externo',
            'Selecciona la sede',
            'Selecciona la facultad',
        ]);
        expect(gestion.crearUsuario).not.toHaveBeenCalled();
    });

    it('crea un jurado externo con el cuerpo que espera la API', async () => {
        const user = userEvent.setup();
        gestion.crearUsuario.mockResolvedValue({ id: 9 });
        const dialogo = await abrirDialogo(user);

        await llenar(dialogo, user, { correo: 'marta@empresa.com' });
        await user.click(dialogo.getByRole('button', { name: 'Crear cuenta' }));

        expect(gestion.crearUsuario).toHaveBeenCalledWith({
            nombres: 'Marta',
            apellidos: 'Ríos',
            correoInstitucional: 'marta@empresa.com',
            password: 'Temporal#2026',
            rol: 'jurado',
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('un docente se crea con su adscripción', async () => {
        const user = userEvent.setup();
        gestion.crearUsuario.mockResolvedValue({ id: 10 });
        const dialogo = await abrirDialogo(user);

        await user.selectOptions(dialogo.getByLabelText(/^Rol/), 'DOCENTE');
        await llenar(dialogo, user, { correo: 'pedro@unisimon.edu.co' });
        await user.selectOptions(dialogo.getByLabelText(/^Sede/), '1');
        await user.selectOptions(dialogo.getByLabelText(/^Facultad/), '2');
        await user.click(dialogo.getByRole('button', { name: 'Crear cuenta' }));

        expect(gestion.crearUsuario).toHaveBeenCalledWith(
            expect.objectContaining({ rol: 'docente', sedeId: 1, facultadId: 2, programaAcademicoId: null }),
        );
    });

    it('un correo repetido se muestra junto al campo', async () => {
        const user = userEvent.setup();
        gestion.crearUsuario.mockRejectedValue(
            Object.assign(new Error('El correo marta@empresa.com ya pertenece a otro usuario.'), { status: 409 }),
        );
        const dialogo = await abrirDialogo(user);

        await llenar(dialogo, user, { correo: 'marta@empresa.com' });
        await user.click(dialogo.getByRole('button', { name: 'Crear cuenta' }));

        expect(await dialogo.findByText('El correo marta@empresa.com ya pertenece a otro usuario.')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});

beforeEach(() => {
    gestion.crearUsuario.mockReset();
});
