import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DirectoryProvider, useDirectory } from '../context/DirectoryContext';
import MetricsCards from '../components/Directory/MetricsCards';
import InsightsPanel from '../components/Directory/InsightsPanel';
import FilterSidebar from '../components/Directory/FilterSidebar';
import DirectoryTableView from '../components/Directory/DirectoryTableView';
import DirectoryGridView from '../components/Directory/DirectoryGridView';

const DashboardContent = () => {
    const { isLoading, error, filteredUsuarios, viewMode, usuariosRaw } = useDirectory();

    const exportToCSV = () => {
        if (!filteredUsuarios.length) return;

        const headers = [
            'Nombre Completo',
            'Nombres',
            'Apellidos',
            'Correo Institucional',
            'Programa Académico',
            'Facultad',
            'Ciudad',
            'Sectores de Experiencia',
            'Competencias Técnicas',
            'Competencias Transversales',
            'Idiomas',
            'Rol',
            'Estado del Formulario',
            'Desea Vincularse',
            'Autoriza Tratamiento de Datos'
        ];

        const escapeCSVValue = (val) => {
            if (val === null || val === undefined) return '';
            
            // If it is an array (e.g. sectors, competencies, languages), join elements with a separator
            if (Array.isArray(val)) {
                return val.join('; ');
            }
            
            // Convert boolean to user-friendly Spanish text
            if (typeof val === 'boolean') {
                return val ? 'Sí' : 'No';
            }
            
            return String(val).trim();
        };

        const formatCSVRow = (rowArray) => {
            return rowArray.map(val => {
                const escaped = escapeCSVValue(val).replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',');
        };

        const csvRows = [headers.join(',')];

        filteredUsuarios.forEach(u => {
            const rowData = [
                u.nombreCompleto,
                u.nombres,
                u.apellidos,
                u.correoInstitucional,
                u.programaAcademico,
                u.facultad,
                u.ciudad,
                u.sectoresExperiencia,
                u.competenciasTecnicas,
                u.competenciasTransversales,
                u.idiomas,
                u.rol ? u.rol.charAt(0).toUpperCase() + u.rol.slice(1) : '',
                u.estadoFormulario ? u.estadoFormulario.charAt(0).toUpperCase() + u.estadoFormulario.slice(1) : '',
                u.deseaVincularse,
                u.autorizaDatos
            ];
            csvRows.push(formatCSVRow(rowData));
        });

        // Add UTF-8 BOM to ensure accents and special characters (ñ, á, é...) are rendered correctly in Excel/Windows
        const csvString = '\uFEFF' + csvRows.join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `directorio_inteligente_export_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white mb-2">
                            Directorio Inteligente
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                            Panel estratégico para la exploración y análisis de capacidades académicas e investigativas institucionales.
                        </p>
                    </div>
                    <button 
                        onClick={exportToCSV}
                        disabled={filteredUsuarios.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold rounded-xl shadow-sm hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Exportar CSV
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-sm font-semibold text-slate-500 animate-pulse">Cargando inteligencia de datos...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Hubo un problema de conexión</h3>
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                ) : (
                    <>
                        <MetricsCards />
                        <InsightsPanel />
                        <FilterSidebar />

                        {filteredUsuarios.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <svg className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sin resultados</h3>
                                <p className="mt-1 text-sm text-slate-500">No se encontraron perfiles que coincidan con los criterios estratégicos seleccionados.</p>
                            </div>
                        ) : (
                            viewMode === 'grid' ? <DirectoryGridView /> : <DirectoryTableView />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const NetworkingSearchDirectivo = () => {
    const { isAdmin, isDirectivo } = useAuth();

    // Protección de ruta: solo admin y directivo pueden acceder
    if (!isAdmin() && !isDirectivo()) {
        return <Navigate to="/" replace />;
    }

    return (
        <DirectoryProvider>
            <DashboardContent />
        </DirectoryProvider>
    );
};

export default NetworkingSearchDirectivo;
