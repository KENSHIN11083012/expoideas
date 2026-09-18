import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { get, put, post, del } from '@/services/apiClient';

/**
 * Lista y gestión de usuarios desde la gestión (MacondoLab y administradores).
 * Las confirmaciones las pide la interfaz (AlertDialog), no el hook, y los
 * permisos por rol los aplica la API.
 */
export const useUserManagement = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    /** Lleva el resultado de una carga al estado, salvo que ya no esté vigente. */
    const aplicar = useCallback((carga, vigente = () => true) =>
        carga
            .then((data) => {
                if (!vigente()) return;
                setUsuarios(Array.isArray(data) ? data : []);
                setError(null);
            })
            .catch((err) => vigente() && setError(err.message))
            .finally(() => vigente() && setIsLoading(false)), []);

    useEffect(() => {
        let vigente = true;
        aplicar(get('/admin/users'), () => vigente);
        return () => {
            vigente = false;
        };
    }, [aplicar]);

    const fetchUsuarios = useCallback(() => {
        setIsLoading(true);
        return aplicar(get('/admin/users'));
    }, [aplicar]);

    /** Crea una cuenta con rol y contraseña temporal. Lanza el error para que el formulario lo muestre. */
    const crearUsuario = async (datos) => {
        const creado = await post('/admin/users', datos);
        setUsuarios((prev) => [...prev, creado]);
        toast.success(`Cuenta de ${creado.nombres} ${creado.apellidos} creada`);
        return creado;
    };

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
        crearUsuario,
        handleRoleChange,
        updateAdscripcion,
        resetPassword,
        handleDeleteUser,
    };
};
