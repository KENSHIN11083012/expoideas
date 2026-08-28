import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';

const MetricsCards = () => {
    const { filteredUsuarios, usuariosRaw } = useDirectory();

    // Calculate metrics
    const totalActive = filteredUsuarios.length;
    
    // Total unique competencies in current selection
    const uniqueCompetencies = new Set(
        filteredUsuarios.flatMap(u => u.competenciasTecnicas || [])
    ).size;

    // Faculties represented in current selection
    const faculties = new Set(
        filteredUsuarios.map(u => u.facultad).filter(Boolean)
    ).size;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Perfiles Activos</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalActive}</h3>
                    <span className="text-xs font-semibold text-slate-400">/ {usuariosRaw.length}</span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Disponible Colaboración</p>
                <h3 className="text-2xl font-black text-primary">{totalActive}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Competencias Únicas</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{uniqueCompetencies}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Facultades</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{faculties}</h3>
            </div>
        </div>
    );
};

export default MetricsCards;
