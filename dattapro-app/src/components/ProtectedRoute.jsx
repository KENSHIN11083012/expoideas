import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute – guarda una ruta según autenticación y roles permitidos.
 *
 * Props:
 *  - allowedRoles: array de strings con los roles que pueden acceder.
 *    Si se omite (undefined), cualquier usuario autenticado puede entrar.
 *  - children: el componente de página a renderizar.
 *
 * Comportamiento:
 *  1. Sin sesión  → redirige a /login
 *  2. Sin permiso → redirige a /unauthorized (o a / si no existe esa ruta)
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
    const { token, role } = useAuth();
    const location = useLocation();

    // 1. No autenticado
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Roles restringidos – verificar si el rol actual está permitido
    if (allowedRoles && allowedRoles.length > 0) {
        const normalizedRole = role ? String(role).toUpperCase().replace('ROLE_', '') : '';
        const hasPermission = allowedRoles.some(
            (r) => r.toUpperCase() === normalizedRole
        );

        if (!hasPermission) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
