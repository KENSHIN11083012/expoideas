import React, { useState, useRef } from 'react';
import CatalogTab from '../components/masterData/CatalogTab';
import Toast from '../components/masterData/Toast';

// ─────────────────────────────────────────────────────────────────────────────
// Catalog configuration array — add a new catalog here and the UI handles it.
// hasSubtitulo: true  → shows the Subtítulo column and field (centros only)
// ─────────────────────────────────────────────────────────────────────────────
const CATALOGS = [
    { key: 'tipos-vinculacion', label: 'Tipos de Vinculación', endpoint: 'tipos-vinculacion', hasSubtitulo: false },
    { key: 'tipos-servicios', label: 'Tipos de Servicios', endpoint: 'tipos-servicios', hasSubtitulo: false },
    { key: 'tipos-proyecto', label: 'Tipos de Proyecto', endpoint: 'tipos-proyecto', hasSubtitulo: false },
    { key: 'sedes', label: 'Sedes', endpoint: 'sedes', hasSubtitulo: false },
    { key: 'sectores-experiencia', label: 'Sectores de Experiencia', endpoint: 'sectores-experiencia', hasSubtitulo: false },
    { key: 'programas-academicos', label: 'Programas Académicos', endpoint: 'programas-academicos', hasSubtitulo: false },
    { key: 'intereses', label: 'Intereses', endpoint: 'intereses', hasSubtitulo: false },
    { key: 'idiomas', label: 'Idiomas', endpoint: 'idiomas', hasSubtitulo: false },
    { key: 'facultades', label: 'Facultades', endpoint: 'facultades', hasSubtitulo: false },
    { key: 'competencias-transversales', label: 'Competencias Transversales', endpoint: 'competencias-transversales', hasSubtitulo: false },
    { key: 'competencias-tecnicas', label: 'Competencias Técnicas', endpoint: 'competencias-tecnicas', hasSubtitulo: false },
    { key: 'centros-investigativos', label: 'Centros Investigativos', endpoint: 'centros-investigativos', hasSubtitulo: true },
    { key: 'areas-especialidad', label: 'Áreas de Especialidad', endpoint: 'areas-especialidad', hasSubtitulo: false },
    { key: 'areas-conocimiento', label: 'Áreas de Conocimiento', endpoint: 'areas-conocimiento', hasSubtitulo: false },
];

const GestionDatosMaestros = () => {
    const [activeKey, setActiveKey] = useState(CATALOGS[0].key);
    const toastRef = useRef(null);

    const activeCatalog = CATALOGS.find((c) => c.key === activeKey);

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        {/* Database icon */}
                        <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3M4 7v5c0 1.657 3.582 3 8 3s8-1.343 8-3V7M4 7c0 1.657 3.582 3 8 3s8-1.343 8-3m0 10c0 1.657-3.582 3-8 3s-8-1.343-8-3v-5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                Gestión de Datos Maestros
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                Administra los catálogos del sistema. Selecciona un catálogo para ver, agregar o editar registros.
                            </p>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="mt-5 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                            {CATALOGS.length} catálogos disponibles
                        </div>
                        {/*<div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                            Solo GET · POST · PUT
                        </div>*/}
                    </div>
                </div>

                {/* ── Tab Navigation ──────────────────────────────────────── */}
                <div className="mb-6 -mx-4 sm:mx-0">
                    <div className="overflow-x-auto pb-1 scrollbar-none">
                        <div className="flex gap-1.5 px-4 sm:px-0 min-w-max sm:flex-wrap sm:min-w-0">
                            {CATALOGS.map((catalog) => {
                                const isActive = catalog.key === activeKey;
                                return (
                                    <button
                                        key={catalog.key}
                                        onClick={() => setActiveKey(catalog.key)}
                                        className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all
                                            ${isActive
                                                ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {catalog.label}
                                        {catalog.hasSubtitulo && (
                                            <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-md text-[9px] font-black uppercase tracking-wide">
                                                +
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Active Catalog Section ──────────────────────────────── */}
                <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Section header */}
                    <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M3 10h18M3 6h18M3 14h12M3 18h8" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-900 dark:text-white">
                                    {activeCatalog?.label}
                                </h2>
                                {activeCatalog?.hasSubtitulo && (
                                    <p className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider mt-0.5">
                                        Incluye campo Subtítulo
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab body */}
                    <div className="p-6">
                        {/*
                          Render only the active catalog tab.
                          Unmounting the inactive ones enforces lazy loading:
                          each tab fetches data only on its first mount.
                        */}
                        {activeCatalog && (
                            <CatalogTab
                                key={activeCatalog.key}
                                catalog={activeCatalog}
                                toastRef={toastRef}
                            />
                        )}
                    </div>
                </div>

            </div>

            {/* Shared toast instance — one for the entire page */}
            <Toast ref={toastRef} />
        </div>
    );
};

export default GestionDatosMaestros;
