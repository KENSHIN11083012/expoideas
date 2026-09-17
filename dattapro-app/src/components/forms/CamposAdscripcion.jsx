import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Alert, Skeleton } from '@/components/ui/feedback';

/**
 * Sede, facultad y programa académico para formularios de react-hook-form.
 * El programa se filtra por la facultad elegida y es opcional: docentes y
 * mentores pueden pertenecer a una facultad sin estar en un programa.
 *
 * @param {object} form      { register, control, setValue, errors } del useForm
 * @param {object} catalogos resultado de useCatalogosAdscripcion()
 */
export function CamposAdscripcion({ form, catalogos, className }) {
    const { register, control, setValue, errors } = form;
    const { sedes, facultades, programas, isLoading, error } = catalogos;
    const facultadId = useWatch({ control, name: 'facultadId' });

    const programasDeLaFacultad = useMemo(
        () => programas.filter((p) => String(p.facultadId) === facultadId),
        [programas, facultadId],
    );

    // Al cambiar de facultad, un programa de la anterior deja de ser válido.
    const registroFacultad = register('facultadId');
    const onFacultadChange = (evento) => {
        registroFacultad.onChange(evento);
        setValue('programaAcademicoId', '', { shouldDirty: true });
    };

    if (error) {
        return <Alert variant="error" title="No pudimos cargar las sedes y facultades" className={className}>{error}</Alert>;
    }

    // Los <select> se montan cuando ya tienen opciones: si se montaran vacíos, el
    // valor inicial del formulario no encontraría su opción y se vería en blanco.
    if (isLoading) {
        return (
            <div className={className} aria-busy="true">
                <div className="grid gap-5 sm:grid-cols-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={i === 2 ? 'flex flex-col gap-1.5 sm:col-span-2' : 'flex flex-col gap-1.5'}>
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-11" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Sede" error={errors.sedeId?.message} required>
                    <NativeSelect {...register('sedeId')}>
                        <option value="">Selecciona tu sede</option>
                        {sedes.map((s) => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
                    </NativeSelect>
                </Field>

                <Field label="Facultad" error={errors.facultadId?.message} required>
                    <NativeSelect {...registroFacultad} onChange={onFacultadChange}>
                        <option value="">Selecciona tu facultad</option>
                        {facultades.map((f) => <option key={f.id} value={String(f.id)}>{f.nombre}</option>)}
                    </NativeSelect>
                </Field>

                <Field
                    label="Programa académico"
                    error={errors.programaAcademicoId?.message}
                    hint={
                        !facultadId
                            ? 'Primero elige la facultad.'
                            : programasDeLaFacultad.length === 0
                                ? 'Esta facultad aún no tiene programas registrados.'
                                : 'Opcional si eres docente o mentor.'
                    }
                    className="sm:col-span-2"
                >
                    <NativeSelect disabled={!facultadId} {...register('programaAcademicoId')}>
                        <option value="">{facultadId ? 'Sin programa' : '—'}</option>
                        {programasDeLaFacultad.map((p) => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
                    </NativeSelect>
                </Field>
            </div>
        </div>
    );
}
