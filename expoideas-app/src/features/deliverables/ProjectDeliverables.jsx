import { useRef, useState } from 'react';
import { CircleCheck, CircleDashed, Download, FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from '@/lib/files';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { useProjectDeliverables, useUploadDeliverable } from './queries';
import { KIND_ACCEPT, kindLabel } from './schemas';

/** Tamaño legible: la API rechaza cualquier cosa por encima de 5 MB. */
const fileSize = (bytes) =>
    bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function UploadedFile({ file, canEdit, onRemove }) {
    const [downloading, setDownloading] = useState(false);

    const download = async () => {
        setDownloading(true);
        try {
            await downloadFile(file.fileId, file.fileName);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <li className="flex items-center justify-between gap-3 rounded border border-outline-variant/60 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-on-surface">{file.fileName}</p>
                    <p className="text-xs text-on-surface-variant">
                        {fileSize(file.sizeBytes)} · subido por {file.uploadedBy}
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 gap-1">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={download}
                    loading={downloading}
                    aria-label={`Descargar ${file.fileName}`}
                >
                    <Download />
                </Button>
                {canEdit && (
                    <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Quitar ${file.fileName}`}>
                        <Trash2 />
                    </Button>
                )}
            </div>
        </li>
    );
}

function DeliverableGroup({ group, projectId, canEdit, onRemove }) {
    const { type, files, complete } = group;
    const input = useRef(null);
    const upload = useUploadDeliverable(projectId);
    const full = files.length >= type.maxFiles;

    const pick = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = ''; // Permite volver a elegir el mismo archivo.
        if (!file) return;
        try {
            await upload.mutateAsync({ deliverableTypeId: type.id, file });
            toast.success(`"${file.name}" se subió`);
        } catch (error) {
            toast.error(error.body?.fields?.file ?? error.message);
        }
    };

    return (
        <Card className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <p className="flex items-center gap-2 font-semibold text-on-surface">
                        {complete ? (
                            <CircleCheck className="size-4 text-primary" aria-label="Entregado" />
                        ) : (
                            <CircleDashed className="size-4 text-on-surface-variant" aria-label="Pendiente" />
                        )}
                        {type.name}
                    </p>
                    {type.description && <p className="text-sm text-on-surface-variant">{type.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant={type.required ? 'primary' : 'outline'}>{type.required ? 'Obligatorio' : 'Opcional'}</Badge>
                    <Badge variant="outline">{kindLabel(type.kind)}</Badge>
                </div>
            </div>

            {files.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {files.map((file) => (
                        <UploadedFile key={file.id} file={file} canEdit={canEdit} onRemove={() => onRemove(file)} />
                    ))}
                </ul>
            )}

            {canEdit && (
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        ref={input}
                        type="file"
                        accept={KIND_ACCEPT[type.kind]}
                        className="sr-only"
                        aria-label={`Subir archivo para ${type.name}`}
                        onChange={pick}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => input.current?.click()}
                        loading={upload.isPending}
                        disabled={full}
                        // Subir es la acción principal del equipo: cómoda de tocar en móvil.
                        className="h-11 sm:h-8"
                    >
                        <Upload /> Subir archivo
                    </Button>
                    <p className="text-xs text-on-surface-variant">
                        {full
                            ? type.maxFiles === 1
                                ? 'Solo se acepta un archivo: quita el actual para reemplazarlo.'
                                : `Ya subieron los ${type.maxFiles} archivos permitidos.`
                            : `Máximo 5 MB por archivo${type.maxFiles > 1 ? `, hasta ${type.maxFiles}` : ''}.`}
                    </p>
                </div>
            )}
        </Card>
    );
}

/**
 * Los entregables de la cátedra y lo que el equipo lleva subido. Suben y quitan
 * los integrantes del equipo, hasta el cierre de entregas de la edición; el
 * docente y la gestión solo miran y descargan.
 */
export function ProjectDeliverables({ project, isMember }) {
    const { data: groups = [], isPending, error, refetch } = useProjectDeliverables(project.id);
    const remove = useUploadDeliverable(project.id);
    const [confirm, setConfirm] = useState(null);

    const canEdit = isMember && project.submissionOpen;
    const pending = groups.filter((group) => !group.complete).length;

    const removeFile = async () => {
        try {
            await remove.mutateAsync({ deliverableId: confirm.file.id });
            toast.success('El archivo se quitó');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setConfirm(null);
        }
    };

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-bold text-on-surface">Entregables</h2>
                {groups.length > 0 && (
                    <p className="label-mono text-on-surface-variant">
                        {pending === 0 ? 'Todo entregado' : `${pending} sin entregar`}
                    </p>
                )}
            </div>

            {!project.submissionOpen && (
                <p className="text-sm text-on-surface-variant">El plazo de entregas de {project.edition} ya cerró.</p>
            )}

            {error ? (
                <ErrorState title="No pudimos cargar los entregables" error={error} onRetry={refetch} />
            ) : isPending ? (
                <Skeleton className="h-40 rounded" aria-busy="true" />
            ) : groups.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Esta cátedra todavía no pide entregables"
                    description="Cuando MacondoLab los configure, aparecerán aquí."
                />
            ) : (
                <div className="flex flex-col gap-3">
                    {groups.map((group) => (
                        <DeliverableGroup
                            key={group.type.id}
                            group={group}
                            projectId={project.id}
                            canEdit={canEdit}
                            onRemove={(file) => setConfirm({ file })}
                        />
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={Boolean(confirm)}
                title="¿Quitar el archivo?"
                description={`"${confirm?.file?.fileName ?? ''}" se elimina de la plataforma.`}
                confirmLabel="Quitar"
                onConfirm={removeFile}
                onClose={() => setConfirm(null)}
            />
        </section>
    );
}
