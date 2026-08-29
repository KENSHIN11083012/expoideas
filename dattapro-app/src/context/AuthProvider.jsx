import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from './authContext';
import { UNAUTHORIZED_EVENT } from '../services/apiClient';
import { ROLES, normalizeRole, roleFromToken } from '../utils/roles';

const STORAGE_KEYS = ['token', 'role', 'userId', 'userEmail', 'userName'];

/** Devuelve null tambien para los "undefined"/"null" que dejaban versiones viejas. */
const readStored = (key) => {
    const value = localStorage.getItem(key);
    return value && value !== 'undefined' && value !== 'null' ? value : null;
};

const isExpired = (decoded) =>
    typeof decoded?.exp === 'number' && decoded.exp < Date.now() / 1000;

const perfilGuardado = () => ({
    id: readStored('userId'),
    email: readStored('userEmail'),
    name: readStored('userName'),
});

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => readStored('token'));
    const [rolGuardado, setRolGuardado] = useState(() => normalizeRole(readStored('role')));
    const [perfil, setPerfil] = useState(perfilGuardado);

    const logout = useCallback(() => {
        setToken(null);
        setRolGuardado(null);
        setPerfil({ id: null, email: null, name: null });
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

    const login = useCallback((newToken, userData = {}, newRole) => {
        const rolNormalizado = normalizeRole(newRole);

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
    }, []);

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
        login,
        logout,
        updateUser,
        isAdmin: () => role === ROLES.ADMIN,
        isDocente: () => role === ROLES.DOCENTE,
        isEmprendedor: () => role === ROLES.EMPRENDEDOR,
        isMentor: () => role === ROLES.MENTOR,
    }), [user, token, sesion, role, login, logout, updateUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
