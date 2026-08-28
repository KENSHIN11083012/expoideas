import React, { useMemo } from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { generateStrategicInsights } from '../../utils/directoryAnalytics';

const InsightsPanel = () => {
    const { filteredUsuarios, usuariosRaw } = useDirectory();

    const insights = useMemo(() => {
        return generateStrategicInsights(filteredUsuarios, usuariosRaw.length);
    }, [filteredUsuarios, usuariosRaw.length]);

    if (!insights || insights.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Insights Estratégicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                         dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-bold">$1</strong>') }}
                    />
                ))}
            </div>
        </div>
    );
};

export default InsightsPanel;
