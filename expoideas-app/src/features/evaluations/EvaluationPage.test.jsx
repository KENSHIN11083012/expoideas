import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderWithProviders } from '@/test/utils';
import { project } from '@/test/fixtures';
import { useProject } from '@/features/projects/queries';
import EvaluationPage from './EvaluationPage';
import { useMyEvaluation, useRubric, useSaveEvaluation } from './queries';

vi.mock('@/features/projects/queries', () => ({ useProject: vi.fn() }));
vi.mock('./queries', () => ({ useRubric: vi.fn(), useMyEvaluation: vi.fn(), useSaveEvaluation: vi.fn() }));

const navigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
    ...(await importOriginal()),
    useParams: () => ({ id: '10' }),
    useNavigate: () => navigate,
}));

const level = (id, label, score) => ({ id, position: id % 10, label, score, description: `Descripción del nivel ${id}` });

/** Dos criterios, como en el póster: el mismo nivel no vale lo mismo en los dos. */
const rubric = {
    id: 1,
    track: 'INNPRENDE_I',
    name: 'Póster de proyecto de innovación',
    criteria: [
        {
            id: 1,
            position: 1,
            name: 'Planteamiento del problema/necesidad',
            shortName: 'Planteamiento del problema',
            levels: [
                level(11, 'Insuficiente', 0),
                level(12, 'Deficiente', 1.5),
                level(13, 'Aceptable', 3.5),
                level(14, 'Bueno', 4.5),
            ],
        },
        {
            id: 2,
            position: 2,
            name: 'Objetivos del proyecto',
            shortName: 'Objetivos',
            levels: [
                level(21, 'Insuficiente', 0),
                level(22, 'Deficiente', 3),
                level(23, 'Aceptable', 4),
                level(24, 'Bueno', 4.5),
            ],
        },
    ],
};

const saved = {
    id: 4,
    projectId: 10,
    jurorId: 8,
    juror: 'Marta Ríos',
    absent: false,
    grade: 3,
    scale: 'ACCEPTABLE',
    scores: [
        { criterionId: 1, levelId: 12, score: 1.5, comment: 'El problema quedó genérico.' },
        { criterionId: 2, levelId: 24, score: 4.5, comment: null },
    ],
    updatedAt: '2026-11-20T10:00:00',
};

const query = (data, extra = {}) => ({ data, isPending: false, error: null, refetch: vi.fn(), ...extra });

let save;

const renderPage = ({ evaluation = null } = {}) => {
    useMyEvaluation.mockReturnValue(query(evaluation));
    renderWithProviders(<EvaluationPage />);
};

const criterion = (name) => within(screen.getByRole('radiogroup', { name: new RegExp(name) }));
const choose = (name, levelName) => userEvent.click(criterion(name).getByRole('radio', { name: levelName }));
const saveButton = () => screen.getByRole('button', { name: /Guardar evaluación/ });

beforeEach(() => {
    navigate.mockClear();
    save = { mutateAsync: vi.fn().mockResolvedValue(saved), isPending: false };
    useProject.mockReturnValue(query(project));
    useRubric.mockReturnValue(query(rubric));
    useSaveEvaluation.mockReturnValue(save);
});

