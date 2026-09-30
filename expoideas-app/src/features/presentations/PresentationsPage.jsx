import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CalendarPlus, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';
import { TRACK_LIST, trackLabel } from '@/lib/tracks';
import { useEditions } from '@/features/editions/queries';
import { useProjectDirectory } from '@/features/projects/directory';
import { PageContainer } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { PresentationDialog } from './PresentationDialog';
import { usePresentationAgenda, useSchedulePresentation } from './queries';
import { formatDateTime } from './schemas';

/** La cita de un proyecto, o que todavía no la tiene. */
function Appointment({ presentation }) {
    if (!presentation) {
        return <Badge variant="outline">Sin programar</Badge>;
    }
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-on-surface">{formatDateTime(presentation.startsAt)}</p>
            <p className="text-sm text-on-surface-variant">{presentation.place}</p>
            {presentation.notes && <p className="text-xs text-on-surface-variant">{presentation.notes}</p>}
        </div>
    );
}

function Actions({ row, onSchedule, onCancel }) {
    return (
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onSchedule(row)}>
                {row.presentation ? <Pencil /> : <CalendarPlus />} {row.presentation ? 'Cambiar' : 'Programar'}
            </Button>
            {row.presentation && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(row)}
                    aria-label={`Quitar la sustentación de ${row.title}`}
                >
                    <X /> Quitar
                </Button>
            )}
        </div>
    );
}

/**
 * La agenda de sustentaciones de una cátedra en una edición. Cada proyecto
 * inscrito aparece con su cita o sin ella; programar o cambiar una avisa por
 * correo al equipo y al profesor. Es una pantalla de la gestión.
 */
