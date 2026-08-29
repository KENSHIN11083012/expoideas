import React from 'react';
import { useUserManagement } from '../hooks/useUserManagement';
import { ROLES, ROLE_LABELS, normalizeRole } from '../utils/roles';

/** Valor que espera el backend: el enum RolUsuario esta en minusculas. */
const rolParaApi = (rol) => String(rol).toLowerCase();

const ESTILOS_ROL = {
    [ROLES.ADMIN]: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    [ROLES.DOCENTE]: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    [ROLES.EMPRENDEDOR]: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    [ROLES.MENTOR]: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    [ROLES.VISITANTE]: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
};

const Avatar = ({ usuario }) => {
    if (usuario.fotoUrl) {
        return (
            <img
                src={usuario.fotoUrl}
                alt={`${usuario.nombres} ${usuario.apellidos}`}
                className="size-10 rounded-full object-cover"
            />
        );
    }
    const iniciales = `${usuario.nombres?.[0] ?? ''}${usuario.apellidos?.[0] ?? ''}`.toUpperCase();
    return (
        <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
            {iniciales || '?'}
        </div>
    );
};

const SelectorDeRol = ({ usuario, updatingId, onChange }) => {
    const rolActual = normalizeRole(usuario.rol);
    const esAdmin = rolActual === ROLES.ADMIN;

    return (
        <select
            id={`rol-${usuario.id}`}
            aria-label={`Rol de ${usuario.nombres} ${usuario.apellidos}`}
            value={rolActual ?? ROLES.EMPRENDEDOR}
            disabled={updatingId === usuario.id || esAdmin}
            onChange={(e) => onChange(usuario, rolParaApi(e.target.value))}
            className={`text-sm font-semibold rounded-lg border px-3 py-1.5 disabled:opacity-60 ${ESTILOS_ROL[rolActual] ?? ESTILOS_ROL[ROLES.VISITANTE]}`}
        >
            {/* El rol admin no se otorga ni se quita desde aqui. */}
            {[ROLES.DOCENTE, ROLES.EMPRENDEDOR, ROLES.MENTOR, ROLES.VISITANTE].map((rol) => (
                <option key={rol} value={rol}>{ROLE_LABELS[rol]}</option>
            ))}
            {esAdmin && <option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</option>}
        </select>
    );
};

const AdminUsers = () => {
    const { usuarios, isLoading, error, updatingId, handleRoleChange, handleDeleteUser } = useUserManagement();

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    Gestion de usuarios
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Actualiza el rol de cada cuenta ({Object.values(ROLE_LABELS).join(', ').toLowerCase()}).
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    {error}
                </div>
            )}

            {isLoading ? (
                <p className="text-slate-500">Cargando usuarios...</p>
            ) : usuarios.length === 0 ? (
                <p className="text-slate-500">Todavia no hay usuarios registrados.</p>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-100 dark:border-slate-700/50">
                            <tr className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Adscripcion</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {usuarios.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar usuario={usuario} />
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {usuario.nombres} {usuario.apellidos}
                                                </p>
                                                <p className="text-sm text-slate-500">{usuario.correoInstitucional}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        <p>{usuario.sede ?? 'Sin sede'}</p>
                                        <p className="text-slate-400">{usuario.programaAcademico ?? 'Sin programa'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <SelectorDeRol
                                            usuario={usuario}
                                            updatingId={updatingId}
                                            onChange={handleRoleChange}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteUser(usuario.id)}
                                            disabled={normalizeRole(usuario.rol) === ROLES.ADMIN}
                                            className="text-sm font-semibold text-red-600 hover:underline disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
