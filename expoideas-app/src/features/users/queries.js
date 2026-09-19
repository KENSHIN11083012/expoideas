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

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.remove,
        onSuccess: (_, id) => queryClient.setQueryData(usersKey, (users = []) => users.filter((user) => user.id !== id)),
    });
};
