import { useCallback, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '@/context/authContext';
import { PRIMER_INGRESO_EVENT, UNAUTHORIZED_EVENT } from '@/services/apiClient';
import { ROLES, esDeGestion, roleFromToken } from '@/utils/roles';

/** Todo lo que la sesión guarda en localStorage. */
const STORAGE_KEYS = ['token', 'user', 'pendientes'];

const SIN_PERFIL = { email: null, nombres: null, apellidos: null, fotoId: null };

const isExpired = (decoded) =>
    typeof decoded?.exp === 'number' && decoded.exp < Date.now() / 1000;

/** Lee un JSON guardado; si no hay o está corrupto, devuelve el valor por defecto. */
const leerJson = (key, porDefecto, esValido) => {
    try {
        const valor = JSON.parse(localStorage.getItem(key));
        return esValido(valor) ? valor : porDefecto;
    } catch {
        return porDefecto;
    }
};

const pendientesGuardados = () => leerJson('pendientes', [], Array.isArray);
const perfilGuardado = () => ({ ...SIN_PERFIL, ...leerJson('user', {}, (v) => v !== null && typeof v === 'object') });

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [perfil, setPerfil] = useState(perfilGuardado);
    const [pendientes, setPendientes] = useState(pendientesGuardados);

    const guardarPerfil = useCallback((nuevo) => {
        setPerfil(nuevo);
        localStorage.setItem('user', JSON.stringify(nuevo));
    }, []);

    const guardarPendientes = useCallback((lista) => {
        setPendientes(lista);
        if (lista.length > 0) localStorage.setItem('pendientes', JSON.stringify(lista));
        else localStorage.removeItem('pendientes');
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setPerfil(SIN_PERFIL);
        setPendientes([]);
        STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    }, []);

    // La sesión se deriva del token, que trae el rol y el vencimiento, en vez de
    // mantenerse en un estado aparte sincronizado por un effect.
    const sesion = useMemo(() => {
        if (!token) return null;
        try {
            const decoded = jwtDecode(token);
            if (isExpired(decoded)) return null;
            return { role: roleFromToken(decoded), subject: decoded.sub ?? null };
        } catch {
            return null;
        }
    }, [token]);

    // Hay token pero no sirve (caducado o ilegible). No hace falta tocar el estado:
    // `sesion` ya es null y la app se comporta como sin sesión. Aquí solo se limpia
    // localStorage, que es el sistema externo.
    useEffect(() => {
        if (token && !sesion) {
            STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        }
    }, [token, sesion]);

    // Un 401 en cualquier petición cierra la sesión desde un solo sitio.
    useEffect(() => {
        window.addEventListener(UNAUTHORIZED_EVENT, logout);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
    }, [logout]);

    // Un 403 por primer ingreso pendiente (p. ej. le restablecieron la contraseña
    // con la sesión abierta) actualiza los pasos y las rutas llevan a resolverlos.
    useEffect(() => {
        const alRecibir = (evento) => guardarPendientes(evento.detail);
        window.addEventListener(PRIMER_INGRESO_EVENT, alRecibir);
        return () => window.removeEventListener(PRIMER_INGRESO_EVENT, alRecibir);
    }, [guardarPendientes]);

    /**
     * @param {string} nuevoToken JWT del login; de él salen el rol y el vencimiento
     * @param {{ email?: string, nombres?: string, apellidos?: string, fotoId?: string }} datos
     * @param {string[]} [nuevosPendientes] pasos de primer ingreso que devolvió el login
     */
    const login = useCallback((nuevoToken, datos = {}, nuevosPendientes = []) => {
        localStorage.setItem('token', nuevoToken);
        setToken(nuevoToken);
        guardarPerfil({ ...SIN_PERFIL, ...datos });
        guardarPendientes(nuevosPendientes);
    }, [guardarPerfil, guardarPendientes]);

    const completarPendiente = useCallback(
        (paso) => guardarPendientes(pendientes.filter((pendiente) => pendiente !== paso)),
        [pendientes, guardarPendientes],
    );

    /** Actualiza nombres, apellidos o foto (fotoId null la quita). */
    const updateUser = useCallback((datos) => guardarPerfil({ ...perfil, ...datos }), [perfil, guardarPerfil]);

    const user = useMemo(() => {
        if (!sesion) return null;
        return {
            ...perfil,
            email: perfil.email ?? sesion.subject,
            nombreCompleto: [perfil.nombres, perfil.apellidos].filter(Boolean).join(' '),
        };
    }, [sesion, perfil]);

    const role = sesion?.role ?? null;

    const value = useMemo(() => ({
        user,
        token: sesion ? token : null,
        role,
        /** Pasos de primer ingreso sin completar; mientras haya, las rutas protegidas llevan a /primer-ingreso. */
        pendientes: sesion ? pendientes : [],
        completarPendiente,
        login,
        logout,
        updateUser,
        isAdmin: () => role === ROLES.ADMIN,
        /** MacondoLab o administrador: acceso a Usuarios y Catálogos. */
        esGestion: () => esDeGestion(role),
    }), [user, token, sesion, role, pendientes, completarPendiente, login, logout, updateUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
