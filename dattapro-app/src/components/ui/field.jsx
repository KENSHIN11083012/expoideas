import { useId, cloneElement, isValidElement } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Etiqueta técnica de Academic Nexus: JetBrains Mono en mayúsculas.
 */
export function Label({ className, ...props }) {
    return (
        <label
            data-slot="label"
            className={cn('font-mono text-[11px] font-medium uppercase tracking-wider text-on-surface-variant', className)}
            {...props}
        />
    );
}

/**
 * Campo de formulario: etiqueta, control, ayuda y error, conectados con los
 * atributos de accesibilidad (htmlFor, aria-invalid, aria-describedby).
 *
 * El control llega como hijo único; Field le inyecta id y atributos aria, así
 * que funciona con {...register('campo')} de react-hook-form.
 *
 * @param {string} label
 * @param {string} [error]    mensaje de error (errors.campo?.message)
 * @param {string} [hint]     texto de ayuda bajo el control
 * @param {boolean} [required]
 * @param {React.ReactNode} [aside] contenido a la derecha de la etiqueta (p. ej. un contador)
 */
export function Field({ label, error, hint, required, aside, className, children }) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    const control = isValidElement(children)
        ? cloneElement(children, {
            id: children.props.id ?? id,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
            'aria-required': required || undefined,
        })
        : children;

    return (
        <div data-slot="field" className={cn('flex flex-col gap-1.5', className)}>
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={children?.props?.id ?? id}>
                    {label}
                    {required && <span className="text-tertiary" aria-hidden="true"> *</span>}
                </Label>
                {aside}
            </div>
            {control}
            {error ? (
                <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-error">
                    <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className="text-xs text-on-surface-variant">{hint}</p>
            ) : null}
        </div>
    );
}
