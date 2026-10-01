import { get, post, put } from '@/lib/apiClient';

/** Evaluación con rúbrica: cada jurado lee y guarda la suya. */
export const evaluationApi = {
    rubric: (track) => get(`/rubrics/${track}`),
    /** null si todavía no ha calificado ese proyecto (la API responde 204). */
    mine: (projectId) => get(`/projects/${projectId}/evaluations/mine`),
    save: (projectId, body) => put(`/projects/${projectId}/evaluations/mine`, body),
    /** Todo lo que quien tiene la sesión ya calificó. */
    allMine: () => get('/evaluations/mine'),
    /** La nota del proyecto y lo que puso cada jurado (profesor del grupo y gestión). */
    results: (projectId) => get(`/projects/${projectId}/evaluations`),
    /** Escribe a los jurados de la cátedra con proyectos sin calificar (gestión). */
    remind: (editionId, track) => post(`/evaluations/reminders?editionId=${editionId}&track=${track}`),
};
