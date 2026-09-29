import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { trackLabel } from '@/lib/tracks';
import { handleFormError } from '@/lib/validation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useDeliverableTypes, useSaveDeliverableType } from './queries';
import { KINDS, deliverableTypeSchema, kindLabel, toTypeFormValues, toTypeRequest } from './schemas';

/** Alta y edición de un entregable, dentro del mismo diálogo que la lista. */
function TypeForm({ type, editionId, track, onDone, onCancel }) {
    const save = useSaveDeliverableType(editionId, track);
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(deliverableTypeSchema), defaultValues: toTypeFormValues(type) });

    const submit = async (values) => {
        try {
            await save.mutateAsync({ id: type?.id, body: toTypeRequest(values, editionId, track) });
            toast.success(type ? 'El entregable se actualizó' : `"${values.name}" se agregó`);
            onDone();
        } catch (error) {
            if (error.status === 409) {
                setError('name', { type: 'server', message: 'Ya hay un entregable con ese nombre' }, { shouldFocus: true });
            } else {
                handleFormError(error, setError);
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit(submit)}
            noValidate
            className="flex flex-col gap-4 rounded border border-outline-variant/60 bg-surface-container-low p-4"
        >
            <Field label="Nombre" error={errors.name?.message} required>
                <Input autoComplete="off" autoFocus {...register('name')} />
            </Field>
            <Field
                label="Descripción"
                error={errors.description?.message}
                hint="Qué se espera y en qué condiciones. Lo lee el equipo antes de subir."
            >
                <Textarea rows={2} {...register('description')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Archivos aceptados" error={errors.kind?.message} required>
                    <NativeSelect {...register('kind')}>
                        {Object.values(KINDS).map((kind) => (
                            <option key={kind} value={kind}>
                                {kindLabel(kind)}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <Field label="Máximo de archivos" error={errors.maxFiles?.message} required>
                    <Input type="number" min="1" max="10" {...register('maxFiles')} />
                </Field>
            </div>
            <Controller
                control={control}
                name="required"
                render={({ field }) => (
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="deliverable-required"
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            onBlur={field.onBlur}
                            ref={field.ref}
                        />
                        <label htmlFor="deliverable-required" className="text-sm text-on-surface">
                            Es obligatorio: sin él, el proyecto queda incompleto
                        </label>
                    </div>
                )}
            />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" size="sm" loading={isSubmitting}>
                    {type ? 'Guardar cambios' : 'Agregar'}
                </Button>
            </div>
        </form>
    );
}

function TypeRow({ type, onEdit, onDelete }) {
    return (
        <li className="flex items-start justify-between gap-3 rounded border border-outline-variant/60 px-4 py-3">
            <div className="flex flex-col gap-1">
                <p className="font-medium text-on-surface">{type.name}</p>
                {type.description && <p className="text-sm text-on-surface-variant">{type.description}</p>}
                <div className="flex flex-wrap gap-2">
                    <Badge variant={type.required ? 'primary' : 'outline'}>{type.required ? 'Obligatorio' : 'Opcional'}</Badge>
                    <Badge variant="outline">{kindLabel(type.kind)}</Badge>
                    <Badge variant="outline">{type.maxFiles === 1 ? 'Un archivo' : `Hasta ${type.maxFiles} archivos`}</Badge>
                </div>
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Editar ${type.name}`}>
                    <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Eliminar ${type.name}`}>
                    <Trash2 />
                </Button>
            </div>
        </li>
    );
}

/**
 * Los entregables que pide una cátedra en una edición: el póster, las fotos del
 * prototipo, las evidencias de validación. Los define MacondoLab y son datos,
 * no código: cambiarlos no necesita un despliegue nuevo.
 */
export function DeliverableTypesDialog({ edition, track, onClose }) {
    const { data: types = [], isPending, error, refetch } = useDeliverableTypes(edition.id, track);
    const save = useSaveDeliverableType(edition.id, track);
    const [form, setForm] = useState(null); // { type: null | registro }
    const [confirm, setConfirm] = useState(null);

    const remove = async () => {
        try {
            await save.mutateAsync({ id: confirm.id, remove: true });
            toast.success(`"${confirm.name}" se eliminó`);
        } catch (deleteError) {
            toast.error(deleteError.message);
        } finally {
            setConfirm(null);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Entregables de {trackLabel(track)}</DialogTitle>
                    <DialogDescription>Lo que los proyectos de esta cátedra deben subir en {edition.name}.</DialogDescription>
                </DialogHeader>
                <DialogBody className="flex flex-col gap-4">
                    {error ? (
                        <ErrorState title="No pudimos cargar los entregables" error={error} onRetry={refetch} />
                    ) : isPending ? (
                        <Skeleton className="h-32" aria-busy="true" />
                    ) : types.length === 0 && !form ? (
                        <EmptyState
                            icon={FileText}
                            title="Esta cátedra todavía no pide entregables"
                            description="Agrega el primero para que los equipos sepan qué subir."
                        />
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {types.map((type) => (
                                <TypeRow
                                    key={type.id}
                                    type={type}
                                    onEdit={() => setForm({ type })}
                                    onDelete={() => setConfirm(type)}
                                />
                            ))}
                        </ul>
                    )}

                    {form ? (
                        <TypeForm
                            type={form.type}
                            editionId={edition.id}
                            track={track}
                            onDone={() => setForm(null)}
                            onCancel={() => setForm(null)}
                        />
                    ) : (
                        <Button variant="outline" size="sm" className="self-start" onClick={() => setForm({ type: null })}>
                            <Plus /> Agregar entregable
                        </Button>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button type="button" onClick={onClose}>
                        Listo
                    </Button>
                </DialogFooter>
            </DialogContent>

            <ConfirmDialog
                open={Boolean(confirm)}
                title="¿Eliminar el entregable?"
                description={`"${confirm?.name ?? ''}" dejará de pedirse en esta cátedra.`}
                confirmLabel="Eliminar"
                onConfirm={remove}
                onClose={() => setConfirm(null)}
            />
        </Dialog>
    );
}
