import React, { useState, useMemo } from 'react';
import SkeletonTable from './SkeletonTable';

/**
 * Reusable data table for any master-data catalog.
 *
 * Props:
 *   items         {array}     Raw items from the API
 *   isLoading     {boolean}   Show skeleton while true
 *   error         {string}    Error message to display (null = no error)
 *   searchTerm    {string}    Debounced search string (filtered against nombre)
 *   hasSubtitulo  {boolean}   Show Subtítulo column for centros-investigativos
 *   onEdit        {function}  Called with the item to edit
 */
const CatalogTable = ({ items, isLoading, error, searchTerm, hasSubtitulo, onEdit }) => {
    const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

    // -------------------------------------------------------------------
    // Filter + Sort
    // -------------------------------------------------------------------
    const filtered = useMemo(() => {
        const term = (searchTerm || '').toLowerCase();
        return items.filter((item) =>
            (item.nombre || '').toLowerCase().includes(term)
        );
    }, [items, searchTerm]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const cmp = (a.nombre || '').localeCompare(b.nombre || '', 'es');
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortDir]);

    const toggleSort = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

    // -------------------------------------------------------------------
    // States
    // -------------------------------------------------------------------
    if (isLoading) return <SkeletonTable hasSubtitulo={hasSubtitulo} />;

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-8 text-center">
                <svg className="mx-auto h-10 w-10 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (sorted.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 py-16 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {searchTerm ? 'Sin resultados' : 'Sin registros'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {searchTerm
                        ? `No hay registros que coincidan con "${searchTerm}".`
                        : 'Haz clic en "Agregar" para crear el primer registro.'}
                </p>
            </div>
        );
    }

    // -------------------------------------------------------------------
    // Sort icon
    // -------------------------------------------------------------------
    const SortIcon = () => (
        <svg className="inline w-3.5 h-3.5 ml-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            {sortDir === 'asc'
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            }
        </svg>
    );

    // -------------------------------------------------------------------
    // Table
    // -------------------------------------------------------------------
    return (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                        <tr>
                            {/* ID */}
                            <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-16">
                                ID
                            </th>

                            {/* Nombre — sortable */}
                            <th
                                className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                onClick={toggleSort}
                            >
                                Nombre <SortIcon />
                            </th>

                            {/* Subtítulo — centros-investigativos only */}
                            {hasSubtitulo && (
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    Subtítulo
                                </th>
                            )}

                            {/* Acciones */}
                            <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {sorted.map((item) => (
                            <tr
                                key={item.id}
                                className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors"
                            >
                                {/* ID */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                        {item.id}
                                    </span>
                                </td>

                                {/* Nombre */}
                                <td className="px-6 py-4">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {item.nombre}
                                    </span>
                                </td>

                                {/* Subtítulo */}
                                {hasSubtitulo && (
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                            {item.subtitulo || '—'}
                                        </span>
                                    </td>
                                )}

                                {/* Acciones */}
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                            text-blue-600 dark:text-blue-400
                                            bg-blue-50 dark:bg-blue-900/20
                                            hover:bg-blue-100 dark:hover:bg-blue-900/40
                                            border border-blue-100 dark:border-blue-900/40
                                            rounded-lg transition-colors"
                                        title={`Editar "${item.nombre}"`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Row count footer */}
            <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400 font-medium">
                    {sorted.length} {sorted.length === 1 ? 'registro' : 'registros'}
                    {searchTerm && ` · filtrado de ${items.length} total`}
                </p>
            </div>
        </div>
    );
};

export default CatalogTable;
