import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { openEdition } from '@/test/fixtures';
import { apiError, renderWithProviders } from '@/test/utils';
import { DeliverableTypesDialog } from './DeliverableTypesDialog';
import { useDeliverableTypes, useSaveDeliverableType } from './queries';

vi.mock('./queries', () => ({ useDeliverableTypes: vi.fn(), useSaveDeliverableType: vi.fn() }));

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

let save;

const renderDialog = (types = [poster]) => {
    useDeliverableTypes.mockReturnValue({ data: types, isPending: false, error: null, refetch: vi.fn() });
    renderWithProviders(<DeliverableTypesDialog edition={openEdition} track="INNPRENDE_I" onClose={vi.fn()} />);
    return within(screen.getByRole('dialog'));
};

beforeEach(() => {
    save = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false };
    useSaveDeliverableType.mockReturnValue(save);
});

describe('Entregables de una cátedra', () => {
    it('lista lo configurado con sus condiciones', () => {
        const dialog = renderDialog();

        expect(dialog.getByText('Entregables de INNPRENDE I')).toBeInTheDocument();
        expect(dialog.getByText('Póster de investigación')).toBeInTheDocument();
        expect(dialog.getByText('Obligatorio')).toBeInTheDocument();
        expect(dialog.getByText('PDF')).toBeInTheDocument();
        expect(dialog.getByText('Un archivo')).toBeInTheDocument();
    });

    it('sin entregables invita a agregar el primero', () => {
        const dialog = renderDialog([]);

        expect(dialog.getByText('Esta cátedra todavía no pide entregables')).toBeInTheDocument();
    });

    it('agrega uno nuevo con la edición y la cátedra de donde se abrió', async () => {
        const dialog = renderDialog([]);

        await userEvent.click(dialog.getByRole('button', { name: /Agregar entregable/ }));
        await userEvent.type(dialog.getByLabelText(/Nombre/), 'Fotos del prototipo');
        await userEvent.type(dialog.getByLabelText(/Descripción/), 'Tres fotos del prototipo funcionando.');
        await userEvent.selectOptions(dialog.getByLabelText(/Archivos aceptados/), 'IMAGE');
        await userEvent.clear(dialog.getByLabelText(/Máximo de archivos/));
        await userEvent.type(dialog.getByLabelText(/Máximo de archivos/), '3');
        await userEvent.click(dialog.getByRole('button', { name: 'Agregar' }));

        await waitFor(() =>
            expect(save.mutateAsync).toHaveBeenCalledWith({
                id: undefined,
                body: {
                    editionId: 1,
                    track: 'INNPRENDE_I',
                    name: 'Fotos del prototipo',
                    description: 'Tres fotos del prototipo funcionando.',
                    kind: 'IMAGE',
                    required: true,
                    maxFiles: 3,
                    sortOrder: 0,
                },
            }),
        );
    });

    it('un nombre repetido se muestra en su campo', async () => {
        save.mutateAsync.mockRejectedValue(apiError('El recurso ya existe', 409));
        const dialog = renderDialog();

        await userEvent.click(dialog.getByRole('button', { name: /Agregar entregable/ }));
        await userEvent.type(dialog.getByLabelText(/Nombre/), 'Póster de investigación');
        await userEvent.click(dialog.getByRole('button', { name: 'Agregar' }));

        expect(await dialog.findByText('Ya hay un entregable con ese nombre')).toBeInTheDocument();
    });

    it('editar parte de los datos del entregable', async () => {
        const dialog = renderDialog();

        await userEvent.click(dialog.getByRole('button', { name: 'Editar Póster de investigación' }));

        expect(dialog.getByLabelText(/Nombre/)).toHaveValue('Póster de investigación');
        expect(dialog.getByLabelText(/Máximo de archivos/)).toHaveValue(1);
    });

    it('eliminar pide confirmación', async () => {
        const dialog = renderDialog();

        await userEvent.click(dialog.getByRole('button', { name: 'Eliminar Póster de investigación' }));
        const confirm = within(await screen.findByRole('alertdialog'));
        await userEvent.click(confirm.getByRole('button', { name: 'Eliminar' }));

        await waitFor(() => expect(save.mutateAsync).toHaveBeenCalledWith({ id: 5, remove: true }));
    });
});
