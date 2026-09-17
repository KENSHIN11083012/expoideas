import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { get, put } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { roleLabel } from '../utils/roles';

/**
 * Perfil del usuario: nucleo de identidad.
 *
 * Sustituye al PerfilWizard de cuatro pasos de Dattapro, que capturaba el
 * perfil de un docente investigador (CvLAC, competencias, idiomas, formacion).
 * Cuando Expoideas tenga perfiles por rol, cada uno anadira su propia seccion.
 */
const Perfil = () => {
    const { role, updateUser } = useAuth();
    const [perfil, setPerfil] = useState(null);
    const [form, setForm] = useState({ nombres: '', apellidos: '' });
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // /usuarios/me identifica al usuario por la sesion: no depende de un id
    // guardado en localStorage, que en Dattapro llegaba como undefined.
    useEffect(() => {
        let cancelado = false;

        get('/usuarios/me')
            .then((data) => {
                if (cancelado) return;
                setPerfil(data);
                setForm({
                    nombres: data.nombres ?? '',
                    apellidos: data.apellidos ?? '',
                });
            })
            .catch((error) => {
                if (!cancelado) toast.error(error.message);
            })
            .finally(() => {
                if (!cancelado) setCargando(false);
            });

        return () => { cancelado = true; };
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const actualizado = await put('/usuarios/me', form);
            setPerfil(actualizado);
            updateUser({ name: `${actualizado.nombres} ${actualizado.apellidos}`.trim() });
            toast.success('Perfil actualizado');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return <div className="p-8 text-slate-500">Cargando perfil...</div>;
    }

    if (!perfil) {
        return <div className="p-8 text-slate-500">No se pudo cargar tu perfil.</div>;
    }

    const campos = [
        { name: 'nombres', label: 'Nombres', type: 'text' },
        { name: 'apellidos', label: 'Apellidos', type: 'text' },
    ];

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    Mi perfil
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{roleLabel(role)}</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
                {campos.map(({ name, label, type }) => (
                    <div key={name}>
                        <label htmlFor={name} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {label}
                        </label>
                        <input
                            id={name}
                            name={name}
                            type={type}
                            value={form[name]}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                ))}

                {/* Solo un admin puede cambiar estos campos, asi que se muestran como lectura.
                    El correo es el usuario de login: cambiarlo invalidaria la sesion. */}
                <dl className="grid grid-cols-2 gap-4 pt-2">
                    <div className="col-span-2">
                        <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Correo institucional</dt>
                        <dd className="text-slate-700 dark:text-slate-300 mt-1">{perfil.correoInstitucional}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Sede</dt>
                        <dd className="text-slate-700 dark:text-slate-300 mt-1">{perfil?.sede ?? 'Sin asignar'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Programa</dt>
                        <dd className="text-slate-700 dark:text-slate-300 mt-1">{perfil?.programaAcademico ?? 'Sin asignar'}</dd>
                    </div>
                </dl>

                <button
                    type="submit"
                    disabled={guardando}
                    className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-60"
                >
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </form>
        </div>
    );
};

export default Perfil;
