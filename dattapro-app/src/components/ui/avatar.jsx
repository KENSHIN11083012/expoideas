import { cn, iniciales } from '@/lib/utils';

const TAMANOS = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-20 text-2xl',
};

/** Foto del usuario o, si no tiene, sus iniciales sobre verde institucional. */
export function Avatar({ nombres, apellidos, fotoUrl, size = 'md', className }) {
    const nombreCompleto = `${nombres ?? ''} ${apellidos ?? ''}`.trim();

    if (fotoUrl) {
        return (
            <img
                src={fotoUrl}
                alt={nombreCompleto}
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
