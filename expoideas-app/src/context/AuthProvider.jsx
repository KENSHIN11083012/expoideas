import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from './authContext';
import { PRIMER_INGRESO_EVENT, UNAUTHORIZED_EVENT } from '../services/apiClient';
import { ROLES, esDeGestion, normalizeRole, roleFromToken } from '../utils/roles';

const STORAGE_KEYS = ['token', 'role', 'userId', 'userEmail', 'userName', 'pendientes'];

/** Devuelve null tambien para los "undefined"/"null" que dejaban versiones viejas. */
const readStored = (key) => {
    const value = localStorage.getItem(key);
    return value && value !== 'undefined' && value !== 'null' ? value : null;
};

const isExpired = (decoded) =>
    typeof decoded?.exp === 'number' && decoded.exp < Date.now() / 1000;

/** Pasos de primer ingreso guardados con la sesión; lista vacía si no hay o están corruptos. */
const pendientesGuardados = () => {
    try {
        const lista = JSON.parse(localStorage.getItem('pendientes') ?? '[]');
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
};

const perfilGuardado = () => ({
    id: readStored('userId'),
    email: readStored('userEmail'),
    name: readStored('userName'),
});

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => readStored('token'));
    const [rolGuardado, setRolGuardado] = useState(() => normalizeRole(readStored('role')));
    const [perfil, setPerfil] = useState(perfilGuardado);
    const [pendientes, setPendientes] = useState(pendientesGuardados);

    const guardarPendientes = useCallback((lista) => {
        setPendientes(lista);
        if (lista.length > 0) localStorage.setItem('pendientes', JSON.stringify(lista));
        else localStorage.removeItem('pendientes');
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setRolGuardado(null);
        setPerfil({ id: null, email: null, name: null });
        setPendientes([]);
        STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    }, []);

    // La sesion se deriva del token en vez de mantenerse en un estado aparte
    // sincronizado por un effect. El rol del token manda sobre el de localStorage.
    const sesion = useMemo(() => {
        if (!token) return null;
        try {
            const decoded = jwtDecode(token);
            if (isExpired(decoded)) return null;
            return {
                role: roleFromToken(decoded) ?? rolGuardado,
                subject: decoded.sub ?? null,
            };
        } catch {
            return null;
        }
    }, [token, rolGuardado]);

    // Hay token pero no es utilizable (caducado o ilegible). No hace falta tocar
    // el estado: `sesion` ya es null y la app se comporta como sin sesion. Aqui
    // solo se limpia localStorage, que es el sistema externo.
    useEffect(() => {
        if (token && !sesion) {
            STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        }
    }, [token, sesion]);

    // Un 401 en cualquier peticion cierra la sesion desde un solo sitio.
    useEffect(() => {
        window.addEventListener(UNAUTHORIZED_EVENT, logout);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
    }, [logout]);

    // Un 403 por primer ingreso pendiente (p. ej. le restablecieron la contraseña
    // con la sesion abierta) actualiza los pasos y las rutas llevan a resolverlos.
    useEffect(() => {
        const alRecibir = (evento) => guardarPendientes(evento.detail);
        window.addEventListener(PRIMER_INGRESO_EVENT, alRecibir);
        return () => window.removeEventListener(PRIMER_INGRESO_EVENT, alRecibir);
    }, [guardarPendientes]);

    /** @param {string[]} [nuevosPendientes] pasos de primer ingreso que devolvio el login */
    const login = useCallback((newToken, userData = {}, newRole, nuevosPendientes = []) => {
        const rolNormalizado = normalizeRole(newRole);
        guardarPendientes(nuevosPendientes);

        setToken(newToken);
        setRolGuardado(rolNormalizado);
        setPerfil({
            id: userData.id ?? null,
            email: userData.email ?? null,
            name: userData.name ?? null,
        });

        if (newToken) localStorage.setItem('token', newToken);
        if (rolNormalizado) localStorage.setItem('role', rolNormalizado);
        if (userData.id) localStorage.setItem('userId', userData.id);
        if (userData.email) localStorage.setItem('userEmail', userData.email);
        if (userData.name) localStorage.setItem('userName', userData.name);
    }, [guardarPendientes]);

    const completarPendiente = useCallback(
        (paso) => guardarPendientes(pendientes.filter((pendiente) => pendiente !== paso)),
        [pendientes, guardarPendientes],
    );

    const updateUser = useCallback((data) => {
        setPerfil((prev) => ({ ...prev, ...data }));
        if (data.email) localStorage.setItem('userEmail', data.email);
        if (data.name) localStorage.setItem('userName', data.name);
    }, []);

    const user = useMemo(
        () => (sesion ? { ...perfil, email: perfil.email ?? sesion.subject } : null),
        [sesion, perfil],
    );

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
