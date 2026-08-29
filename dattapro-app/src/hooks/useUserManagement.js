import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { get, put, del } from '../services/apiClient';

/**
 * Lista y edicion de usuarios desde el panel de administracion.
 *
 * handleStatusChange desaparecio con el campo estadoFormulario, que pertenecia
 * al flujo de validacion del perfil docente de Dattapro.
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

    const handleRoleChange = async (usuario, nuevoRol) => {
        if (usuario.rol === nuevoRol || !usuario.id) return;

        setUpdatingId(usuario.id);
        try {
            await put(`/admin/users/${usuario.id}`, { rol: nuevoRol });
            setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, rol: nuevoRol } : u)));
            toast.success('Rol actualizado');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Vas a eliminar este usuario. Esta accion no se puede deshacer.')) {
            return;
        }
        try {
            await del(`/admin/users/${id}`);
            setUsuarios((prev) => prev.filter((u) => u.id !== id));
            toast.success('Usuario eliminado');
        } catch (err) {
            toast.error(err.message);
        }
    };

    return {
        usuarios,
        setUsuarios,
        isLoading,
        error,
        updatingId,
        fetchUsuarios,
        handleRoleChange,
        handleDeleteUser,
    };
};
