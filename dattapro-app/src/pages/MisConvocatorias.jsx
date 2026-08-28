import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const MisConvocatorias = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [convocatorias, setConvocatorias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchConvocatorias();
    }, []);

    const calculateStatus = (inicio, limite) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dateLimite = new Date(limite);
        dateLimite.setHours(0, 0, 0, 0);

        if (inicio) {
            const dateInicio = new Date(inicio);
            dateInicio.setHours(0, 0, 0, 0);
            if (today >= dateInicio && today <= dateLimite) return 'Abierta';
        } else if (today <= dateLimite) {
            return 'Abierta';
        }
        return 'Cerrada';
    };

    const fetchConvocatorias = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/convocatorias/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Error al cargar convocatorias');
            const data = await response.json();
            
            // Calcular y sincronizar estados
            const updatedData = data.map(convocatoria => {
                const calculatedStatus = calculateStatus(convocatoria.fechaInicio, convocatoria.fechaLimite);
                
                // Si el estado calculado es diferente al de la BD, sincronizamos
                if (calculatedStatus !== convocatoria.estado) {
                    syncStatusWithDB(convocatoria.id, { ...convocatoria, estado: calculatedStatus });
                    return { ...convocatoria, estado: calculatedStatus };
                }
                return convocatoria;
            });

            setConvocatorias(updatedData);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const syncStatusWithDB = async (id, updatedConvocatoria) => {
        try {
            await fetch(`${API_BASE_URL}/convocatorias/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedConvocatoria)
            });
        } catch (err) {
            console.error(`Error sincronizando estado de convocatoria ${id}:`, err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta convocatoria?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/convocatorias/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al eliminar la convocatoria');

            setConvocatorias(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('No se pudo eliminar la convocatoria: ' + err.message);
        }
    };

    const toggleVisibility = async (id) => {
        const convocatoria = convocatorias.find(c => c.id === id);
        if (!convocatoria) return;

        // Actualizamos localmente primero (optimistic update)
        const updatedVisible = !convocatoria.visible;
        const updatedConvocatoria = { ...convocatoria, visible: updatedVisible };

        try {
            const response = await fetch(`${API_BASE_URL}/convocatorias/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedConvocatoria)
            });

            if (!response.ok) throw new Error('Error al actualizar el visible');

            // Si fue exitoso, actualizamos el visible local permanentemente
            setConvocatorias(prev => prev.map(c =>
                c.id === id ? { ...c, visible: updatedVisible } : c
            ));
        } catch (err) {
            alert('No se pudo actualizar el visible: ' + err.message);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        const convocatoria = convocatorias.find(c => c.id === id);
        if (!convocatoria) return;

        const updatedConvocatoria = { ...convocatoria, estado: newStatus };

        try {
            const response = await fetch(`${API_BASE_URL}/convocatorias/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedConvocatoria)
            });

            if (!response.ok) throw new Error('Error al actualizar el estado');

            setConvocatorias(prev => prev.map(c =>
                c.id === id ? { ...c, estado: newStatus } : c
            ));
        } catch (err) {
            alert('No se pudo actualizar el estado: ' + err.message);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Abierta': return 'bg-emerald-50 text-emerald-600 border-emerald-100 focus:ring-emerald-500/20';
            case 'Cerrada': return 'bg-red-50 text-red-600 border-red-100 focus:ring-red-500/20';
            case 'Evaluando': return 'bg-amber-50 text-amber-600 border-amber-100 focus:ring-amber-500/20';
            case 'Finalizada': return 'bg-slate-100 text-slate-600 border-slate-200 focus:ring-slate-500/20';
            default: return 'bg-slate-50 text-slate-400 border-slate-100 focus:ring-slate-500/20';
        }
    };

    const filteredConvocatorias = [...convocatorias]
        .filter(c =>
            c.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => b.id - a.id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3db4ed]"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Historial de Convocatorias</h1>
                    <p className="text-slate-500 font-medium">Gestiona y publica las oportunidades de investigación.</p>
                </div>

                <button
                    onClick={() => navigate('/convocatorias/crear')}
                    className="flex items-center gap-2 px-6 py-3 bg-[#3db4ed] text-white rounded-2xl font-bold shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Crear Convocatoria
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar convocatoria..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#3db4ed]/20 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                <th className="px-8 py-5">Convocatoria</th>
                                <th className="px-8 py-5">Categoría</th>
                                <th className="px-8 py-5">Fechas (Inicio / Fin)</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                                <th className="px-8 py-5 text-center">Visibilidad</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredConvocatorias.length > 0 ? (
                                filteredConvocatorias.map((convocatoria) => (
                                    <tr key={convocatoria.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-slate-900 group-hover:text-[#3db4ed] transition-colors">
                                                {convocatoria.titulo}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold border border-sky-100">
                                                {convocatoria.categoria}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-medium text-slate-500">
                                            <div className="flex flex-col gap-1">
                                                <span><span className="text-slate-400">Desde:</span> {convocatoria.fechaInicio}</span>
                                                <span><span className="text-slate-400">Hasta:</span> {convocatoria.fechaLimite}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <select
                                                    value={convocatoria.estado || 'Abierta'}
                                                    disabled
                                                    className={`px-3 py-1.5 border rounded-xl text-[11px] font-black uppercase tracking-wider outline-none focus:ring-4 transition-all cursor-not-allowed opacity-80 ${getStatusStyles(convocatoria.estado)}`}
                                                >
                                                    <option value="Abierta">Abierta</option>
                                                    <option value="Cerrada">Cerrada</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => toggleVisibility(convocatoria.id)}
                                                    className={`p-2 rounded-xl transition-all ${convocatoria.visible ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                                                    title={convocatoria.visible ? 'Visible' : 'Oculto'}
                                                >
                                                    {convocatoria.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/convocatorias/editar/${convocatoria.id}`)}
                                                    className="p-2 text-slate-400 hover:text-[#3db4ed] hover:bg-sky-50 rounded-xl transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(convocatoria.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-12 text-center text-slate-400 font-medium italic">
                                        No se encontraron convocatorias.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MisConvocatorias;
