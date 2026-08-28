import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export const useUserManagement = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchUsuarios = useCallback(async () => {
        setIsLoading(true);
        try {
            const cleanToken = (localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': 'Bearer ' + cleanToken
                }
            });
            if (!response.ok) {
                throw new Error('Error al obtener la lista de usuarios');
            }
            const data = await response.json();
            setUsuarios(data);
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
        if (usuario.rol === nuevoRol) return;

        const userId = usuario.id;
        if (!userId) {
            alert("El usuario no tiene un ID válido para actualizar.");
            return;
        }

        setUpdatingId(userId);

        try {
            const cleanToken = (localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + cleanToken
                },
                body: JSON.stringify({
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    correoInstitucional: usuario.correoInstitucional,
                    rol: nuevoRol,
                    estadoFormulario: usuario.estadoFormulario
                })
            });

            if (!response.ok) {
                throw new Error('No se pudo actualizar el rol');
            }

            setUsuarios(prevUsuarios =>
                prevUsuarios.map(u => u.id === userId ? { ...u, rol: nuevoRol } : u)
            );

            alert("Rol actualizado exitosamente");
        } catch (error) {
            console.error(error);
            alert("Error al actualizar el rol: " + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleStatusChange = async (usuario, nuevoEstado) => {
        if (usuario.estadoFormulario === nuevoEstado) return;

        const userId = usuario.id;
        if (!userId) return;

        setUpdatingId(userId);

        try {
            const cleanToken = (localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + cleanToken
                },
                body: JSON.stringify({
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    correoInstitucional: usuario.correoInstitucional,
                    rol: usuario.rol,
                    estadoFormulario: nuevoEstado
                })
            });

            if (!response.ok) {
                throw new Error('No se pudo actualizar el estado');
            }

            setUsuarios(prevUsuarios =>
                prevUsuarios.map(u => u.id === userId ? { ...u, estadoFormulario: nuevoEstado } : u)
            );

            alert("Estado actualizado exitosamente");
        } catch (error) {
            console.error(error);
            alert("Error al actualizar el estado: " + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este usuario?")) {
            return;
        }

        try {
            const cleanToken = (localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
            const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + cleanToken
                }
            });

            if (!response.ok) {
                throw new Error('No se pudo eliminar el usuario');
            }

            setUsuarios(prevUsuarios => prevUsuarios.filter(u => u.id !== id));
            alert('Usuario eliminado exitosamente');
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el usuario: " + error.message);
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
        handleStatusChange,
        handleDeleteUser
    };
};
