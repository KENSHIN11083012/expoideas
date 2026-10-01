import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';

const usersKey = ['users'];

export const useUsers = () => useQuery({ queryKey: usersKey, queryFn: usersApi.list });

/** Reemplaza (o agrega) la cuenta en el listado con lo que devolvió la API. */
const useUpsertInList = () => {
    const queryClient = useQueryClient();
    return (user) =>
        queryClient.setQueryData(usersKey, (users = []) =>
            users.some((existing) => existing.id === user.id)
                ? users.map((existing) => (existing.id === user.id ? user : existing))
                : [...users, user],
        );
};

export const useCreateUser = () => {
    const upsert = useUpsertInList();
    return useMutation({ mutationFn: usersApi.create, onSuccess: upsert });
};

/** Cambia rol o adscripción: `{ id, changes }`. */
export const useUpdateUser = () => {
    const upsert = useUpsertInList();
    return useMutation({ mutationFn: ({ id, changes }) => usersApi.update(id, changes), onSuccess: upsert });
};

export const useResetPassword = () => useMutation({ mutationFn: ({ id, passwords }) => usersApi.resetPassword(id, passwords) });

const rosterKey = ['roster'];

/** El listado de la cátedra. */
export const useRoster = () => useQuery({ queryKey: rosterKey, queryFn: usersApi.listRoster });

const useRosterMutation = (mutationFn) => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: rosterKey }) });
};

/** Carga un CSV y devuelve el resumen de la carga. */
export const useImportRoster = () => useRosterMutation(usersApi.importRoster);

export const useRemoveRosterEntry = () => useRosterMutation(usersApi.removeRosterEntry);

export const useClearRoster = () => useRosterMutation(usersApi.clearRoster);

const approvalsKey = (userId) => ['track-approvals', String(userId)];

/** Aprobaciones de cátedra de una persona. */
export const useTrackApprovals = (userId) =>
    useQuery({ queryKey: approvalsKey(userId), queryFn: () => usersApi.listApprovals(userId), enabled: Boolean(userId) });

/** Registra (con track) o quita (con id) una aprobación y recarga las de esa persona. */
export const useSaveTrackApproval = (userId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, track }) => (id ? usersApi.removeApproval(id) : usersApi.createApproval({ userId, track })),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalsKey(userId) }),
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.remove,
        onSuccess: (_, id) => queryClient.setQueryData(usersKey, (users = []) => users.filter((user) => user.id !== id)),
    });
};