export default function PresentationsPage() {
    const { data: editions = [], isPending: loadingEditions } = useEditions();
    const [editionId, setEditionId] = useState('');
    const [track, setTrack] = useState(TRACK_LIST[0]);
    // Por defecto, la edición con inscripciones o entregas abiertas; si no, la más reciente.
    const selectedEdition = editionId || String(editions.find((edition) => edition.submissionOpen)?.id ?? editions[0]?.id ?? '');

    const filters = useMemo(() => ({ editionId: selectedEdition, track }), [selectedEdition, track]);
    const projects = useProjectDirectory(filters);
    const agenda = usePresentationAgenda(selectedEdition, track);
    const schedule = useSchedulePresentation(selectedEdition, track);
    const [dialog, setDialog] = useState(null); // { row }
    const [confirm, setConfirm] = useState(null); // row

    const rows = useMemo(() => {
        const byProject = new Map((agenda.data ?? []).map((item) => [item.projectId, item]));
        const list = (projects.data ?? []).map((project) => ({ ...project, presentation: byProject.get(project.id) ?? null }));
        // Primero las citas en orden de fecha; después, lo que falta por programar.
        return list.sort((a, b) => {
            if (a.presentation && b.presentation) return a.presentation.startsAt.localeCompare(b.presentation.startsAt);
            if (a.presentation) return -1;
            if (b.presentation) return 1;
            return a.title.localeCompare(b.title, 'es');
        });
    }, [projects.data, agenda.data]);

    const pending = rows.filter((row) => !row.presentation).length;
    const error = projects.error ?? agenda.error;
    const isPending = loadingEditions || projects.isPending || agenda.isPending;

    const cancel = async () => {
        try {
            await schedule.mutateAsync({ projectId: confirm.id });
            toast.success(`Se quitó la sustentación de "${confirm.title}"`);
        } catch (cancelError) {
            toast.error(cancelError.message);
        } finally {
            setConfirm(null);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                eyebrow="Gestión"
                title="Sustentaciones"
                description="Asigna fecha, hora y lugar a cada proyecto. El equipo y el profesor del grupo reciben el aviso por correo."
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Edición">
                    <NativeSelect value={selectedEdition} onChange={(event) => setEditionId(event.target.value)}>
                        {editions.map((edition) => (
                            <option key={edition.id} value={String(edition.id)}>
                                {edition.name}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
                <Field label="Cátedra">
                    <NativeSelect value={track} onChange={(event) => setTrack(event.target.value)}>
                        {TRACK_LIST.map((item) => (
                            <option key={item} value={item}>
                                {trackLabel(item)}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
            </div>

            {error ? (
                <ErrorState
                    title="No pudimos cargar la agenda"
                    error={error}
                    onRetry={() => {
                        projects.refetch();
                        agenda.refetch();
                    }}
                />
            ) : !selectedEdition && !loadingEditions ? (
                <EmptyState
                    icon={CalendarClock}
                    title="Todavía no hay ediciones"
                    description="Crea una edición y configura sus cátedras para poder programar sustentaciones."
                />
            ) : isPending ? (
                <div className="flex flex-col gap-2" aria-hidden="true">
                    {[0, 1, 2].map((index) => (
                        <Skeleton key={index} className="h-16 rounded" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={CalendarClock}
                    title="No hay proyectos inscritos en esta cátedra"
                    description="Cuando los equipos inscriban sus proyectos, aparecerán aquí para programarles la sustentación."
                />
            ) : (
                <>
                    <p className="label-mono text-on-surface-variant" aria-live="polite">
                        {rows.length} {rows.length === 1 ? 'proyecto' : 'proyectos'} ·{' '}
                        {pending === 0 ? 'todos con sustentación' : `${pending} sin programar`}
                    </p>

                    <ul className="flex flex-col gap-3 md:hidden" aria-label="Agenda">
                        {rows.map((row) => (
                            <li key={row.id}>
                                <Card className="flex flex-col gap-3 p-5">
                                    <div className="flex flex-col gap-1">
                                        <Link to={ROUTES.project(row.id)} className="font-semibold text-primary hover:underline">
                                            {row.title}
                                        </Link>
                                        <p className="text-sm text-on-surface-variant">
                                            {row.leader} · {row.teacher}
                                        </p>
                                    </div>
                                    <Appointment presentation={row.presentation} />
                                    <Actions row={row} onSchedule={(item) => setDialog({ row: item })} onCancel={setConfirm} />
                                </Card>
                            </li>
                        ))}
                    </ul>

                    <Card className="hidden overflow-hidden md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-outline-variant/60 bg-surface-container-low">
                                <tr className="label-mono text-on-surface-variant">
                                    <th scope="col" className="px-5 py-3">
                                        Proyecto
                                    </th>
                                    <th scope="col" className="px-5 py-3">
                                        Sustentación
                                    </th>
                                    <th scope="col" className="px-5 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/50">
                                {rows.map((row) => (
                                    <tr key={row.id} className="transition-colors hover:bg-surface-container-low/60">
                                        <td className="px-5 py-3">
                                            <Link
                                                to={ROUTES.project(row.id)}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {row.title}
                                            </Link>
                                            <p className="text-xs text-on-surface-variant">
                                                {row.leader} · Profesor: {row.teacher}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <Appointment presentation={row.presentation} />
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <Actions
                                                row={row}
                                                onSchedule={(item) => setDialog({ row: item })}
                                                onCancel={setConfirm}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </>
            )}

            {dialog && (
                <PresentationDialog
                    project={dialog.row}
                    presentation={dialog.row.presentation}
                    editionId={selectedEdition}
                    track={track}
                    onClose={() => setDialog(null)}
                />
            )}

            <ConfirmDialog
                open={Boolean(confirm)}
                title="¿Quitar la sustentación?"
                description={`"${confirm?.title ?? ''}" queda sin fecha. No se envía ningún correo: avisa al equipo por tu cuenta.`}
                confirmLabel="Quitar"
                onConfirm={cancel}
                onClose={() => setConfirm(null)}
            />
        </PageContainer>
    );
}
