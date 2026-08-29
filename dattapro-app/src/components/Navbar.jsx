import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { roleLabel } from '../utils/roles';
import logoApp from '../assets/brand/logo-app.png';

const Navbar = () => {
    const { logout, role, user } = useAuth();
    const navigate = useNavigate();

    const displayRole = roleLabel(role);
    const displayName = user?.name || user?.email || 'Usuario';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50">
            {/* Logo y Marca */}
            <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-4">
                    <div className="size-10">
                        <img src={logoApp} alt="Logo de Expoideas" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-2xl font-normal tracking-tight text-slate-900 font-montserrat">
                        <span className="font-bold">Expo</span>ideas
                    </span>
                </Link>
            </div>


            {/* Acciones de Usuario */}
            <div className="flex items-center space-x-6">
                <Link
                    to="/seguridad"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    title="Seguridad"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="hidden lg:block">Seguridad</span>
                </Link>

                <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                        {displayName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                        {displayRole}
                    </span>
                </div>

                <div className="h-10 w-10 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                        src={`https://ui-avatars.com/api/?name=${displayName}&background=3db4ed&color=fff`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Cerrar sesión"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
