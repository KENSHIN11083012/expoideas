import { useCallback, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useQueryClient } from '@tanstack/react-query';
import { ONBOARDING_REQUIRED_EVENT, UNAUTHORIZED_EVENT } from '@/lib/apiClient';
import { ROLES, asRole, isManagement } from '@/lib/roles';
import { session } from '@/lib/session';
import { fullName } from '@/lib/text';
import { AuthContext } from './authContext';

const NO_PROFILE = { email: null, firstName: null, lastName: null, photoId: null };

const isExpired = (decoded) => typeof decoded?.exp === 'number' && decoded.exp < Date.now() / 1000;

/**
 * Sesión de la app. El token trae el correo, el rol y el vencimiento; el perfil
 * (nombre y foto, para la cabecera) y los pasos de primer ingreso se guardan
 * aparte. Todo persiste en localStorage (lib/session.js).
 */
export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [token, setToken] = useState(session.token);
    const [profile, setProfile] = useState(() => ({ ...NO_PROFILE, ...session.user() }));
    const [pendingSteps, setPendingSteps] = useState(session.pendingSteps);

    const savePendingSteps = useCallback((steps) => {
        setPendingSteps(steps);
        session.save({ pendingSteps: steps });
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setProfile(NO_PROFILE);
        setPendingSteps([]);
        session.clear();
        // Los datos en caché eran de esta cuenta.
        queryClient.clear();
    }, [queryClient]);

    // La sesión se deriva del token en vez de mantenerse en un estado aparte
    // sincronizado por un effect.
    const decoded = useMemo(() => {
        if (!token) return null;
        try {
            const claims = jwtDecode(token);
            return isExpired(claims) ? null : claims;
        } catch {
            return null;
        }
    }, [token]);

    // Hay token pero no sirve (vencido o ilegible). No hace falta tocar el estado:
    // `decoded` ya es null y la app se comporta como sin sesión. Aquí solo se
    // limpia localStorage, que es el sistema externo.
    useEffect(() => {
        if (token && !decoded) session.clear();
    }, [token, decoded]);

    // Un 401 en cualquier petición cierra la sesión desde un solo sitio.
    useEffect(() => {
        window.addEventListener(UNAUTHORIZED_EVENT, logout);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
    }, [logout]);

    // Un 403 por primer ingreso pendiente (p. ej. le restablecieron la contraseña
    // con la sesión abierta) actualiza los pasos y las rutas llevan a resolverlos.
    useEffect(() => {
        const onOnboardingRequired = (event) => savePendingSteps(event.detail);
        window.addEventListener(ONBOARDING_REQUIRED_EVENT, onOnboardingRequired);
        return () => window.removeEventListener(ONBOARDING_REQUIRED_EVENT, onOnboardingRequired);
    }, [savePendingSteps]);

    /**
     * @param {string} newToken  JWT del login; de él salen el rol y el vencimiento
     * @param {{ email?: string, firstName?: string, lastName?: string, photoId?: string }} user
     * @param {string[]} [steps] pasos de primer ingreso que devolvió el login
     */
    const login = useCallback(
        (newToken, user = {}, steps = []) => {
            const newProfile = { ...NO_PROFILE, ...user };
            session.save({ token: newToken, user: newProfile, pendingSteps: steps });
            setToken(newToken);
            setProfile(newProfile);
            setPendingSteps(steps);
        },
        [],
    );

    const completeStep = useCallback(
        (step) => savePendingSteps(pendingSteps.filter((pending) => pending !== step)),
        [pendingSteps, savePendingSteps],
    );

    /** Actualiza nombre o foto (photoId null la quita). */
    const updateUser = useCallback(
        (changes) => {
            const updated = { ...profile, ...changes };
            session.save({ user: updated });
            setProfile(updated);
        },
        [profile],
    );

    const value = useMemo(() => {
        const role = decoded ? asRole(decoded.role) : null;
        return {
            user: decoded
                ? { ...profile, email: profile.email ?? decoded.sub, fullName: fullName(profile.firstName, profile.lastName) }
                : null,
            token: decoded ? token : null,
            role,
            /** Pasos de primer ingreso sin completar; mientras haya, las rutas protegidas llevan al primer ingreso. */
            pendingSteps: decoded ? pendingSteps : [],
            isAdmin: role === ROLES.ADMIN,
            /** MacondoLab o administrador: acceso a Usuarios y Catálogos. */
            isManagement: isManagement(role),
            login,
            logout,
            updateUser,
            completeStep,
        };
    }, [decoded, profile, token, pendingSteps, login, logout, updateUser, completeStep]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
