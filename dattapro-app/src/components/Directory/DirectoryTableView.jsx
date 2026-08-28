import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectory } from '../../context/DirectoryContext';
import { TABLE_COLUMNS } from '../../utils/directoryConfig';

const DirectoryTableView = () => {
    const navigate = useNavigate();
    const { filteredUsuarios, toggleFavorite, favorites } = useDirectory();

    const renderCellContent = (usuario, columnKey) => {
        const val = usuario[columnKey];
        if (columnKey === 'nombreCompleto') {
            return (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {usuario.nombres?.charAt(0)}{usuario.apellidos?.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={val}>{val}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={usuario.correoInstitucional}>{usuario.correoInstitucional}</div>
                    </div>
                </div>
            );
        }
        
        if (Array.isArray(val)) {
            return (
                <div className="flex flex-wrap gap-1 max-w-[250px]">
                    {val.slice(0, 2).map((item, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full truncate max-w-[100px]" title={item}>
                            {item}
                        </span>
                    ))}
                    {val.length > 2 && (
                        <span className="text-[10px] font-semibold text-slate-400">+{val.length - 2}</span>
                    )}
                </div>
            );
        }

        return (
            <div className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={val || 'N/A'}>
                {val || <span className="text-slate-400 italic">N/A</span>}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-950/50">
                        <tr>
                            {TABLE_COLUMNS.map((col) => (
                                <th 
                                    key={col.key} 
                                    className={`px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsuarios.map((usuario) => (
                            <tr key={usuario.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                {TABLE_COLUMNS.map((col) => (
                                    <td key={col.key} className={`px-4 py-3 whitespace-nowrap align-middle ${col.align === 'right' ? 'text-right' : ''}`}>
                                        {col.key === 'acciones' ? (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => toggleFavorite(usuario.id)}
                                                    className={`p-1.5 rounded-lg transition-colors ${favorites.includes(usuario.id) ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                    title="Guardar favorito"
                                                >
                                                    <svg className="w-4 h-4" fill={favorites.includes(usuario.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/perfil/ver/${usuario.id}`)}
                                                    className="px-3 py-1.5 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                                >
                                                    Ver Perfil
                                                </button>
                                            </div>
                                        ) : (
                                            renderCellContent(usuario, col.key)
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DirectoryTableView;
