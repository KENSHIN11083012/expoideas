import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Une clases condicionales y resuelve conflictos de Tailwind: la última gana
 * (cn('px-4', 'px-6') === 'px-6'). Permite a cada componente aceptar className.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/** Iniciales para avatares: "Ana María Pérez" -> "AP". */
export function iniciales(nombres = '', apellidos = '') {
    const letras = `${nombres.trim()[0] ?? ''}${apellidos.trim()[0] ?? ''}`;
    return letras.toUpperCase() || '?';
}
