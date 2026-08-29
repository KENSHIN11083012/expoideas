import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Icon = ({ d }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const PATHS = {
    inicio: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    perfil: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    seguridad: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    usuarios: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    catalogos: 'M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3M4 7v5c0 1.657 3.582 3 8 3s8-1.343 8-3V7M4 7c0 1.657 3.582 3 8 3s8-1.343 8-3m0 10c0 1.657-3.582 3-8 3s-8-1.343-8-3v-5',
};

const Sidebar = () => {
    const { isAdmin } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { label: 'Inicio', path: '/', icon: PATHS.inicio },
        { label: 'Mi Perfil', path: '/perfil', icon: PATHS.perfil },
        { label: 'Seguridad', path: '/seguridad', icon: PATHS.seguridad },
    ];

    if (isAdmin()) {
        navItems.push(
            { label: 'Gestion de Usuarios', path: '/admin', icon: PATHS.usuarios },
            { label: 'Catalogos', path: '/admin/datos-maestros', icon: PATHS.catalogos },
        );
    }

    return (
        <aside className="w-64 bg-white dark:bg-[#072B3B] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0 z-20">
            <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium group ${isActive(item.path)
                            ? 'bg-primary/10 text-primary shadow-sm border border-primary/10'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-primary'
                            }`}
                    >
                        <div className={`flex-shrink-0 ${isActive(item.path) ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
                            <Icon d={item.icon} />
                        </div>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
