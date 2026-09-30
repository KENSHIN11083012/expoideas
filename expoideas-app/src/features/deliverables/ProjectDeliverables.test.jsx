import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { downloadFile } from '@/lib/files';
import { project } from '@/test/fixtures';
import { apiError, renderWithProviders } from '@/test/utils';
import { ProjectDeliverables } from './ProjectDeliverables';
import { useProjectDeliverables, useUploadDeliverable } from './queries';

vi.mock('./queries', () => ({ useProjectDeliverables: vi.fn(), useUploadDeliverable: vi.fn() }));
vi.mock('@/lib/files', () => ({ downloadFile: vi.fn() }));

const poster = {
    id: 5,
    editionId: 1,
    track: 'INNPRENDE_I',
    name: 'Póster de investigación',
    description: 'Formato oficial, en PDF.',
    kind: 'DOCUMENT',
    required: true,
    maxFiles: 1,
    sortOrder: 1,
};

const photos = { ...poster, id: 6, name: 'Fotos del prototipo', description: null, kind: 'IMAGE', maxFiles: 3 };

const video = { ...poster, id: 7, name: 'Video del pitch', description: null, kind: 'LINK', maxFiles: 1 };

const registeredVideo = {
    id: 9,
    fileId: null,
    fileName: null,
    contentType: null,
    sizeBytes: null,
    url: 'https://youtu.be/abc',
    uploadedBy: 'Ana María Pérez',
    uploadedAt: '2026-11-10T10:00:00',
};

const uploadedPoster = {
    id: 3,
    fileId: '8a5f1f2e-0000-4000-8000-000000000000',
    fileName: 'poster.pdf',
    contentType: 'application/pdf',
    sizeBytes: 524288,
    uploadedBy: 'Ana María Pérez',
    uploadedAt: '2026-11-10T10:00:00',
};

let upload;

const renderSection = ({ groups = [{ type: poster, files: [], complete: false }], isMember = true, current = project } = {}) => {
    useProjectDeliverables.mockReturnValue({ data: groups, isPending: false, error: null, refetch: vi.fn() });
    renderWithProviders(<ProjectDeliverables project={current} isMember={isMember} />);
};

const pdf = () => new File(['%PDF-1.7'], 'poster.pdf', { type: 'application/pdf' });

beforeEach(() => {
    upload = { mutateAsync: vi.fn().mockResolvedValue([]), isPending: false };
    useUploadDeliverable.mockReturnValue(upload);
});

describe('Lo que pide la cátedra', () => {
    it('muestra cada entregable con lo que exige y lo que falta', () => {
        renderSection({
            groups: [
                { type: poster, files: [], complete: false },
                { type: photos, files: [], complete: false },
            ],
        });

        expect(screen.getByText('Póster de investigación')).toBeInTheDocument();
        expect(screen.getByText('Formato oficial, en PDF.')).toBeInTheDocument();
        expect(screen.getAllByText('Obligatorio')).toHaveLength(2);
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('Imagen (JPG, PNG o WEBP)')).toBeInTheDocument();
        expect(screen.getByText('2 sin entregar')).toBeInTheDocument();
    });

    it('cuando está todo subido lo dice', () => {
        renderSection({ groups: [{ type: poster, files: [uploadedPoster], complete: true }] });

        expect(screen.getByText('Todo entregado')).toBeInTheDocument();
        expect(screen.getByText('poster.pdf')).toBeInTheDocument();
        expect(screen.getByText(/512 KB · subido por Ana María Pérez/)).toBeInTheDocument();
    });

    it('sin entregables configurados lo explica', () => {
        renderSection({ groups: [] });

        expect(screen.getByText('Esta cátedra todavía no pide entregables')).toBeInTheDocument();
    });

    it('si la API falla ofrece reintentar', () => {
        useProjectDeliverables.mockReturnValue({
            data: undefined,
            isPending: false,
            error: apiError('Error del servidor', 500),
            refetch: vi.fn(),
        });
        renderWithProviders(<ProjectDeliverables project={project} isMember />);

        expect(screen.getByText('No pudimos cargar los entregables')).toBeInTheDocument();
    });
});

describe('El equipo sube y quita archivos', () => {
    it('sube el archivo elegido', async () => {
        renderSection();

        await userEvent.upload(screen.getByLabelText('Subir archivo para Póster de investigación'), pdf());

        await waitFor(() =>
            expect(upload.mutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({ deliverableTypeId: 5, file: expect.any(File) }),
            ),
        );
    });

    it('con el máximo alcanzado no deja subir otro', () => {
        renderSection({ groups: [{ type: poster, files: [uploadedPoster], complete: true }] });

        expect(screen.getByRole('button', { name: /Subir archivo/ })).toBeDisabled();
        expect(screen.getByText(/quita el actual para reemplazarlo/)).toBeInTheDocument();
    });

    it('quita un archivo después de confirmar', async () => {
        renderSection({ groups: [{ type: poster, files: [uploadedPoster], complete: true }] });

        await userEvent.click(screen.getByRole('button', { name: 'Quitar poster.pdf' }));
        const dialog = within(await screen.findByRole('alertdialog'));
        await userEvent.click(dialog.getByRole('button', { name: 'Quitar' }));

        await waitFor(() => expect(upload.mutateAsync).toHaveBeenCalledWith({ deliverableId: 3 }));
    });

    it('descarga un archivo con la sesión', async () => {
        renderSection({ groups: [{ type: poster, files: [uploadedPoster], complete: true }] });

        await userEvent.click(screen.getByRole('button', { name: 'Descargar poster.pdf' }));

        expect(downloadFile).toHaveBeenCalledWith(uploadedPoster.fileId, 'poster.pdf');
    });
});

