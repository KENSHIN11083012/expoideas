import { describe, expect, it } from 'vitest';
import { PASSWORD_REQUIREMENTS, rules } from './validation';

const accepts = (password) => rules.password().safeParse(password).success;

describe('la contraseña', () => {
    it('pide entre 8 y 72 caracteres, con un número y un símbolo', () => {
        expect(accepts('Clave-2026')).toBe(true);
        expect(accepts('Corta-1')).toBe(false);
        expect(accepts('SinNumero-')).toBe(false);
        expect(accepts('SinSimbolo2026')).toBe(false);
        expect(accepts(`${'a'.repeat(70)}-1`)).toBe(true);
        expect(accepts(`${'a'.repeat(71)}-1`)).toBe(false);
    });

    // La API la guarda con BCrypt, que solo lee 72 bytes: una tilde o una ñ ocupan dos.
    it('cuenta bytes y no letras: 40 eñes ya pasan del límite', () => {
        const password = `${'ñ'.repeat(40)}-1`;

        expect(password).toHaveLength(42);
        expect(accepts(password)).toBe(false);
        expect(accepts(`${'ñ'.repeat(35)}-1`)).toBe(true);
    });

    it('la lista de requisitos marca el largo con la misma cuenta', () => {
        const length = PASSWORD_REQUIREMENTS[0];

        expect(length.text).toContain('72');
        expect(length.met('Clave-2026')).toBe(true);
        expect(length.met(`${'ñ'.repeat(40)}-1`)).toBe(false);
    });
});
