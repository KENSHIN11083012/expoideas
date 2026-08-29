/**
 * Roles de Expoideas y normalizacion.
 *
 * El backend emite el rol de dos formas segun el camino: el claim "role" del
 * JWT llega como ROLE_ADMIN y el campo "rol" de la respuesta de login llega
 * como admin. Dattapro resolvia esa diferencia en tres sitios distintos
 * (Login, AuthContext y ProtectedRoute), cada uno con su propio parche.
 * Aqui se resuelve una sola vez.
 */

export const ROLES = {
    ADMIN: 'ADMIN',
    DOCENTE: 'DOCENTE',
    EMPRENDEDOR: 'EMPRENDEDOR',
    MENTOR: 'MENTOR',
    VISITANTE: 'VISITANTE',
};

export const ROLE_LABELS = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.DOCENTE]: 'Docente',
    [ROLES.EMPRENDEDOR]: 'Emprendedor',
    [ROLES.MENTOR]: 'Mentor / Juez',
    [ROLES.VISITANTE]: 'Visitante',
};

/**
 * Lleva cualquier variante (admin, ROLE_ADMIN, ["ROLE_ADMIN"]) a ADMIN.
 * Devuelve null si no reconoce nada.
 */
export const normalizeRole = (role) => {
    const raw = Array.isArray(role) ? role[0] : role;
    if (raw === null || raw === undefined) return null;

    const normalized = String(raw).toUpperCase().replace(/^ROLE_/, '');
    return Object.values(ROLES).includes(normalized) ? normalized : null;
};

/** Extrae el rol de un JWT ya decodificado, mirando las claves que usa la API. */
export const roleFromToken = (decoded) =>
    normalizeRole(decoded?.role ?? decoded?.rol ?? decoded?.roles);

export const hasRole = (role, allowed) => {
    if (!allowed || allowed.length === 0) return true;
    const normalized = normalizeRole(role);
    return normalized !== null && allowed.map(normalizeRole).includes(normalized);
};

export const roleLabel = (role) => ROLE_LABELS[normalizeRole(role)] ?? 'Usuario';

/** Ruta de aterrizaje tras el login. */
export const homePathForRole = (role) =>
    normalizeRole(role) === ROLES.ADMIN ? '/admin' : '/';