describe('Plantillas, enlaces y cierres propios', () => {
    it('ofrece descargar la plantilla del entregable', async () => {
        renderSection({
            groups: [
                {
                    type: { ...poster, templateFileId: '2b2b2b2b-0000-4000-8000-000000000000', templateFileName: 'formato.pptx' },
                    files: [],
                    complete: false,
                },
            ],
        });

        await userEvent.click(screen.getByRole('button', { name: /Descargar plantilla/ }));

        expect(downloadFile).toHaveBeenCalledWith('2b2b2b2b-0000-4000-8000-000000000000', 'formato.pptx');
    });

    it('un entregable de tipo enlace pide una dirección en vez de un archivo', async () => {
        renderSection({ groups: [{ type: video, files: [], complete: false }] });

        expect(screen.queryByRole('button', { name: /Subir archivo/ })).not.toBeInTheDocument();
        await userEvent.type(screen.getByLabelText(/Enlace para Video del pitch/), 'youtu.be/abc');
        await userEvent.click(screen.getByRole('button', { name: /Agregar enlace/ }));
        expect(await screen.findByText(/empiece por http:\/\//)).toBeInTheDocument();
        expect(upload.mutateAsync).not.toHaveBeenCalled();

        await userEvent.clear(screen.getByLabelText(/Enlace para Video del pitch/));
        await userEvent.type(screen.getByLabelText(/Enlace para Video del pitch/), 'https://youtu.be/abc');
        await userEvent.click(screen.getByRole('button', { name: /Agregar enlace/ }));

        await waitFor(() =>
            expect(upload.mutateAsync).toHaveBeenCalledWith({ deliverableTypeId: 7, url: 'https://youtu.be/abc' }),
        );
    });

    it('un enlace registrado se abre en otra pestaña y se puede quitar', async () => {
        renderSection({ groups: [{ type: video, files: [registeredVideo], complete: true }] });

        expect(screen.getByRole('link', { name: 'https://youtu.be/abc' })).toHaveAttribute('target', '_blank');
        expect(screen.queryByLabelText(/Enlace para Video del pitch/)).not.toBeInTheDocument();
        expect(screen.getByText(/quita el actual para reemplazarlo/)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Quitar https://youtu.be/abc' }));
        const dialog = within(await screen.findByRole('alertdialog'));
        expect(dialog.getByText('¿Quitar el enlace?')).toBeInTheDocument();
        await userEvent.click(dialog.getByRole('button', { name: 'Quitar' }));

        await waitFor(() => expect(upload.mutateAsync).toHaveBeenCalledWith({ deliverableId: 9 }));
    });

    it('con cierre propio pasado, ese entregable no admite cambios aunque la edición siga abierta', () => {
        renderSection({
            groups: [
                { type: { ...photos, closesOn: '2000-01-01' }, files: [], complete: true },
                { type: poster, files: [], complete: false },
            ],
        });

        expect(screen.getByText(/Cerró el 1 de ene/)).toBeInTheDocument();
        expect(screen.getByText(/Este entregable cerró el 1 de ene/)).toBeInTheDocument();
        expect(screen.queryByLabelText('Subir archivo para Fotos del prototipo')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Subir archivo para Póster de investigación')).toBeInTheDocument();
    });

    it('con cierre propio futuro, sigue abierto aunque la edición haya cerrado', () => {
        renderSection({
            groups: [{ type: { ...photos, closesOn: '2999-12-31' }, files: [], complete: true }],
            current: { ...project, submissionOpen: false },
        });

        expect(screen.getByText(/Cierra el 31 de dic/)).toBeInTheDocument();
        expect(screen.getByLabelText('Subir archivo para Fotos del prototipo')).toBeInTheDocument();
    });
});

describe('Quien no es del equipo', () => {
    it('solo mira y descarga', () => {
        renderSection({ groups: [{ type: poster, files: [uploadedPoster], complete: true }], isMember: false });

        expect(screen.getByRole('button', { name: 'Descargar poster.pdf' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Subir archivo/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Quitar poster.pdf' })).not.toBeInTheDocument();
    });

    it('con el plazo cerrado tampoco el equipo sube', () => {
        renderSection({
            groups: [{ type: poster, files: [], complete: false }],
            current: { ...project, submissionOpen: false },
        });

        expect(screen.queryByRole('button', { name: /Subir archivo/ })).not.toBeInTheDocument();
        expect(screen.getByText(/El plazo de entregas de Expoideas 2026-2 ya cerró/)).toBeInTheDocument();
    });
});
