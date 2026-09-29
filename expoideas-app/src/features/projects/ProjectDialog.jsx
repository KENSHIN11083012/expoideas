import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { byName } from '@/lib/text';
import { TRACK_LIST, trackLabel } from '@/lib/tracks';
import { handleFormError } from '@/lib/validation';
import { CATALOG_PATHS } from '@/features/catalogs/api';
import { useCatalogItems } from '@/features/catalogs/queries';
import { useEditions } from '@/features/editions/queries';
import { FormDialog } from '@/components/forms/FormDialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/feedback';
import { useSaveProject, useTeachers } from './queries';
import { projectSchema, toFormValues, toProjectRequest } from './schemas';

/**
 * Inscripción de un proyecto y edición de sus datos.
 *
 * La edición y la cátedra solo se eligen al inscribir: después el proyecto se
 * queda donde está, y si el grupo vuelve a participar inscribe otro.
 *
 * @param {object|null} project  null para inscribir
 */
export function ProjectDialog({ project, onClose }) {
    const editing = Boolean(project);
    const save = useSaveProject();

    const { data: editions = [], isPending: loadingEditions } = useEditions();
    const { data: sectors = [], isPending: loadingSectors } = useCatalogItems(CATALOG_PATHS.sectors);
    const { data: teachers = [], isPending: loadingTeachers } = useTeachers();

    const openEditions = editions.filter((edition) => edition.registrationOpen);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: toFormValues(project),
    });

    const submit = async (values) => {
        const body = toProjectRequest(values);
        try {
            await save.mutateAsync({ id: project?.id, body });
            toast.success(editing ? 'Los datos del proyecto se actualizaron' : `"${body.title}" quedó inscrito`);
            onClose();
        } catch (error) {
            handleFormError(error, setError);
        }
    };

    const loading = loadingEditions || loadingSectors || loadingTeachers;

    return (
        <FormDialog
            title={editing ? 'Editar proyecto' : 'Inscribir proyecto'}
            description={
                editing
                    ? 'Puedes cambiar estos datos mientras la inscripción siga abierta.'
                    : 'Quedas como líder del equipo y desde ahí invitas a tus compañeros.'
            }
            onClose={onClose}
            onSubmit={handleSubmit(submit)}
            error={errors.root?.message}
            submitLabel={editing ? 'Guardar cambios' : 'Inscribir'}
            submitting={isSubmitting}
            submitDisabled={editing && !isDirty}
        >
            {loading ? (
                <Skeleton className="h-64" aria-busy="true" />
            ) : (
                <>
                    {!editing && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Edición"
                                error={errors.editionId?.message}
                                hint={
                                    openEditions.length === 0 ? 'No hay ninguna edición con inscripciones abiertas.' : undefined
                                }
                                required
                            >
                                <NativeSelect {...register('editionId')}>
                                    <option value="">Selecciona la edición</option>
                                    {openEditions.map((edition) => (
                                        <option key={edition.id} value={String(edition.id)}>
                                            {edition.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field label="Cátedra" error={errors.track?.message} required>
                                <NativeSelect {...register('track')}>
                                    <option value="">Selecciona la cátedra</option>
                                    {TRACK_LIST.map((track) => (
                                        <option key={track} value={track}>
                                            {trackLabel(track)}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                        </div>
                    )}

                    <Field label="Título del proyecto" error={errors.title?.message} required>
                        <Input autoComplete="off" autoFocus={!editing} {...register('title')} />
                    </Field>

                    <Field
                        label="Propuesta de valor"
                        error={errors.summary?.message}
                        hint="Qué problema resuelven, con qué y para quién. Máximo 500 caracteres."
                        required
                    >
                        <Textarea {...register('summary')} />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Sector" error={errors.sectorId?.message} required>
                            <NativeSelect {...register('sectorId')}>
                                <option value="">Selecciona el sector</option>
                                {[...sectors].sort(byName).map((sector) => (
                                    <option key={sector.id} value={String(sector.id)}>
                                        {sector.name}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field
                            label="Docente del grupo"
                            error={errors.teacherId?.message}
                            hint={teachers.length === 0 ? 'Todavía no hay docentes registrados.' : undefined}
                            required
                        >
                            <NativeSelect {...register('teacherId')}>
                                <option value="">Selecciona el docente</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={String(teacher.id)}>
                                        {teacher.fullName}
                                        {teacher.faculty ? ` · ${teacher.faculty}` : ''}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                    </div>
                </>
            )}
        </FormDialog>
    );
}
