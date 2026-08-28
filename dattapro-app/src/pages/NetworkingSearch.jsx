import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useNetworkingData } from '../hooks/useNetworkingData';
import { extractUniqueFilterOptions, filterUsersAdvanced } from '../utils/networkingHelpers';

const NetworkingSearch = () => {
    const navigate = useNavigate();
    const { usuariosRaw: usuarios, isLoading, error } = useNetworkingData();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter states
    const [selectedPrograma, setSelectedPrograma] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedCompTecnica, setSelectedCompTecnica] = useState('');
    const [selectedCompTransversal, setSelectedCompTransversal] = useState('');

    // ── Extraer opciones únicas dinámicamente usando el helper ───────────────────────────────
    // Usamos el helper pero lo mapeamos para que coincida exactamente con la UI anterior
    const filterOptions = extractUniqueFilterOptions(usuarios);
    
    const programas = filterOptions.programaAcademico || [];
    const sectores = filterOptions.sectoresExperiencia || [];
    const compTecnicas = filterOptions.competenciasTecnicas || [];
    const compTransversales = filterOptions.competenciasTransversales || [];

    // ── Lógica de filtrado usando el helper ──────────────────────────────────────────────────
    const filters = {
        programaAcademico: selectedPrograma,
        sectoresExperiencia: selectedSector,
        competenciasTecnicas: selectedCompTecnica,
        competenciasTransversales: selectedCompTransversal
    };

    const filteredUsuarios = filterUsersAdvanced(usuarios, searchTerm, filters, 'nombre');

    // ── Componente auxiliar de select ───────────────────────────────────────

    const FilterSelect = ({ id, label, value, onChange, options, placeholder }) => (
        <div className="flex flex-col">
            <label htmlFor={id} className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    className="block w-full pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 rounded-xl transition-all appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                    <option value="">{placeholder}</option>
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        </div>
    );

    const hasActiveFilters = selectedPrograma || selectedSector || selectedCompTecnica || selectedCompTransversal;

    const clearFilters = () => {
        setSelectedPrograma('');
        setSelectedSector('');
        setSelectedCompTecnica('');
        setSelectedCompTransversal('');
    };

    return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                {/* Header Section */}
                <div className="mb-6">
                    <h2 className="text-2xl font-black leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
                        Directorio de Profesores
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Encuentra y conecta con investigadores y profesores de la red.
                    </p>
                </div>

                {/* Filters Bar */}
                <div className="mb-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                    {/* Search bar */}
                    <div className="mb-4">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1 block">
                            Buscar
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="search"
                                id="search"
                                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 transition-colors outline-none"
                                placeholder="Buscar por nombre o correo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FilterSelect
                            id="programa-select"
                            label="Programa Académico"
                            value={selectedPrograma}
                            onChange={(e) => setSelectedPrograma(e.target.value)}
                            options={programas}
                            placeholder="Todos los programas"
                        />
                        <FilterSelect
                            id="sector-select"
                            label="Sector de Experiencia"
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                            options={sectores}
                            placeholder="Todos los sectores"
                        />
                        <FilterSelect
                            id="comp-tecnica-select"
                            label="Competencia Técnica"
                            value={selectedCompTecnica}
                            onChange={(e) => setSelectedCompTecnica(e.target.value)}
                            options={compTecnicas}
                            placeholder="Todas las competencias"
                        />
                        <FilterSelect
                            id="comp-transversal-select"
                            label="Competencia Transversal"
                            value={selectedCompTransversal}
                            onChange={(e) => setSelectedCompTransversal(e.target.value)}
                            options={compTransversales}
                            placeholder="Todas las competencias"
                        />
                    </div>

                    {/* Active filters indicator & clear */}
                    {hasActiveFilters && (
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filtros activos:</span>
                            {selectedPrograma && (
                                <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                    {selectedPrograma}
                                </span>
                            )}
                            {selectedSector && (
                                <span className="text-[11px] font-bold bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 px-2.5 py-1 rounded-full">
                                    {selectedSector}
                                </span>
                            )}
                            {selectedCompTecnica && (
                                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                                    {selectedCompTecnica}
                                </span>
                            )}
                            {selectedCompTransversal && (
                                <span className="text-[11px] font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 px-2.5 py-1 rounded-full">
                                    {selectedCompTransversal}
                                </span>
                            )}
                            <button
                                onClick={clearFilters}
                                className="ml-auto text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                            >
                                Limpiar filtros ✕
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">No se encontraron profesores</h3>
                        <p className="mt-1 text-sm text-slate-500">Intenta buscar con otros términos o ajusta los filtros.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredUsuarios.map((usuario) => (
                            <div key={usuario.id || usuario.correoInstitucional} className="bg-white dark:bg-slate-950 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold font-display shadow-inner overflow-hidden">
                                                {usuario.foto ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${usuario.foto}`}
                                                        alt="Foto de perfil"
                                                        className="h-full w-full object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <span>{usuario.nombres?.charAt(0)}{usuario.apellidos?.charAt(0)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                                                {usuario.nombres} {usuario.apellidos}
                                            </p>
                                            <p className="text-sm font-medium text-primary truncate">
                                                {usuario.programaAcademico || 'Profesor / Investigador'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">{usuario.correoInstitucional}</span>
                                        </div>

                                        {/* Sectores de experiencia */}
                                        {usuario.sectoresExperiencia?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {usuario.sectoresExperiencia.slice(0, 2).map((sec, i) => (
                                                    <span key={i} className="text-[10px] font-bold bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">
                                                        {typeof sec === 'object' ? sec.nombre : sec}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Competencias técnicas */}
                                        {usuario.competenciasTecnicas?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {usuario.competenciasTecnicas.slice(0, 2).map((c, i) => (
                                                    <span key={i} className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                        {typeof c === 'object' ? c.nombre : c}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                                    <button
                                        onClick={() => navigate(`/perfil/ver/${usuario.id}`)}
                                        className="text-sm font-semibold text-primary hover:text-indigo-600 transition-colors w-full"
                                    >
                                        Ver Perfil Completo
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

export default NetworkingSearch;
