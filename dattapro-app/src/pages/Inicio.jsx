import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { roleLabel } from '../utils/roles';

/**
 * Portada de la app.
 *
 * Placeholder hasta que exista el modelo de Emprendimiento: aqui va la vitrina
 * de emprendimientos, el ranking y el feed. Por ahora solo saluda y expone los
 * accesos que ya funcionan.
 */
const Inicio = () => {
    const { user, role, isAdmin } = useAuth();
    const [totalUsuarios, setTotalUsuarios] = useState(null);

    useEffect(() => {
        let cancelado = false;

        get('/usuarios')
            .then((data) => {
                if (!cancelado) setTotalUsuarios(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => {
                if (!cancelado) setTotalUsuarios(null);
            });

        return () => { cancelado = true; };
    }, []);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-10">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                    {roleLabel(role)}
                </p>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                    Hola{user?.name ? `, ${user.name}` : ''}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Expoideas todavia esta en construccion. La vitrina de emprendimientos,
                    el ranking y el foro llegan con el modelo de Emprendimiento.
                </p>
            </header>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Usuarios registrados
                    </p>
                    <p className="text-4xl font-black text-slate-800 dark:text-white mt-2">
                        {totalUsuarios ?? '—'}
                    </p>
                </div>

                <Link
                    to="/perfil"
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 hover:shadow-md transition-shadow"
                >
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tu cuenta</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-2">Ver mi perfil</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Datos basicos y adscripcion academica.
                    </p>
                </Link>

                {isAdmin() && (
                    <Link
                        to="/admin"
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 hover:shadow-md transition-shadow"
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Administracion</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white mt-2">Gestionar usuarios</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Roles, adscripcion y contrasenas.
                        </p>
                    </Link>
                )}
            </section>
        </div>
    );
};

export default Inicio;
