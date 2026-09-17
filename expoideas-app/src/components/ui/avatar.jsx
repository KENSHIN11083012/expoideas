import { useState } from 'react';
import { cn, iniciales } from '@/lib/utils';

const TAMANOS = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-20 text-2xl',
};

/**
 * Foto del usuario o, si no tiene, sus iniciales sobre verde institucional.
 * Si la foto no carga (p. ej. se borró), también muestra las iniciales.
 */
export function Avatar({ nombres, apellidos, fotoUrl, size = 'md', className }) {
    const nombreCompleto = `${nombres ?? ''} ${apellidos ?? ''}`.trim();
    const [fotoFallida, setFotoFallida] = useState(null);

    if (fotoUrl && fotoUrl !== fotoFallida) {
        return (
            <img
                src={fotoUrl}
                alt={nombreCompleto}
                onError={() => setFotoFallida(fotoUrl)}
                className={cn('shrink-0 rounded-full object-cover', TAMANOS[size], className)}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-primary font-heading font-bold text-on-primary',
                TAMANOS[size],
                className,
            )}
        >
            {iniciales(nombres, apellidos)}
        </span>
    );
}
