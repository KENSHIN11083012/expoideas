import { cn } from '@/lib/utils';

/*
 * Marca PROVISIONAL de Expoideas mientras no exista el logo oficial: monograma
 * "E" en verde institucional con un punto lima (la "idea") y el nombre en la
 * fuente de títulos. Cuando llegue el logo se reemplaza solo este archivo y los
 * iconos de public/ (favicon.svg, apple-touch-icon.png).
 */

const TAMANOS = {
    sm: { icono: 'size-7', texto: 'text-lg' },
    md: { icono: 'size-9', texto: 'text-xl' },
    lg: { icono: 'size-11', texto: 'text-3xl' },
};

/** Solo el monograma; mismo dibujo que public/favicon.svg. */
export function MonogramaExpoideas({ className }) {
    return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
            <rect width="32" height="32" rx="7" fill="#006735" />
            <rect x="8" y="7" width="4.5" height="18" fill="#ffffff" />
            <rect x="8" y="7" width="15" height="4.5" fill="#ffffff" />
            <rect x="8" y="13.75" width="11" height="4.5" fill="#ffffff" />
            <rect x="8" y="20.5" width="10.5" height="4.5" fill="#ffffff" />
            <rect x="20.5" y="20.5" width="4.5" height="4.5" fill="#d9ea3a" />
        </svg>
    );
}

/**
 * Monograma + nombre.
 *
 * @param {'sm'|'md'|'lg'} [size]
 * @param {'oscuro'|'claro'} [tono] "claro" para fondos oscuros o verdes
 * @param {boolean} [soloIcono]
 */
export function MarcaExpoideas({ size = 'md', tono = 'oscuro', soloIcono = false, className }) {
    const t = TAMANOS[size];

    return (
        <span className={cn('inline-flex items-center gap-2.5', className)}>
            <MonogramaExpoideas className={cn('shrink-0', t.icono)} />
            {soloIcono ? (
                <span className="sr-only">Expoideas</span>
            ) : (
                <span
                    className={cn(
                        'font-heading font-extrabold leading-none tracking-tight',
                        t.texto,
                        tono === 'claro' ? 'text-on-primary' : 'text-on-surface',
                    )}
                >
                    Expo<span className={tono === 'claro' ? 'text-secondary-container' : 'text-primary'}>ideas</span>
                </span>
            )}
        </span>
    );
}
