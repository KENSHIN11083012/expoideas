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
    MY_PROJECTS: '/mis-proyectos',
    PROJECTS: '/proyectos',
    PROFILE: '/perfil',
    SECURITY: '/seguridad',
    USERS: '/admin/usuarios',
    EDITIONS: '/admin/ediciones',
    PRESENTATIONS: '/admin/sustentaciones',
    CATALOGS: '/admin/catalogos',
    UNAUTHORIZED: '/no-autorizado',
};

/** La ficha de un proyecto. La misma para su equipo, su docente y la gestión. */
ROUTES.project = (id) => `${ROUTES.PROJECTS}/${id}`;

/** Donde aterriza cada rol tras iniciar sesión. */
export const homeRouteFor = (role) => (isManagement(role) ? ROUTES.USERS : ROUTES.HOME);

/** Con pasos de primer ingreso pendientes, se resuelven antes de ir a cualquier otro sitio. */
export const startRouteFor = (role, pendingSteps = []) => (pendingSteps.length > 0 ? ROUTES.ONBOARDING : homeRouteFor(role));
