import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { evaluationApi } from './api';

const rubricKey = (track) => ['rubric', track];
const evaluationKey = (projectId) => ['evaluation', String(projectId)];
const myEvaluationsKey = ['my-evaluations'];

/** La rúbrica de una cátedra. Cambia solo con un despliegue: no hace falta volver a pedirla. */
export const useRubric = (track) =>
    useQuery({
        queryKey: rubricKey(track),
        queryFn: () => evaluationApi.rubric(track),
        enabled: Boolean(track),
        staleTime: Infinity,
    });

/** Mi evaluación de un proyecto; null si todavía no lo califiqué. */
export const useMyEvaluation = (projectId) =>
    useQuery({
        queryKey: evaluationKey(projectId),
        queryFn: () => evaluationApi.mine(projectId),
        enabled: Boolean(projectId),
    });

/** Todo lo que ya califiqué, para marcar en «Evaluar» qué proyectos faltan. */
export const useMyEvaluations = () => useQuery({ queryKey: myEvaluationsKey, queryFn: evaluationApi.allMine });

/** Guarda o corrige mi evaluación y actualiza lo que ya estaba en pantalla. */
export const useSaveEvaluation = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body) => evaluationApi.save(projectId, body),
        onSuccess: (saved) => {
            queryClient.setQueryData(evaluationKey(projectId), saved);
            queryClient.invalidateQueries({ queryKey: myEvaluationsKey });
        },
    });
};
