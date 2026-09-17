import { describe, expect, it } from 'vitest';
import { ROLES } from '@/utils/roles';
import { nuevaCuentaSchemaPara } from './usuario';

const base = {
    nombres: 'Marta',
    apellidos: 'Ríos',
    password: 'Temporal#2026',
    sedeId: '',
    facultadId: '',
    programaAcademicoId: '',
};

/** Campos con error, en el orden en que los reporta zod. */
const camposConError = (rol, datos) => {
    const resultado = nuevaCuentaSchemaPara(rol).safeParse({ ...base, rol, ...datos });
    return resultado.success ? [] : resultado.error.issues.map((issue) => issue.path.join('.'));
};

describe('nuevaCuentaSchemaPara', () => {
    it('un jurado puede tener correo externo y no lleva adscripción', () => {
        expect(camposConError(ROLES.JURADO, { correoInstitucional: 'marta@empresa.com' })).toEqual([]);
    });

    it('un jurado igual necesita un correo válido', () => {
        expect(camposConError(ROLES.JURADO, { correoInstitucional: 'marta' })).toEqual(['correoInstitucional']);
    });

    it('un docente exige correo institucional, sede y facultad', () => {
        expect(camposConError(ROLES.DOCENTE, { correoInstitucional: 'pedro@gmail.com' })).toEqual([
            'correoInstitucional',
            'sedeId',
            'facultadId',
        ]);
    });

    it('un estudiante con correo institucional y adscripción es válido; el programa es opcional', () => {
        expect(
            camposConError(ROLES.ESTUDIANTE, { correoInstitucional: 'ana@unisimon.edu.co', sedeId: '1', facultadId: '2' }),
        ).toEqual([]);
    });

    it('MacondoLab usa correo institucional y no lleva adscripción', () => {
        expect(camposConError(ROLES.MACONDOLAB, { correoInstitucional: 'coordinacion@unisimon.edu.co' })).toEqual([]);
        expect(camposConError(ROLES.MACONDOLAB, { correoInstitucional: 'coordinacion@gmail.com' })).toEqual([
            'correoInstitucional',
        ]);
    });

    it('la contraseña temporal cumple la misma regla que el registro', () => {
        expect(
            camposConError(ROLES.JURADO, { correoInstitucional: 'marta@empresa.com', password: 'temporal' }),
        ).toEqual(['password']);
    });

    it('recorta espacios del correo antes de validarlo', () => {
        const resultado = nuevaCuentaSchemaPara(ROLES.JURADO).safeParse({
            ...base,
            rol: ROLES.JURADO,
            correoInstitucional: '  marta@empresa.com ',
        });
        expect(resultado.success).toBe(true);
        expect(resultado.data.correoInstitucional).toBe('marta@empresa.com');
    });
});
