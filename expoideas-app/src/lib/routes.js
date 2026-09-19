import { isManagement } from '@/lib/roles';

/**
 * URLs de la app, en español porque son parte de la interfaz. Todas se escriben
 * aquí una sola vez; las de la API están en el api.js de cada módulo.
 */
export const ROUTES = {
    HOME: '/',
    LOGIN: '/iniciar-sesion',
    REGISTER: '/registro',
    ONBOARDING: '/primer-ingreso',
    PROFILE: '/perfil',
    SECURITY: '/seguridad',
    USERS: '/admin/usuarios',
    CATALOGS: '/admin/catalogos',
    UNAUTHORIZED: '/no-autorizado',
};

/** Donde aterriza cada rol tras iniciar sesión. */
export const homeRouteFor = (role) => (isManagement(role) ? ROUTES.USERS : ROUTES.HOME);

/** Con pasos de primer ingreso pendientes, se resuelven antes de ir a cualquier otro sitio. */
export const startRouteFor = (role, pendingSteps = []) =>
    pendingSteps.length > 0 ? ROUTES.ONBOARDING : homeRouteFor(role);
