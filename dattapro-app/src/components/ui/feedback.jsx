import { CircleAlert, CircleCheck, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Bloque gris pulsante mientras carga el contenido. */
export function Skeleton({ className, ...props }) {
    return <div data-slot="skeleton" className={cn('animate-pulse rounded bg-surface-container-high', className)} {...props} />;
}

/** Indicador de carga de una sección o página completa. */
export function Spinner({ className, label = 'Cargando…' }) {
    return (
        <div role="status" className={cn('flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant', className)}>
            <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
        </div>
    );
}

const ALERTAS = {
    info: { clases: 'border-primary/20 bg-primary/5 text-on-surface', Icono: Info, icono: 'text-primary' },
    success: { clases: 'border-primary/25 bg-primary/10 text-on-primary-fixed-variant', Icono: CircleCheck, icono: 'text-primary' },
    error: { clases: 'border-error/25 bg-error-container text-on-error-container', Icono: CircleAlert, icono: 'text-error' },
};

/** Mensaje en línea (éxito, error o información). */
export function Alert({ variant = 'info', title, className, children }) {
    const { clases, Icono, icono } = ALERTAS[variant];
    return (
        <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-4 text-sm', clases, className)}>
            <Icono className={cn('mt-0.5 size-4 shrink-0', icono)} aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
                {title && <p className="font-semibold">{title}</p>}
                {children && <div>{children}</div>}
            </div>
        </div>
    );
}

/** Estado vacío de una lista o sección. */
export function EmptyState({ icon: Icono, title, description, action, className }) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant px-6 py-14 text-center', className)}>
            {Icono && (
                <span className="flex size-12 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                    <Icono className="size-6" aria-hidden="true" />
                </span>
            )}
            <div className="flex flex-col gap-1">
                <p className="font-heading text-base font-semibold text-on-surface">{title}</p>
                {description && <p className="max-w-sm text-sm text-on-surface-variant">{description}</p>}
            </div>
            {action}
        </div>
    );
}
