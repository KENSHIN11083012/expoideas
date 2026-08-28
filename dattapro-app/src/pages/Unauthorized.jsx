import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <div className="text-center max-w-md">
                {/* Icono */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ShieldOff className="w-12 h-12 text-red-500 dark:text-red-400" />
                    </div>
                </div>

                {/* Título */}
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                    Acceso denegado
                </h1>

                {/* Descripción */}
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    No tienes los permisos necesarios para acceder a esta sección.
                    Si crees que es un error, comunícate con el administrador.
                </p>

                {/* Botón volver */}
                <button
                    onClick={() => navigate('/', { replace: true })}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                               bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                               text-white font-medium transition-colors duration-200 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
