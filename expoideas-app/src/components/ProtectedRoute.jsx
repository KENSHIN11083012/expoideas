import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasRole } from '../utils/roles';

/**
 * Guarda una ruta segun autenticacion y roles permitidos.
 *
 * - Sin sesion  -> /login
 * - Sin permiso -> /unauthorized
 *
 * @param {string[]} [allowedRoles] si se omite, basta con estar autenticado.
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
    const { token, role } = useAuth();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (!hasRole(role, allowedRoles)) {
        return <Navigate to="/unauthorized" replace />;
    }
    return children;
};

export default ProtectedRoute;
