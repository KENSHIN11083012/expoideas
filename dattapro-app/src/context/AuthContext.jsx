import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [role, setRole] = useState(localStorage.getItem('role'));
    const [userName, setUserName] = useState(localStorage.getItem('userName'));

    useEffect(() => {
        if (!token) {
            setUser(null);
            return;
        }
        try {
            const decoded = jwtDecode(token);
            // Validar si el token ha expirado
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                setUser(null);
            } else {
                const storedEmail = localStorage.getItem('userEmail');
                const storedName = localStorage.getItem('userName');
                
                setUser({ 
                    email: storedEmail !== 'undefined' ? storedEmail : null, 
                    id: localStorage.getItem('userId'),
                    name: storedName !== 'undefined' ? storedName : null
                });
            }
        } catch (error) {
            setUser(null);
        }
    }, [token, role]);

    const login = (newToken, userData, newRole) => {
        setToken(newToken);
        setRole(newRole);
        setUser(userData);
        setUserName(userData.name || null);
        if (newToken) localStorage.setItem('token', newToken);
        if (newRole) localStorage.setItem('role', newRole);
        if (userData?.id) localStorage.setItem('userId', userData.id);
        if (userData?.email) localStorage.setItem('userEmail', userData.email);
        if (userData?.name) localStorage.setItem('userName', userData.name);
    };

    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
        if (data.email) localStorage.setItem('userEmail', data.email);
        if (data.name) {
            localStorage.setItem('userName', data.name);
            setUserName(data.name);
        }
    };

    const logout = () => {
        setToken(null);
        setRole(null);
        setUser(null);
        setUserName(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
    };

    const isAdmin = () => role && (String(role).toUpperCase() === 'ROLE_ADMIN' || String(role).toUpperCase() === 'ADMIN');
    const isProfesor = () => role && (String(role).toUpperCase() === 'ROLE_PROFESOR' || String(role).toUpperCase() === 'PROFESOR');
    const isDirectivo = () => role && (String(role).toUpperCase() === 'ROLE_DIRECTIVO' || String(role).toUpperCase() === 'DIRECTIVO');

    return (
        <AuthContext.Provider value={{ user, token, role, login, logout, isAdmin, isProfesor, isDirectivo, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
