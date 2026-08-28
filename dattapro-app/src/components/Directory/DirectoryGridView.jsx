import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectory } from '../../context/DirectoryContext';

const DirectoryGridView = () => {
    const navigate = useNavigate();
    const { filteredUsuarios, toggleFavorite, favorites } = useDirectory();

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsuarios.map((usuario) => (
                <div key={usuario.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 relative group">
                    <button 
                        onClick={() => toggleFavorite(usuario.id)}
                        className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors backdrop-blur-sm ${favorites.includes(usuario.id) ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 bg-white/50 dark:bg-slate-800/50 hover:text-amber-500 opacity-0 group-hover:opacity-100'}`}
                        title="Guardar favorito"
                    >
                        <svg className="w-5 h-5" fill={favorites.includes(usuario.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>

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
                                    {usuario.nombreCompleto}
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
                                        <span key={i} className="text-[10px] font-bold bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={sec}>
                                            {sec}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Competencias técnicas */}
                            {usuario.competenciasTecnicas?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {usuario.competenciasTecnicas.slice(0, 2).map((c, i) => (
                                        <span key={i} className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={c}>
                                            {c}
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
    );
};

export default DirectoryGridView;
