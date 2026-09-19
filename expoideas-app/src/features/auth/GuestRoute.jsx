import { Navigate } from 'react-router-dom';
import { startRouteFor } from '@/lib/routes';
import { useAuth } from './useAuth';

/** Inicio de sesión y registro no tienen sentido con la sesión iniciada. */
export function GuestRoute({ children }) {
    const { token, role, pendingSteps } = useAuth();
    return token ? <Navigate to={startRouteFor(role, pendingSteps)} replace /> : children;
}
