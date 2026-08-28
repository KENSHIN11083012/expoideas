import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { role, isAdmin, isDirectivo, isProfesor } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    // Lista base de items (para profesores y directivos)
    const navItems = [
        {
            label: 'Inicio',
            path: '/',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            label: 'Mi Perfil',
            path: '/perfil',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            label: 'Convocatorias',
            path: '/convocatorias',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-.586-1.414l-4.5-4.5A2 2 0 0015.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14z" />
                </svg>
            )
        }
    ];

    // Solo profesores ven el Networking (buscador general)
    if (isProfesor()) {
        navItems.push({
            label: 'Networking',
            path: '/network',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        });
    }

    // Si es admin o directivo
    if (isAdmin() || isDirectivo()) {
        navItems.push({
            label: 'Directorio Inteligente',
            path: '/inteligencia-academica',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        });
    }

    // Si es admin, añadir opciones específicas
    if (isAdmin()) {
        navItems.push({
            label: 'Crear Convocatorias',
            path: '/mis-convocatorias',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        });
        navItems.push({
            label: 'Gestion Usuarios',
            path: '/admin',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        });
        navItems.push({
            label: 'Gestion Listas',
            path: '/admin/datos-maestros',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3M4 7v5c0 1.657 3.582 3 8 3s8-1.343 8-3V7M4 7c0 1.657 3.582 3 8 3s8-1.343 8-3m0 10c0 1.657-3.582 3-8 3s-8-1.343-8-3v-5" />
                </svg>
            )
        });
    }

    return (
        //<aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0 z-20">
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
                            {item.icon}
                        </div>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>

            {/*<div className="p-4 border-t border-slate-100 dark:border-slate-900">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Dattapro</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Red de investigadores y profesores.</p>
                </div>
            </div>*/}

        </aside>
    );
};

export default Sidebar;
