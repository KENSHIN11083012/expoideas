import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, esDeGestion } from '@/utils/roles';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));

/**
 * Prueba de humo del enrutador real: cada URL muestra su página y los guardias
 * redirigen según la sesión, el rol y los pasos de primer ingreso.
 */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const PERFIL = {
    id: 1,
    nombres: 'Marta',
    apellidos: 'Ríos',
    correoInstitucional: 'marta@unisimon.edu.co',
    rol: 'estudiante',
    sedeId: 1,
    facultadId: 1,
    programaAcademicoId: null,
    fotoId: null,
    pendientes: [],
};

const respuestaJson = (cuerpo) => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => cuerpo,
});

const sesion = ({ role = null, pendientes = [] } = {}) =>
    useAuth.mockReturnValue({
        token: role ? 'token' : null,
        role,
        pendientes,
        user: role ? { nombres: 'Marta', apellidos: 'Ríos', nombreCompleto: 'Marta Ríos', email: PERFIL.correoInstitucional, fotoId: null } : null,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        completarPendiente: vi.fn(),
        isAdmin: () => role === ROLES.ADMIN,
        esGestion: () => esDeGestion(role),
    });

const visitar = (ruta) => {
    window.history.pushState({}, '', `${BASE}${ruta}`);
    render(<App />);
};

// Las páginas se cargan con lazy(): la primera vez tardan más que el segundo por defecto.
const esperarPagina = async (titulo, ruta) => {
    expect(await screen.findByRole('heading', { level: 1, name: titulo }, { timeout: 5000 })).toBeInTheDocument();
    expect(window.location.pathname).toBe(`${BASE}${ruta}`);
};

const INICIO = /Las ideas de la Unisimón/;
const LOGIN = 'Bienvenido de nuevo';

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url) => respuestaJson(String(url).endsWith('/usuarios/me') ? PERFIL : [])));
});

describe('Sin sesión', () => {
    beforeEach(() => sesion());

    it.each([
        ['/', INICIO],
        ['/login', LOGIN],
        ['/register', 'Crea tu cuenta'],
        ['/unauthorized', 'No tienes acceso a esta sección'],
        ['/no-existe', 'Esta página no existe'],
    ])('%s muestra su página', async (ruta, titulo) => {
        visitar(ruta);
        await esperarPagina(titulo, ruta);
    });

    it.each(['/perfil', '/seguridad', '/admin/usuarios', '/admin/catalogos', '/primer-ingreso'])(
        '%s lleva al login',
        async (ruta) => {
            visitar(ruta);
            await esperarPagina(LOGIN, '/login');
        },
    );
});

describe('Estudiante al día', () => {
    beforeEach(() => sesion({ role: ROLES.ESTUDIANTE }));

    it.each([
        ['/perfil', 'Mi perfil'],
        ['/seguridad', 'Seguridad'],
    ])('%s muestra su página', async (ruta, titulo) => {
        visitar(ruta);
        await esperarPagina(titulo, ruta);
    });

    it.each(['/admin/usuarios', '/admin/catalogos'])('%s no está permitido', async (ruta) => {
        visitar(ruta);
        await esperarPagina('No tienes acceso a esta sección', '/unauthorized');
    });

    it.each(['/login', '/register', '/primer-ingreso'])('%s lleva al inicio', async (ruta) => {
        visitar(ruta);
        await esperarPagina(INICIO, '/');
    });
});

describe('Gestión', () => {
    beforeEach(() => sesion({ role: ROLES.MACONDOLAB }));

    it.each([
        ['/admin/usuarios', 'Usuarios'],
        ['/admin/catalogos', 'Catálogos'],
    ])('%s muestra su página', async (ruta, titulo) => {
        visitar(ruta);
        await esperarPagina(titulo, ruta);
    });

    it('al iniciar sesión llega a Usuarios', async () => {
        visitar('/login');
        await esperarPagina('Usuarios', '/admin/usuarios');
    });
});

describe('Primer ingreso pendiente', () => {
    beforeEach(() => sesion({ role: ROLES.DOCENTE, pendientes: ['cambiarPassword', 'autorizarDatos'] }));

    it.each(['/perfil', '/seguridad', '/admin/usuarios'])('%s lleva al primer ingreso', async (ruta) => {
        visitar(ruta);
        await esperarPagina('Crea tu contraseña', '/primer-ingreso');
    });

    it('el inicio público sigue disponible', async () => {
        visitar('/');
        await esperarPagina(INICIO, '/');
    });
});
