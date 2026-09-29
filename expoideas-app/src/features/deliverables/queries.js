import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliverableApi } from './api';

const typesKey = (editionId, track) => ['deliverable-types', String(editionId), track];
const projectKey = (projectId) => ['deliverables', String(projectId)];

/** Entregables que pide una cátedra. */
export const useDeliverableTypes = (editionId, track) =>
    useQuery({
        queryKey: typesKey(editionId, track),
        queryFn: () => deliverableApi.listTypes(editionId, track),
        enabled: Boolean(editionId && track),
    });

/** Crea (sin id), edita (con id) o borra (con remove) un entregable de la cátedra. */
export const useSaveDeliverableType = (editionId, track) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body, remove }) => {
            if (remove) return deliverableApi.removeType(id);
            return id ? deliverableApi.updateType(id, body) : deliverableApi.createType(body);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: typesKey(editionId, track) }),
    });
};

/** Lo que pide la cátedra junto con lo que el proyecto lleva subido. */
export const useProjectDeliverables = (projectId) =>
    useQuery({
        queryKey: projectKey(projectId),
        queryFn: () => deliverableApi.listOfProject(projectId),
        enabled: Boolean(projectId),
    });

/**
 * Sube o quita un archivo. La API devuelve la lista completa ya actualizada, así
 * que se guarda en la caché sin pedirla otra vez.
 */
export const useUploadDeliverable = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ deliverableTypeId, file, deliverableId }) =>
            deliverableId
                ? deliverableApi.remove(projectId, deliverableId)
                : deliverableApi.upload(projectId, deliverableTypeId, file),
        onSuccess: (groups) => queryClient.setQueryData(projectKey(projectId), groups),
    });
};
