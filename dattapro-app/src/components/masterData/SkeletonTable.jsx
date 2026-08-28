import React from 'react';

/**
 * Skeleton loader that mimics the catalog table structure.
 * @param {{ hasSubtitulo: boolean }} props
 */
const SkeletonTable = ({ hasSubtitulo = false }) => {
    const rows = Array.from({ length: 6 });

    return (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Fake header */}
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 grid gap-4"
                style={{ gridTemplateColumns: hasSubtitulo ? '60px 1fr 1fr 80px' : '60px 1fr 80px' }}>
                {['ID', 'Nombre', hasSubtitulo && 'Subtítulo', 'Acciones']
                    .filter(Boolean)
                    .map((col) => (
                        <div key={col} className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse w-16" />
                    ))}
            </div>

            {/* Fake rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {rows.map((_, i) => (
                    <div
                        key={i}
                        className="px-6 py-4 grid gap-4 items-center"
                        style={{ gridTemplateColumns: hasSubtitulo ? '60px 1fr 1fr 80px' : '60px 1fr 80px' }}
                    >
                        {/* ID */}
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-8" />
                        {/* Nombre */}
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"
                            style={{ width: `${55 + (i * 13) % 35}%` }} />
                        {/* Subtítulo (conditional) */}
                        {hasSubtitulo && (
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"
                                style={{ width: `${40 + (i * 17) % 40}%` }} />
                        )}
                        {/* Actions button placeholder */}
                        <div className="h-7 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonTable;
