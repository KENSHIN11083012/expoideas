import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { get, put, post, del } from '@/services/apiClient';

/**
 * Lista y gestión de usuarios desde el panel de administración. Las
 * confirmaciones las pide la interfaz (AlertDialog), no el hook.
 */
export const useUserManagement = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchUsuarios = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await get('/admin/users');
            setUsuarios(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    /** @param {string} nuevoRol valor de la API (minúsculas) */
    const handleRoleChange = async (usuario, nuevoRol) => {
        if (usuario.rol === nuevoRol || !usuario.id) return;

        setUpdatingId(usuario.id);
        try {
            const actualizado = await put(`/admin/users/${usuario.id}`, { rol: nuevoRol });
            setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, ...actualizado } : u)));
            toast.success(`Rol de ${usuario.nombres} actualizado`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    /** Reemplaza sede, facultad y programa. Lanza el error para que el formulario lo muestre. */
    const updateAdscripcion = async (usuario, adscripcion) => {
        const actualizado = await put(`/admin/users/${usuario.id}`, adscripcion);
        setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, ...actualizado } : u)));
        toast.success(`Adscripción de ${usuario.nombres} actualizada`);
    };

    /** Lanza el error para que el formulario lo muestre. */
    const resetPassword = async (usuario, datos) => {
        await post(`/usuarios/admin/reset-password?email=${encodeURIComponent(usuario.correoInstitucional)}`, datos);
        toast.success(`Contraseña restablecida para ${usuario.correoInstitucional}`);
    };

    const handleDeleteUser = async (usuario) => {
        try {
            await del(`/admin/users/${usuario.id}`);
            setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
            toast.success(`${usuario.nombres} ${usuario.apellidos} fue eliminado`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    return {
        usuarios,
        isLoading,
        error,
        updatingId,
        fetchUsuarios,
        handleRoleChange,
        updateAdscripcion,
        resetPassword,
        handleDeleteUser,
    };
};
