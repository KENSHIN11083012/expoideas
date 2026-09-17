import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REQUISITOS_PASSWORD } from '@/utils/validaciones';

/** Lista de requisitos de la contraseña que se marca mientras se escribe. */
export function RequisitosPassword({ valor = '', className }) {
    return (
        <ul className={cn('grid gap-1 text-xs sm:grid-cols-3', className)} aria-label="Requisitos de la contraseña">
            {REQUISITOS_PASSWORD.map(({ texto, cumple }) => {
                const ok = cumple(valor);
                return (
                    <li key={texto} className={cn('flex items-center gap-1.5', ok ? 'text-primary' : 'text-on-surface-variant')}>
                        {ok ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className="size-3" aria-hidden="true" />}
                        <span>{texto}</span>
                        <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
                    </li>
                );
            })}
        </ul>
    );
}