describe('El tablero del jurado', () => {
    it('muestra la rúbrica de la cátedra: cada criterio con sus niveles, su valor y su descripción', () => {
        renderPage();

        expect(screen.getByRole('heading', { level: 1, name: 'BioSensor' })).toBeInTheDocument();
        expect(screen.getByText(/Póster de proyecto de innovación/)).toBeInTheDocument();
        expect(criterion('Planteamiento').getAllByRole('radio')).toHaveLength(4);
        // El mismo nivel vale distinto según el criterio.
        expect(criterion('Planteamiento').getByRole('radio', { name: 'Deficiente, 1.5' })).not.toBeChecked();
        expect(criterion('Objetivos').getByRole('radio', { name: 'Deficiente, 3.0' })).toBeInTheDocument();
        expect(screen.getByText('Descripción del nivel 13')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Ver proyecto y entregables/ })).toHaveAttribute('href', '/proyectos/10');
    });

    it('la nota aparece en vivo cuando todos los criterios tienen nivel', async () => {
        renderPage();

        expect(screen.getByText('0 de 2 criterios')).toBeInTheDocument();
        await choose('Planteamiento', 'Bueno, 4.5');
        expect(screen.getByText('1 de 2 criterios')).toBeInTheDocument();
        expect(screen.queryByText(/Nota:/)).not.toBeInTheDocument();

        await choose('Objetivos', 'Aceptable, 4.0');
        // (4.5 + 4.0) / 2 = 4.25, que sube a 4.3.
        expect(screen.getByText('2 de 2 criterios')).toBeInTheDocument();
        expect(screen.getByText('4.3')).toBeInTheDocument();
        expect(screen.getByText(/^Nota:.*· Bueno$/)).toBeInTheDocument();
    });

    it('guarda un nivel por criterio y vuelve a la lista', async () => {
        renderPage();

        await choose('Planteamiento', 'Bueno, 4.5');
        await choose('Objetivos', 'Aceptable, 4.0');
        await userEvent.type(screen.getByLabelText(/Observación de «Objetivos»/), '  Claros y medibles.  ');
        await userEvent.click(saveButton());

        await waitFor(() =>
            expect(save.mutateAsync).toHaveBeenCalledWith({
                absent: false,
                scores: [
                    { criterionId: 1, levelId: 14, comment: null },
                    { criterionId: 2, levelId: 23, comment: 'Claros y medibles.' },
                ],
            }),
        );
        expect(navigate).toHaveBeenCalledWith('/jurado/proyectos');
    });

    it('no deja guardar con un criterio sin nivel', async () => {
        renderPage();

        await choose('Planteamiento', 'Bueno, 4.5');
        await userEvent.click(saveButton());

        expect(await screen.findByText('Elige un nivel para este criterio')).toBeInTheDocument();
        expect(save.mutateAsync).not.toHaveBeenCalled();
    });

    it('por debajo de 3.0 la observación es obligatoria; desde 3.0, opcional', async () => {
        renderPage();

        await choose('Planteamiento', 'Deficiente, 1.5');
        await choose('Objetivos', 'Deficiente, 3.0');
        expect(screen.getByLabelText(/Observación de «Planteamiento del problema»/)).toBeRequired();
        expect(screen.getByLabelText(/Observación de «Objetivos»/)).not.toBeRequired();

        await userEvent.click(saveButton());
        expect(await screen.findByText(/la observación es obligatoria por debajo de 3.0/)).toBeInTheDocument();
        expect(save.mutateAsync).not.toHaveBeenCalled();

        await userEvent.type(screen.getByLabelText(/Observación de «Planteamiento del problema»/), 'Muy genérico.');
        await userEvent.click(saveButton());
        await waitFor(() => expect(save.mutateAsync).toHaveBeenCalledTimes(1));
        expect(save.mutateAsync.mock.calls[0][0].scores[0]).toEqual({ criterionId: 1, levelId: 12, comment: 'Muy genérico.' });
    });

    it('lo que rechaza la API se pinta en su criterio', async () => {
        save.mutateAsync.mockRejectedValue(
            apiError('Los datos enviados no son válidos.', 400, { fields: { 'scores.2.comment': 'Explica la calificación' } }),
        );
        renderPage();

        await choose('Planteamiento', 'Bueno, 4.5');
        await choose('Objetivos', 'Aceptable, 4.0');
        await userEvent.click(saveButton());

        expect(await screen.findByText('Explica la calificación')).toBeInTheDocument();
        expect(screen.getByLabelText(/Observación de «Objetivos»/)).toBeInvalid();
        expect(navigate).not.toHaveBeenCalled();
    });
});

describe('Corregir y marcar que no asistieron', () => {
    it('quien ya calificó ve lo que puso y puede corregirlo', async () => {
        renderPage({ evaluation: saved });

        expect(screen.getByText(/Ya calificaste este proyecto: 3.0 · Aceptable/)).toBeInTheDocument();
        expect(criterion('Planteamiento').getByRole('radio', { name: 'Deficiente, 1.5' })).toBeChecked();
        expect(criterion('Objetivos').getByRole('radio', { name: 'Bueno, 4.5' })).toBeChecked();
        expect(screen.getByLabelText(/Observación de «Planteamiento del problema»/)).toHaveValue('El problema quedó genérico.');

        await choose('Planteamiento', 'Aceptable, 3.5');
        await userEvent.click(saveButton());

        await waitFor(() => expect(save.mutateAsync).toHaveBeenCalledTimes(1));
        expect(save.mutateAsync.mock.calls[0][0].scores[0]).toEqual({
            criterionId: 1,
            levelId: 13,
            comment: 'El problema quedó genérico.',
        });
    });

    it('«No asistió» pide confirmación y guarda la evaluación en cero', async () => {
        renderPage();

        await userEvent.click(screen.getByRole('button', { name: 'No asistió' }));
        const dialog = within(screen.getByRole('alertdialog'));
        expect(dialog.getByText(/quedará en 0.0/)).toBeInTheDocument();
        expect(save.mutateAsync).not.toHaveBeenCalled();

        await userEvent.click(dialog.getByRole('button', { name: 'Sí, no asistió' }));

        await waitFor(() => expect(save.mutateAsync).toHaveBeenCalledWith({ absent: true }));
        expect(navigate).toHaveBeenCalledWith('/jurado/proyectos');
    });

    it('si ya había marcado que no asistieron, lo dice y deja calificar', () => {
        renderPage({ evaluation: { ...saved, absent: true, grade: 0, scale: 'FAILING', scores: [] } });

        expect(screen.getByText('Marcaste que el equipo no asistió')).toBeInTheDocument();
        expect(screen.getByText('0 de 2 criterios')).toBeInTheDocument();
    });

    it('a quien no es jurado del proyecto se le explica', () => {
        useMyEvaluation.mockReturnValue(
            query(undefined, { error: apiError('Solo los jurados asignados califican este proyecto', 403) }),
        );
        renderWithProviders(<EvaluationPage />);

        expect(screen.getByText('No puedes calificar este proyecto')).toBeInTheDocument();
        expect(screen.getByText('Solo los jurados asignados califican este proyecto')).toBeInTheDocument();
        expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });
});
