import { Controller } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Autorización de tratamiento de datos personales (Ley 1581 de 2012) para
 * formularios de react-hook-form. La usan el registro y el primer ingreso de
 * las cuentas creadas desde la gestión.
 */
export function CampoAutorizacionDatos({ control }) {
    const name = 'autorizaDatos';
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-start gap-3 rounded-lg border border-outline-variant/70 bg-surface-container-low p-4">
                        <Checkbox
                            id={name}
                            checked={field.value}
                            onCheckedChange={(valor) => field.onChange(valor === true)}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            aria-invalid={fieldState.error ? true : undefined}
                            aria-describedby={fieldState.error ? `${name}-error` : undefined}
                            className="mt-0.5"
                        />
                        <label htmlFor={name} className="text-sm leading-relaxed text-on-surface">
                            Autorizo a la Universidad Simón Bolívar el tratamiento de mis datos personales conforme a la
                            Ley 1581 de 2012.
                        </label>
                    </div>
                    {fieldState.error && (
                        <p id={`${name}-error`} role="alert" className="text-xs font-medium text-error">
                            {fieldState.error.message}
                        </p>
                    )}
                </div>
            )}
        />
    );
}
