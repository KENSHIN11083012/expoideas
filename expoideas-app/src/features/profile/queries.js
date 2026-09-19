import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { profileApi } from './api';

const profileKey = ['profile'];

export const useProfile = () => useQuery({ queryKey: profileKey, queryFn: profileApi.get });

/**
 * Guarda el perfil devuelto por la API en la caché y en la sesión (nombre y foto
 * de la cabecera).
 */
const useProfileMutation = (mutationFn, toSession) => {
    const queryClient = useQueryClient();
    const { updateUser } = useAuth();
    return useMutation({
        mutationFn,
        onSuccess: (profile) => {
            queryClient.setQueryData(profileKey, profile);
            updateUser(toSession(profile));
        },
    });
};

export const useUpdateProfile = () =>
    useProfileMutation(profileApi.update, ({ firstName, lastName }) => ({ firstName, lastName }));

export const useUploadPhoto = () => useProfileMutation(profileApi.uploadPhoto, ({ photoId }) => ({ photoId }));

export const useDeletePhoto = () => {
    const queryClient = useQueryClient();
    const { updateUser } = useAuth();
    return useMutation({
        mutationFn: profileApi.deletePhoto,
        onSuccess: () => {
            queryClient.setQueryData(profileKey, (profile) => profile && { ...profile, photoId: null });
            updateUser({ photoId: null });
        },
    });
};
