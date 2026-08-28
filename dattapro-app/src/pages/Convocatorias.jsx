import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import techImg from '../assets/convocatorias/tech.png';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
        const day = parts[2].substring(0, 2);
        const month = parts[1];
        const year = parts[0];
        return `${day}-${month}-${year}`;
    }
    return dateStr;
};

const Convocatorias = () => {
    const navigate = useNavigate();
    const [convocatorias, setConvocatorias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedYearMonth, setSelectedYearMonth] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSectorId, setSelectedSectorId] = useState('');
    const [selectedCompTecnicaId, setSelectedCompTecnicaId] = useState('');
    const [selectedCompTransversalId, setSelectedCompTransversalId] = useState('');
    const [showClosed, setShowClosed] = useState(false);
    
    // Custom picker states
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    const pickerRef = useRef(null);

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filterOptions = [
        { label: 'Áreas de Conocimiento', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        { label: 'Financiación', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.73 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.407-2.73-1M12 16v-1m4-4V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' }
    ];

    useEffect(() => {
        fetchConvocatorias();
    }, []);

    const fetchConvocatorias = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/convocatorias`);
            if (!response.ok) throw new Error('Error al cargar convocatorias');
            const data = await response.json();
            // Solo mostramos las visibles en la vista pública
            setConvocatorias(data.filter(c => c.visible !== false));
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

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

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Abierta': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Cerrada': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3db4ed]"></div>
            </div>
        );
    }

    const currentYear = new Date().getFullYear();

    // Extraer categorías únicas de las convocatorias cargadas
    const categories = Array.from(
        new Map(
            convocatorias
                .map(item => {
                    const id = item.categoriaId || (typeof item.categoria === 'object' ? item.categoria?.id : null);
                    const nombre = typeof item.categoria === 'object' ? item.categoria?.nombre : item.categoria;
                    return { id, nombre };
                })
                .filter(cat => cat.id && cat.nombre)
                .map(cat => [cat.id, cat])
        ).values()
    );

    // Extraer sectores únicos de las convocatorias cargadas
    const sectors = Array.from(
        new Map(
            convocatorias
                .flatMap(item => {
                    const itemSectores = item.sectores || [];
                    const itemSectoresIds = item.sectoresIds || [];
                    
                    return itemSectores.map((sec, idx) => {
                        let id, nombre;
                        if (typeof sec === 'object' && sec !== null) {
                            id = sec.id;
                            nombre = sec.nombre;
                        } else {
                            id = itemSectoresIds[idx];
                            nombre = sec;
                        }
                        return { id, nombre };
                    });
                })
                .filter(sec => sec.id && sec.nombre)
                .map(sec => [sec.id, sec])
        ).values()
    );

    // Extraer competencias tecnicas unicas
    const compTecnicas = Array.from(
        new Map(
            convocatorias
                .flatMap(item => {
                    const itemComps = item.competenciasTecnicas || [];
                    const itemCompsIds = item.competenciasTecnicasIds || [];
                    
                    return itemComps.map((comp, idx) => {
                        let id, nombre;
                        if (typeof comp === 'object' && comp !== null) {
                            id = comp.id;
                            nombre = comp.nombre;
                        } else {
                            id = itemCompsIds[idx];
                            nombre = comp;
                        }
                        return { id, nombre };
                    });
                })
                .filter(comp => comp.id && comp.nombre)
                .map(comp => [comp.id, comp])
        ).values()
    );

    // Extraer competencias transversales unicas
    const compTransversales = Array.from(
        new Map(
            convocatorias
                .flatMap(item => {
                    const itemComps = item.competenciasTransversales || [];
                    const itemCompsIds = item.competenciasTransversalesIds || [];
                    
                    return itemComps.map((comp, idx) => {
                        let id, nombre;
                        if (typeof comp === 'object' && comp !== null) {
                            id = comp.id;
                            nombre = comp.nombre;
                        } else {
                            id = itemCompsIds[idx];
                            nombre = comp;
                        }
                        return { id, nombre };
                    });
                })
                .filter(comp => comp.id && comp.nombre)
                .map(comp => [comp.id, comp])
        ).values()
    );

    const filteredConvocatorias = convocatorias.filter(item => {
        const status = calculateStatus(item.fechaInicio, item.fechaLimite);
        
        if (!showClosed && status === 'Cerrada') return false;

        if (selectedYearMonth) {
            if (!item.fechaLimite) return false;
            // The item.fechaLimite is assumed YYYY-MM-DD
            const prefix = item.fechaLimite.substring(0, 7); // "YYYY-MM"
            if (prefix !== selectedYearMonth) return false;
        }

        if (selectedCategoryId) {
            const itemCategoryId = item.categoriaId || (typeof item.categoria === 'object' ? item.categoria?.id : null);
            if (!itemCategoryId || String(itemCategoryId) !== String(selectedCategoryId)) return false;
        }

        if (selectedSectorId) {
            const itemSectoresIds = item.sectoresIds || (
                Array.isArray(item.sectores) 
                    ? item.sectores.map(sec => typeof sec === 'object' && sec !== null ? sec.id : null).filter(Boolean)
                    : []
            );
            const hasSector = itemSectoresIds.some(id => String(id) === String(selectedSectorId));
            if (!hasSector) return false;
        }

        if (selectedCompTecnicaId) {
            const itemCompsIds = item.competenciasTecnicasIds || (
                Array.isArray(item.competenciasTecnicas) 
                    ? item.competenciasTecnicas.map(comp => typeof comp === 'object' && comp !== null ? comp.id : null).filter(Boolean)
                    : []
            );
            const hasComp = itemCompsIds.some(id => String(id) === String(selectedCompTecnicaId));
            if (!hasComp) return false;
        }

        if (selectedCompTransversalId) {
            const itemCompsIds = item.competenciasTransversalesIds || (
                Array.isArray(item.competenciasTransversales) 
                    ? item.competenciasTransversales.map(comp => typeof comp === 'object' && comp !== null ? comp.id : null).filter(Boolean)
                    : []
            );
            const hasComp = itemCompsIds.some(id => String(id) === String(selectedCompTransversalId));
            if (!hasComp) return false;
        }

        return true;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Convocatorias Abiertas</h1>
                <p className="text-lg font-medium text-slate-500 leading-relaxed max-w-2xl">
                    Descubre y aplica a las mejores oportunidades de financiación e innovación académica.
                </p>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col relative" ref={pickerRef}>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Fecha Límite</label>
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsPickerOpen(!isPickerOpen)}
                                className={`flex items-center justify-between gap-3 bg-slate-50 border ${isPickerOpen ? 'border-primary ring-1 ring-primary' : 'border-slate-200'} hover:border-primary/50 text-slate-700 text-sm rounded-2xl px-4 py-2.5 font-bold transition-all w-48`}
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>
                                        {selectedYearMonth 
                                            ? `${months[parseInt(selectedYearMonth.split('-')[1]) - 1]} ${selectedYearMonth.split('-')[0]}` 
                                            : 'Seleccionar mes'}
                                    </span>
                                </div>
                            </button>
                            {selectedYearMonth && (
                                <button 
                                    onClick={() => setSelectedYearMonth('')}
                                    className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Limpiar filtro"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Calendar */}
                        {isPickerOpen && (
                            <div className="absolute top-[110%] left-0 z-50 w-64 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <button 
                                        onClick={() => setPickerYear(y => y - 1)}
                                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="font-black text-slate-800 text-lg">{pickerYear}</span>
                                    <button 
                                        onClick={() => setPickerYear(y => y + 1)}
                                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {months.map((month, idx) => {
                                        const monthNum = (idx + 1).toString().padStart(2, '0');
                                        const value = `${pickerYear}-${monthNum}`;
                                        const isSelected = selectedYearMonth === value;
                                        
                                        return (
                                            <button
                                                key={month}
                                                onClick={() => {
                                                    setSelectedYearMonth(value);
                                                    setIsPickerOpen(false);
                                                }}
                                                className={`py-2 rounded-xl text-sm font-bold transition-all ${
                                                    isSelected 
                                                        ? 'bg-primary text-white shadow-md shadow-primary/30' 
                                                        : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {month}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filtro de Categoría */}
                    <div className="flex flex-col relative">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Categoría</label>
                        <div className="relative w-56">
                            <select
                                id="categoria-select"
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                className="block w-full pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:border-primary/50 rounded-2xl transition-all appearance-none cursor-pointer outline-none"
                            >
                                <option value="" className="text-slate-700 bg-white font-bold">Todas las categorías</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id} className="text-slate-700 bg-white font-semibold">
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Filtro de Sector */}
                    <div className="flex flex-col relative">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Sector</label>
                        <div className="relative w-56">
                            <select
                                id="sector-select"
                                value={selectedSectorId}
                                onChange={(e) => setSelectedSectorId(e.target.value)}
                                className="block w-full pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:border-primary/50 rounded-2xl transition-all appearance-none cursor-pointer outline-none"
                            >
                                <option value="" className="text-slate-700 bg-white font-bold">Todos los sectores</option>
                                {sectors.map(sec => (
                                    <option key={sec.id} value={sec.id} className="text-slate-700 bg-white font-semibold">
                                        {sec.nombre}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Filtro de Competencia Técnica */}
                    <div className="flex flex-col relative">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Comp. Técnica</label>
                        <div className="relative w-56">
                            <select
                                id="comp-tecnica-select"
                                value={selectedCompTecnicaId}
                                onChange={(e) => setSelectedCompTecnicaId(e.target.value)}
                                className="block w-full pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:border-primary/50 rounded-2xl transition-all appearance-none cursor-pointer outline-none"
                            >
                                <option value="" className="text-slate-700 bg-white font-bold">Todas</option>
                                {compTecnicas.map(comp => (
                                    <option key={comp.id} value={comp.id} className="text-slate-700 bg-white font-semibold">
                                        {comp.nombre}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Filtro de Competencia Transversal */}
                    <div className="flex flex-col relative">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Comp. Transversal</label>
                        <div className="relative w-56">
                            <select
                                id="comp-transversal-select"
                                value={selectedCompTransversalId}
                                onChange={(e) => setSelectedCompTransversalId(e.target.value)}
                                className="block w-full pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:border-primary/50 rounded-2xl transition-all appearance-none cursor-pointer outline-none"
                            >
                                <option value="" className="text-slate-700 bg-white font-bold">Todas</option>
                                {compTransversales.map(comp => (
                                    <option key={comp.id} value={comp.id} className="text-slate-700 bg-white font-semibold">
                                        {comp.nombre}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end h-full mt-5">
                        <label className="flex items-center cursor-pointer gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl hover:border-primary/50 transition-colors">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={showClosed}
                                onChange={(e) => setShowClosed(e.target.checked)}
                            />
                            <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            <span className="text-sm font-semibold text-slate-700">Mostrar Cerradas</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredConvocatorias.length > 0 ? (
                    filteredConvocatorias.map((item) => {
                        const status = calculateStatus(item.fechaInicio, item.fechaLimite);
                        return (
                            <div
                                key={item.id}
                                className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col h-full"
                            >
                                {/* Image Section */}
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={item.imagenFondo || techImg}
                                        alt={item.titulo}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    {/* Badges comentados temporalmente
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        <div className="backdrop-blur-md bg-sky-500/80 text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 shadow-lg">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            {item.match || 85}% MATCH
                                        </div>
                                        <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-lg uppercase">
                                            {item.entidad?.nombre || 'AGENCIA'}
                                        </div>
                                    </div>
                                    */}

                                    {/* Status Badge */}
                                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-lg border backdrop-blur-md ${getStatusStyles(status)}`}>
                                        {status.toUpperCase()}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                                        {item.titulo}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {((typeof item.categoria === 'object' ? item.categoria?.nombre : item.categoria) || item.categoria) && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 uppercase">
                                                {typeof item.categoria === 'object' ? item.categoria.nombre : item.categoria}
                                            </span>
                                        )}
                                        {item.keywords?.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 uppercase">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <span>Subtipo</span>
                                            </div>
                                            <span className="font-bold text-slate-700">{item.subtipo || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <span>Fecha Límite</span>
                                            </div>
                                            <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">{formatDate(item.fechaLimite)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.73 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.407-2.73-1M12 16v-1m-7-3h14" />
                                                    </svg>
                                                </div>
                                                <span>Financiación</span>
                                            </div>
                                            <span className="font-bold text-emerald-600">{item.financiacion}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto flex items-center gap-3">
                                        <button 
                                            onClick={() => navigate(`/convocatorias/detalles/${item.id}`)}
                                            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-[#3db4ed] transition-all shadow-xl shadow-slate-200 hover:shadow-sky-500/40 active:scale-95"
                                        >
                                            Ver Detalles
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (item.enlace) {
                                                    window.open(item.enlace, '_blank', 'noopener,noreferrer');
                                                }
                                            }}
                                            className="w-14 h-14 bg-orange-50 flex items-center justify-center rounded-2xl text-orange-600 hover:bg-orange-600 hover:text-white transition-all active:scale-90 border border-orange-100"
                                            title="Ir al enlace de la convocatoria"
                                        >
                                            <svg className="w-6 h-6 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-slate-400 font-medium italic text-lg">No hay convocatorias disponibles en este momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Convocatorias;
