import { describe, expect, it } from 'vitest';
import {
    ROLES,
    esDeGestion,
    hasRole,
    homePathForRole,
    normalizeRole,
    puedeGestionar,
    requiereAdscripcion,
    roleLabel,
    rolesAsignablesPor,
} from './roles';

const { ADMIN, MACONDOLAB, DOCENTE, JURADO, ESTUDIANTE } = ROLES;
const TODOS = [ESTUDIANTE, DOCENTE, JURADO, MACONDOLAB, ADMIN];

describe('normalizeRole', () => {
    it.each([
        ['admin', ADMIN],
        ['ROLE_MACONDOLAB', MACONDOLAB],
        [['ROLE_JURADO'], JURADO],
        ['estudiante', ESTUDIANTE],
    ])('lleva %j a %s', (entrada, esperado) => {
        expect(normalizeRole(entrada)).toBe(esperado);
    });

    it('no reconoce los roles heredados de Dattapro', () => {
        expect(normalizeRole('emprendedor')).toBeNull();
        expect(normalizeRole('ROLE_MENTOR')).toBeNull();
        expect(roleLabel('emprendedor')).toBe('Usuario');
    });
});

describe('reglas por rol (espejo de RolUsuario en la API)', () => {
    it('solo MacondoLab y el administrador son de gestión', () => {
        expect(TODOS.filter(esDeGestion)).toEqual([MACONDOLAB, ADMIN]);
    });

    it('solo docentes y estudiantes declaran adscripción', () => {
        expect(TODOS.filter(requiereAdscripcion)).toEqual([ESTUDIANTE, DOCENTE]);
    });

    it('el administrador gestiona cualquier cuenta', () => {
        expect(TODOS.every((rol) => puedeGestionar(ADMIN, rol))).toBe(true);
        expect(rolesAsignablesPor(ADMIN)).toEqual(TODOS);
    });

    it('MacondoLab no gestiona cuentas de gestión', () => {
        expect(rolesAsignablesPor(MACONDOLAB)).toEqual([ESTUDIANTE, DOCENTE, JURADO]);
        expect(puedeGestionar('ROLE_MACONDOLAB', 'admin')).toBe(false);
    });

    it('docentes, jurados y estudiantes no gestionan cuentas', () => {
        for (const rol of [DOCENTE, JURADO, ESTUDIANTE]) {
            expect(rolesAsignablesPor(rol)).toEqual([]);
        }
        expect(rolesAsignablesPor(null)).toEqual([]);
    });
});

describe('navegación', () => {
    it('la gestión aterriza en Usuarios y el resto en el inicio', () => {
        expect(homePathForRole(MACONDOLAB)).toBe('/admin/usuarios');
        expect(homePathForRole('ROLE_ADMIN')).toBe('/admin/usuarios');
        expect(homePathForRole(JURADO)).toBe('/');
    });

    it('hasRole sin restricción deja pasar a cualquiera con sesión', () => {
        expect(hasRole(JURADO)).toBe(true);
        expect(hasRole(JURADO, [MACONDOLAB, ADMIN])).toBe(false);
        expect(hasRole('ROLE_MACONDOLAB', [MACONDOLAB, ADMIN])).toBe(true);
    });
});
