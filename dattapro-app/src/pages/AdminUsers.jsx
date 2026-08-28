import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserManagement } from '../hooks/useUserManagement';

const AdminUsers = () => {
    const navigate = useNavigate();
    const {
        usuarios,
        isLoading,
        error,
        updatingId,
        handleRoleChange,
        handleStatusChange,
        handleDeleteUser
    } = useUserManagement();

    const [searchTerm, setSearchTerm] = useState('');
    const [isListView, setIsListView] = useState(false);

    const filteredUsuarios = usuarios.filter((usuario) => {
        const fullName = `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
            (usuario.correoInstitucional && usuario.correoInstitucional.toLowerCase().includes(searchTerm.toLowerCase()));
    });



    const UserAvatar = ({ usuario, size = "h-14 w-14" }) => (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white font-bold font-display shadow-inner overflow-hidden flex-shrink-0`}>
            {usuario.foto ? (
                <img
                    src={`data:image/jpeg;base64,${usuario.foto}`}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover rounded-full"
                />
            ) : (
                <span className={size === "h-10 w-10" ? "text-sm" : "text-xl"}>
                    {usuario.nombres?.charAt(0)}{usuario.apellidos?.charAt(0)}
                </span>
            )}
        </div>
    );

    const RoleSelect = ({ usuario }) => {
        const styles = {
            admin: 'bg-[#23B845]/10 text-[#23B845] border-[#23B845]/20 dark:bg-[#23B845]/20 dark:text-[#23B845] dark:border-[#23B845]/30',
            directivo: 'bg-[#D9801A]/10 text-[#D9801A] border-[#D9801A]/20 dark:bg-[#D9801A]/20 dark:text-[#D9801A] dark:border-[#D9801A]/30',
            profesor: 'bg-[#1D3ECF]/10 text-[#1D3ECF] border-[#1D3ECF]/20 dark:bg-[#1D3ECF]/20 dark:text-[#1D3ECF] dark:border-[#1D3ECF]/30',
            default: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
        };
        const currentStyle = styles[usuario.rol] || styles.default;

        return (
            <div className="relative min-w-[120px] max-w-[140px]">
                <select
                    id={`rol-${usuario.id}`}
                    value={usuario.rol || 'profesor'}
                    disabled={updatingId === usuario.id || usuario.rol === 'admin'}
                    onChange={(e) => handleRoleChange(usuario, e.target.value)}
                    className={`block w-full pl-3 pr-10 py-2 text-sm font-medium border ${currentStyle} rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <option value="profesor" className="bg-white text-[#1D3ECF] dark:bg-slate-800 dark:text-[#1D3ECF]">Profesor</option>
                    <option value="directivo" className="bg-white text-[#D9801A] dark:bg-slate-800 dark:text-[#D9801A]">Directivo</option>
                    {usuario.rol === 'admin' && <option value="admin" className="bg-white text-[#23B845] dark:bg-slate-800 dark:text-[#23B845]">Admin</option>}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                    {updatingId === usuario.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            </div>
        );
    };

    const StatusSelect = ({ usuario }) => {
        const styles = {
            completo: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30',
            rechazado: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30',
            pendiente: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30',
            default: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
        };
        const currentStyle = styles[usuario.estadoFormulario] || styles.default;

        return (
            <div className="relative min-w-[120px] max-w-[140px]">
                <select
                    id={`status-${usuario.id}`}
                    value={usuario.estadoFormulario || 'pendiente'}
                    disabled={updatingId === usuario.id}
                    onChange={(e) => handleStatusChange(usuario, e.target.value)}
                    className={`block w-full pl-3 pr-10 py-2 text-sm font-medium border ${currentStyle} rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <option value="pendiente" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Pendiente</option>
                    <option value="completo" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Completo</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                    {updatingId === usuario.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Header Section */}
                <div className="mb-8 md:flex md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                            Gestión de Usuarios
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Administra los perfiles y actualiza los roles (admin, profesor, directivo).
                        </p>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-3 md:mt-0">
                        {/* Search Bar */}
                        <div className="relative rounded-xl shadow-sm w-full sm:w-64 md:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 sm:text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl py-2.5 transition-colors outline-none"
                                placeholder="Buscar usuario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Toggle View Buttons */}
                        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setIsListView(false)}
                                className={`p-2 rounded-lg transition-all ${!isListView ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                title="Vista de Cuadrícula"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsListView(true)}
                                className={`p-2 rounded-lg transition-all ${isListView ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                title="Vista de Lista"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-red-800 dark:text-red-300">Hubo un problema</h3>
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                ) : filteredUsuarios.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">No hay usuarios registrados</h3>
                        <p className="mt-1 text-sm text-slate-500">Intenta buscar con otros términos.</p>
                    </div>
                ) : isListView ? (
                    /* LIST VIEW */
                    <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Progreso</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredUsuarios.map((usuario) => (
                                        <tr key={usuario.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <UserAvatar usuario={usuario} size="h-10 w-10" />
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {usuario.nombres} {usuario.apellidos}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                            {usuario.correoInstitucional}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col w-32 gap-1.5">
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <span className={usuario.porcentajeCompletitud >= 80 ? 'text-emerald-600' : usuario.porcentajeCompletitud >= 40 ? 'text-amber-600' : 'text-red-600'}>
                                                            {usuario.porcentajeCompletitud || 0}%
                                                        </span>
                                                        <span className="text-slate-400">100%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${usuario.porcentajeCompletitud >= 80 ? 'bg-emerald-500' :
                                                                usuario.porcentajeCompletitud >= 40 ? 'bg-amber-400' :
                                                                    'bg-red-500'
                                                                }`}
                                                            style={{ width: `${usuario.porcentajeCompletitud || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <RoleSelect usuario={usuario} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusSelect usuario={usuario} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/perfil/ver/${usuario.id}`)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Ver Perfil"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(usuario.id)}
                                                        disabled={usuario.rol === 'admin'}
                                                        className={`p-2 rounded-lg transition-colors ${usuario.rol === 'admin' ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'}`}
                                                        title="Eliminar Usuario"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredUsuarios.map((usuario) => (
                            <div key={usuario.id || usuario.correoInstitucional} className="bg-white dark:bg-slate-950 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center space-x-4">
                                        <UserAvatar usuario={usuario} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                                                {usuario.nombres} {usuario.apellidos}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                                    ID: {usuario.id || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">{usuario.correoInstitucional}</span>
                                        </div>

                                        {/* Progress Indicator */}
                                        <div className="mt-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                                <span className="text-slate-400">Progreso del Perfil</span>
                                                <span className={usuario.porcentajeCompletitud >= 80 ? 'text-emerald-600' : usuario.porcentajeCompletitud >= 40 ? 'text-amber-600' : 'text-red-600'}>
                                                    {usuario.porcentajeCompletitud || 0}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-inner p-[1px]">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${usuario.porcentajeCompletitud >= 80 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                                                        usuario.porcentajeCompletitud >= 40 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]' :
                                                            'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                                        }`}
                                                    style={{ width: `${usuario.porcentajeCompletitud || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor={`rol-${usuario.id}`} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Rol
                                            </label>
                                            <RoleSelect usuario={usuario} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor={`status-${usuario.id}`} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Estado
                                            </label>
                                            <StatusSelect usuario={usuario} />
                                        </div>
                                    </div>

                                    {usuario.rol === 'admin' && (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            El rol de administrador no se puede modificar
                                        </p>
                                    )}

                                    <button
                                        onClick={() => navigate(`/perfil/ver/${usuario.id}`)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors border bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Ver Perfil Completo
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(usuario.id)}
                                        disabled={usuario.rol === 'admin'}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${usuario.rol === 'admin'
                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                            : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Eliminar Usuario
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
