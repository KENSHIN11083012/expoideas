import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, FileText, Save, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';
import { trackLabel } from '@/lib/tracks';
import { PageContainer } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, ErrorState, Skeleton } from '@/components/ui/feedback';
import { useProject } from '@/features/projects/queries';
import { formatDateTime } from '@/features/presentations/schemas';
import { RubricBoard } from './RubricBoard';
import { average, formatGrade, scaleLabel, scaleOf } from './grades';
import { useMyEvaluation, useRubric, useSaveEvaluation } from './queries';
import { evaluationSchema, fieldOf, formValues, serverFields, toRequest } from './schemas';

/** Avance y nota en vivo, con las dos acciones. Se queda a la vista al pie de la pantalla. */
function Summary({ rubric, control, saving, onAbsent }) {
    const scores = useWatch({ control, name: 'scores' });
    const chosen = rubric.criteria
        .map((criterion) => criterion.levels.find((level) => level.id === scores?.[fieldOf(criterion.id)]?.levelId))
        .filter(Boolean);
    const total = rubric.criteria.length;
    const grade = chosen.length === total ? average(chosen.map((level) => level.score)) : null;

    return (
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-soft sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {/* En celular la barra es baja para no tapar el tablero: una línea de avance y los dos botones en fila. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex items-baseline justify-between gap-4 sm:justify-start" aria-live="polite">
                    <p className="label-mono text-on-surface-variant">
                        {chosen.length} de {total} criterios
                    </p>
                    {grade === null ? (
                        <p className="hidden text-sm text-on-surface-variant sm:block">La nota aparece al calificar todos.</p>
                    ) : (
                        <p className="text-sm text-on-surface">
                            Nota: <strong className="font-heading text-2xl font-bold text-primary">{formatGrade(grade)}</strong> ·{' '}
                            {scaleLabel(scaleOf(grade))}
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-2 sm:flex">
                    <Button type="button" variant="outline" onClick={onAbsent} disabled={saving}>
                        <UserX /> No asistió
                    </Button>
                    <Button type="submit" disabled={saving}>
                        <Save /> {saving ? 'Guardando…' : 'Guardar evaluación'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/** El tablero con lo que ya se guardó (o vacío) y las acciones de guardar y de «no asistió». */
function EvaluationForm({ project, rubric, evaluation }) {
    const navigate = useNavigate();
    const save = useSaveEvaluation(project.id);
    const [confirmAbsent, setConfirmAbsent] = useState(false);
    const {
        control,
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors, isDirty },
    } = useForm({ resolver: zodResolver(evaluationSchema(rubric)), defaultValues: formValues(rubric, evaluation) });

    // Nada se guarda hasta pulsar el botón: si hay cambios, el navegador avisa antes de cerrar o recargar.
    useEffect(() => {
        if (!isDirty) return undefined;
        const warn = (event) => event.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    const done = (message) => {
        toast.success(message);
        navigate(ROUTES.JURY_PROJECTS);
    };

    const submit = async (values) => {
        try {
            await save.mutateAsync(toRequest(rubric, values));
            done('Evaluación guardada');
        } catch (error) {
            const fields = Object.entries(serverFields(error.body?.fields));
            if (fields.length === 0) {
                setError('root', { type: 'server', message: error.message });
                return;
            }
            fields.forEach(([field, message]) => setError(field, { type: 'server', message }));
            showFirstProblem(Object.fromEntries(fields.map(([field]) => [field.split('.')[1], true])));
        }
    };

    /** Lleva la vista al primer criterio con algo por corregir. */
    const showFirstProblem = (problems = {}) => {
        toast.error('Revisa los criterios marcados');
        const first = rubric.criteria.find((criterion) => problems[fieldOf(criterion.id)]);
        if (first) document.getElementById(`criterio-${first.id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    };

    const markAbsent = async () => {
        setConfirmAbsent(false);
        try {
            await save.mutateAsync({ absent: true });
            done('Quedó registrado que el equipo no asistió');
        } catch (error) {
            setError('root', { type: 'server', message: error.message });
        }
    };

    return (
        <>
            <form
                onSubmit={handleSubmit(submit, (invalid) => showFirstProblem(invalid.scores))}
                noValidate
                className="flex flex-col gap-6"
            >
                {evaluation?.absent && (
                    <Alert title="Marcaste que el equipo no asistió">
                        La evaluación vale 0.0. Si fue un error, califica los criterios y guarda.
                    </Alert>
                )}
                {evaluation && !evaluation.absent && (
                    <Alert
                        title={`Ya calificaste este proyecto: ${formatGrade(evaluation.grade)} · ${scaleLabel(evaluation.scale)}`}
                    >
                        La guardaste el {formatDateTime(evaluation.updatedAt)}; puedes corregirla y guardar de nuevo.
                    </Alert>
                )}

                <RubricBoard rubric={rubric} form={{ control, register, clearErrors, errors }} />

                {(errors.root || errors.scores?.message) && (
                    <Alert variant="error" title="No pudimos guardar la evaluación">
                        {errors.root?.message ?? errors.scores.message}
                    </Alert>
                )}

                <Summary rubric={rubric} control={control} saving={save.isPending} onAbsent={() => setConfirmAbsent(true)} />
            </form>

            <ConfirmDialog
                open={confirmAbsent}
                title="¿El equipo no asistió?"
                description={`La evaluación de "${project.title}" quedará en 0.0, sin niveles ni observaciones. Podrás corregirla después.`}
                confirmLabel="Sí, no asistió"
                onConfirm={markAbsent}
                onClose={() => setConfirmAbsent(false)}
            />
        </>
    );
}

/**
 * Donde un jurado califica un proyecto con la rúbrica de su cátedra. Solo entra
 * quien tiene el proyecto asignado: a los demás, la API les responde que no.
 */
export default function EvaluationPage() {
    const { id } = useParams();
    const project = useProject(id);
    const rubric = useRubric(project.data?.track);
    const evaluation = useMyEvaluation(id);

    const failed = [project, evaluation, rubric].find((query) => query.error);
    const back = (
        <Button variant="ghost" size="sm" asChild className="self-start">
            <Link to={ROUTES.JURY_PROJECTS}>
                <ArrowLeft /> Evaluar
            </Link>
        </Button>
    );

    if (failed) {
        return (
            <PageContainer>
                {back}
                <ErrorState title="No puedes calificar este proyecto" error={failed.error} onRetry={failed.refetch} />
            </PageContainer>
        );
    }
    if (project.isPending || rubric.isPending || evaluation.isPending) {
        return (
            <PageContainer>
                <Skeleton className="h-96 rounded" aria-busy="true" />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            {back}
            <PageHeader
                eyebrow={`${project.data.edition} · ${trackLabel(project.data.track)}`}
                title={project.data.title}
                description={`${rubric.data.name}. Elige un nivel en cada criterio: arrastra la ficha o toca el nivel.`}
                actions={
                    <Button variant="outline" asChild>
                        <Link to={ROUTES.project(project.data.id)}>
                            <FileText /> Ver proyecto y entregables
                        </Link>
                    </Button>
                }
            />
            <EvaluationForm project={project.data} rubric={rubric.data} evaluation={evaluation.data} />
        </PageContainer>
    );
}
