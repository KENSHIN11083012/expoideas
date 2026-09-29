import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Crown, LogOut, Pencil, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';
import { trackLabel } from '@/lib/tracks';
import { handleFormError } from '@/lib/validation';
import { useAuth } from '@/features/auth/useAuth';
import { PageContainer } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ProjectDeliverables } from '@/features/deliverables/ProjectDeliverables';
import { useDeleteProject, useInviteMember, useProject, useRemoveMember } from './queries';
import { invitationSchema } from './schemas';
import { ProjectDialog } from './ProjectDialog';

/** Formulario para invitar por correo. Solo lo ve el líder. */
function InviteForm({ projectId, disabled }) {
    const invite = useInviteMember(projectId);
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(invitationSchema), defaultValues: { email: '' } });

    const submit = async ({ email }) => {
        try {
            await invite.mutateAsync(email);
            toast.success(`Invitamos a ${email}`);
            reset();
        } catch (error) {
            if (error.status === 409) {
                setError('email', { type: 'server', message: error.message }, { shouldFocus: true });
            } else {
                handleFormError(error, setError);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Field
                label="Invitar a un compañero"
                error={errors.email?.message ?? errors.root?.message}
                hint="Debe tener cuenta en Expoideas."
                className="flex-1"
            >
                <Input type="email" autoComplete="off" placeholder="nombre@unisimon.edu.co" {...register('email')} />
            </Field>
            <Button type="submit" loading={isSubmitting} disabled={disabled} className="sm:mt-6">
                <UserPlus /> Invitar
            </Button>
        </form>
    );
}

function TeamMember({ member, canRemove, isMe, onRemove }) {
    return (
        <li className="flex items-center justify-between gap-3 rounded border border-outline-variant/60 px-4 py-3">
            <div className="flex flex-col gap-0.5">
                <p className="flex items-center gap-2 font-medium text-on-surface">
                    {member.fullName}
                    {member.teamRole === 'LEADER' && (
                        <Badge variant="lime">
                            <Crown className="size-3" aria-hidden="true" /> Líder
                        </Badge>
                    )}
                    {member.status === 'INVITED' && <Badge variant="outline">Invitación enviada</Badge>}
                </p>
                <p className="text-xs text-on-surface-variant">{member.email}</p>
            </div>
            {canRemove && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRemove}
                    aria-label={isMe ? 'Salir del equipo' : `Quitar a ${member.fullName}`}
                >
                    {isMe ? <LogOut /> : <X />}
                </Button>
            )}
        </li>
    );
}

/**
 * Un proyecto con su equipo. El líder edita los datos, invita, quita
 * integrantes y puede eliminar la inscripción; los demás pueden salirse.
 * Todo eso, mientras la inscripción de la edición siga abierta.
 */
export default function ProjectPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: project, isPending, error, refetch } = useProject(id);
    const removeMember = useRemoveMember(id);
    const deleteProject = useDeleteProject();
    const [editing, setEditing] = useState(false);
    const [confirm, setConfirm] = useState(null); // { member } | { project: true }

    if (error) {
        return (
            <PageContainer>
                <ErrorState title="No pudimos cargar el proyecto" error={error} onRetry={refetch} />
            </PageContainer>
        );
    }
    if (isPending) {
        return (
            <PageContainer>
                <Skeleton className="h-72 rounded" aria-busy="true" />
            </PageContainer>
        );
    }

    const me = project.members.find((member) => member.userId === user?.id);
    const isLeader = me?.teamRole === 'LEADER';
    const open = project.registrationOpen;
    const accepted = project.members.filter((member) => member.status === 'ACCEPTED').length;
    const full = project.members.length >= project.maxMembers;

    const removeFromTeam = async (member) => {
        try {
            await removeMember.mutateAsync(member.userId);
            toast.success(member.userId === user?.id ? 'Saliste del equipo' : `${member.fullName} salió del equipo`);
            if (member.userId === user?.id) {
                navigate(ROUTES.MY_PROJECTS);
            }
        } catch (removeError) {
            toast.error(removeError.message);
        } finally {
            setConfirm(null);
        }
    };

    const remove = async () => {
        try {
            await deleteProject.mutateAsync(project.id);
            toast.success('La inscripción se eliminó');
            navigate(ROUTES.MY_PROJECTS);
        } catch (deleteError) {
            toast.error(deleteError.message);
        } finally {
            setConfirm(null);
        }
    };

    return (
        <PageContainer>
            <Button variant="ghost" size="sm" asChild className="self-start">
                <Link to={ROUTES.MY_PROJECTS}>
                    <ArrowLeft /> Mis proyectos
                </Link>
            </Button>

            <PageHeader
                eyebrow={`${project.edition} · ${trackLabel(project.track)}`}
                title={project.title}
                description={project.summary}
                actions={
                    isLeader &&
                    open && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditing(true)}>
                                <Pencil /> Editar
                            </Button>
                            <Button variant="outline" onClick={() => setConfirm({ project: true })}>
                                <Trash2 /> Eliminar
                            </Button>
                        </div>
                    )
                }
            />

            <Card className="flex flex-col gap-4 p-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="label-mono text-on-surface-variant">Sector</dt>
                        <dd className="text-on-surface">{project.sector}</dd>
                    </div>
                    <div>
                        <dt className="label-mono text-on-surface-variant">Docente del grupo</dt>
                        <dd className="text-on-surface">{project.teacher}</dd>
                    </div>
                </dl>
                {!open && (
                    <p className="text-sm text-on-surface-variant">
                        Las inscripciones de {project.edition} ya cerraron: el equipo y los datos quedaron fijos.
                    </p>
                )}
            </Card>

            <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-heading text-lg font-bold text-on-surface">Equipo</h2>
                    <p className="label-mono text-on-surface-variant">
                        {accepted} de {project.maxMembers} integrantes · mínimo {project.minMembers}
                    </p>
                </div>

                <ul className="flex flex-col gap-2">
                    {project.members.map((member) => (
                        <TeamMember
                            key={member.userId}
                            member={member}
                            isMe={member.userId === user?.id}
                            canRemove={open && member.teamRole !== 'LEADER' && (isLeader || member.userId === user?.id)}
                            onRemove={() => setConfirm({ member })}
                        />
                    ))}
                </ul>

                {isLeader && open && <InviteForm projectId={project.id} disabled={full} />}
                {isLeader && open && full && (
                    <p className="text-sm text-on-surface-variant">
                        El equipo llegó al máximo de {project.maxMembers} integrantes.
                    </p>
                )}
            </section>

            <ProjectDeliverables project={project} isMember={me?.status === 'ACCEPTED'} />

            {editing && <ProjectDialog project={project} onClose={() => setEditing(false)} />}

            <ConfirmDialog
                open={Boolean(confirm)}
                title={confirm?.project ? '¿Eliminar la inscripción?' : '¿Quitar del equipo?'}
                description={
                    confirm?.project
                        ? `"${project.title}" y su equipo se eliminan. Esta acción no se puede deshacer.`
                        : confirm?.member?.userId === user?.id
                          ? `Vas a salir del equipo de "${project.title}".`
                          : `${confirm?.member?.fullName ?? ''} dejará de estar en el equipo.`
                }
                confirmLabel={confirm?.project ? 'Eliminar' : 'Quitar'}
                onConfirm={() => (confirm?.project ? remove() : removeFromTeam(confirm.member))}
                onClose={() => setConfirm(null)}
            />
        </PageContainer>
    );
}
