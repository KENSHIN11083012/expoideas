/**
 * Roles de Expoideas y normalizacion.
 *
 * El backend emite el rol de dos formas segun el camino: el claim "role" del
 * JWT llega como ROLE_ADMIN y el campo "rol" de la respuesta de login llega
 * como admin. Dattapro resolvia esa diferencia en tres sitios distintos
 * (Login, AuthContext y ProtectedRoute), cada uno con su propio parche.
 * Aqui se resuelve una sola vez.
 *
 * Las reglas de permisos son espejo de RolUsuario en la API, que es quien
 * decide de verdad: aqui solo sirven para no ofrecer acciones que la API
 * rechazaria.
 */

/** En orden de menor a mayor alcance, que es como se listan en los selectores. */
export const ROLES = {
    ESTUDIANTE: 'ESTUDIANTE',
    DOCENTE: 'DOCENTE',
    JURADO: 'JURADO',
    MACONDOLAB: 'MACONDOLAB',
    ADMIN: 'ADMIN',
};

export const ROLE_LABELS = {
    [ROLES.ESTUDIANTE]: 'Estudiante',
    [ROLES.DOCENTE]: 'Docente',
    [ROLES.JURADO]: 'Jurado',
    [ROLES.MACONDOLAB]: 'MacondoLab',
    [ROLES.ADMIN]: 'Administrador',
};

/** Roles con acceso a la gestión de la plataforma (Usuarios y Catálogos). */
export const ROLES_DE_GESTION = [ROLES.MACONDOLAB, ROLES.ADMIN];

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

export const esDeGestion = (role) => ROLES_DE_GESTION.includes(normalizeRole(role));

/** Si el rol declara sede y facultad. Espejo de RolUsuario#requiereAdscripcion. */
export const requiereAdscripcion = (role) => [ROLES.DOCENTE, ROLES.ESTUDIANTE].includes(normalizeRole(role));

/**
 * Si `actor` puede administrar una cuenta con el rol `objetivo` (editarla,
 * cambiarle el rol, restablecer su contraseña). Espejo de RolUsuario#puedeGestionar.
 */
export const puedeGestionar = (actor, objetivo) => {
    const rolActor = normalizeRole(actor);
    if (rolActor === ROLES.ADMIN) return true;
    if (rolActor === ROLES.MACONDOLAB) return !esDeGestion(objetivo);
    return false;
};

/** Roles que `actor` puede asignar o con los que puede crear cuentas. */
export const rolesAsignablesPor = (actor) => Object.values(ROLES).filter((rol) => puedeGestionar(actor, rol));

/** Ruta de aterrizaje tras el login. */
export const homePathForRole = (role) => (esDeGestion(role) ? '/admin/usuarios' : '/');
