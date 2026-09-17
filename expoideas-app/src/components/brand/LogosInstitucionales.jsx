import { cn } from '@/lib/utils';
import logoUnisimon from '@/assets/brand/logo-unisimon.png';
import logoMacondoLab from '@/assets/brand/logo-macondolab.png';

const TAMANOS = {
    sm: { logo: 'h-9', separador: 'h-7', gap: 'gap-3' },
    md: { logo: 'h-12', separador: 'h-9', gap: 'gap-4' },
    lg: { logo: 'h-14 sm:h-16', separador: 'h-10 sm:h-12', gap: 'gap-4 sm:gap-5' },
};

/**
 * Logos de la Universidad Simón Bolívar y MacondoLab, lado a lado con un
 * separador, como en la pieza institucional.
 *
 * El verde y el gris de los logos pierden contraste sobre fondos oscuros: ahí
 * hay que darle fondo blanco con className (p. ej. `bg-white px-4 py-3`).
 *
 * @param {'sm'|'md'|'lg'} [size]
 */
export function LogosInstitucionales({ size = 'md', className }) {
    const t = TAMANOS[size];

    return (
        <div className={cn('inline-flex items-center rounded-lg', t.gap, className)}>
            <img src={logoUnisimon} alt="Universidad Simón Bolívar" className={cn('w-auto object-contain', t.logo)} />
            <span className={cn('w-px bg-outline-variant', t.separador)} aria-hidden="true" />
            <img
                src={logoMacondoLab}
                alt="MacondoLab, Centro de Crecimiento Empresarial e Innovación"
                className={cn('w-auto object-contain', t.logo)}
            />
        </div>
    );
}
