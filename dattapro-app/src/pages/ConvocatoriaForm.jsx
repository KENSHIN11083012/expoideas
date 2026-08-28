import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Info, Calendar, Link as LinkIcon, Image as ImageIcon, Briefcase, X, User, Mail, Layers, Tag, Cpu, Check, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ─── Componentes auxiliares definidos FUERA del padre para evitar re-montaje ───

const TagInput = ({ label, tags, setTags, placeholder, suggestions = [] }) => {
    const labelClasses = "block text-sm font-black text-slate-800 mb-2 ml-1 uppercase tracking-wider";
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = suggestions.filter(s =>
        s.toLowerCase().includes(input.toLowerCase()) && !(tags || []).includes(s)
    );

    const addTag = (e) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            const safeTags = tags || [];
            if (!safeTags.includes(input.trim())) {
                setTags([...safeTags, input.trim()]);
            }
            setInput('');
            setShowSuggestions(false);
        }
    };

    const addSuggestion = (suggestion) => {
        const safeTags = tags || [];
        if (!safeTags.includes(suggestion)) {
            setTags([...safeTags, suggestion]);
        }
        setInput('');
        setShowSuggestions(false);
    };

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2 relative">
            <label className={labelClasses}>{label}</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-[56px] focus-within:ring-2 focus-within:ring-[#3db4ed]/20 focus-within:border-[#3db4ed] transition-all">
                {(tags || []).map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-[#3db4ed] text-white rounded-full text-sm font-bold animate-in zoom-in-95">
                        {tag}
                        <button type="button" onClick={() => removeTag(i)} className="hover:bg-white/20 rounded-full p-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <div className="flex-1 relative min-w-[120px]">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onKeyDown={addTag}
                        placeholder={tags.length === 0 ? placeholder : "Presiona Enter para añadir..."}
                        className="w-full bg-transparent border-none outline-none text-slate-700 font-medium"
                    />
                    {showSuggestions && input.length > 0 && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 w-full max-w-xs bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                            {filteredSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => addSuggestion(suggestion)}
                                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#3db4ed] transition-colors border-b border-slate-100 last:border-0"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MultiSelect = ({ label, options, selectedIds, setSelectedIds }) => {
    const labelClasses = "block text-sm font-black text-slate-800 mb-2 ml-1 uppercase tracking-wider";
    const [searchTerm, setSearchTerm] = useState('');

    const toggleOption = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredOptions = options.filter(opt =>
        opt.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className={labelClasses}>{label}</label>
                <span className="text-[10px] font-black text-[#3db4ed] bg-[#3db4ed]/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    {selectedIds.length} seleccionados
                </span>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#3db4ed] transition-colors" />
                <input
                    type="text"
                    placeholder={`Buscar ${label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#3db4ed]/20 focus:border-[#3db4ed] transition-all"
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl custom-scrollbar">
                {filteredOptions.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleOption(opt.id)}
                        className={`flex items-center justify-between px-5 py-3 rounded-xl text-sm font-bold transition-all border text-left ${
                            selectedIds.includes(opt.id)
                                ? 'bg-[#3db4ed] text-white border-[#3db4ed]'
                                : 'bg-white text-slate-600 border-slate-100 hover:border-[#3db4ed]/30 shadow-sm'
                        }`}
                    >
                        <span>{opt.nombre}</span>
                        {selectedIds.includes(opt.id) && <Check className="w-5 h-5 shrink-0 ml-3" />}
                    </button>
                ))}
                {filteredOptions.length === 0 && (
                    <div className="p-8 text-center space-y-2">
                        <p className="text-slate-400 text-xs italic">No se encontraron resultados para "{searchTerm}"</p>
                    </div>
                )}
                {options.length === 0 && <p className="text-slate-400 text-xs italic p-2 text-center">Cargando opciones...</p>}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const ConvocatoriaForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        titulo: '',
        subtipo: '',
        categoriaId: '',
        entidadId: '',
        descripcion: '',
        criteriosParticipacion: '',
        procesoEvaluacion: '',
        resultadosEsperados: '',
        financiacion: '',
        fechaInicio: '',
        fechaLimite: '',
        imagenFondo: '',
        enlace: '',
        visible: true,
        contactoNombre: '',
        contactoCorreo: '',
        contactoDependencia: '',
        areasIds: [],
        areasEspecialidadIds: [],
        sectoresIds: [],
        serviciosIds: [],
        tiposProyectoIds: [],
        competenciasTecnicasIds: [],
        competenciasTransversalesIds: [],
        keywords: [],
        lineasInvestigacion: []
    });

    const [catalogos, setCatalogos] = useState({
        categorias: [],
        entidades: [],
        areas: [],
        areasEspecialidad: [],
        sectores: [],
        servicios: [],
        tiposProyecto: [],
        competenciasTecnicas: [],
        competenciasTransversales: [],
        keywords: []
    });

    const [usuarioId, setUsuarioId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserProfile();
        fetchCatalogos();
        if (isEdit) {
            fetchConvocatoria();
        }
    }, [isEdit, id]);

    // Debug logger
    useEffect(() => {
        console.log('DEBUG: Current formData state:', formData);
    }, [formData]);

    const fetchCatalogos = async () => {
        const endpoints = {
            categorias: 'categorias',
            entidades: 'entidades',
            areas: 'areas-conocimiento',
            areasEspecialidad: 'areas-especialidad',
            sectores: 'sectores-experiencia',
            servicios: 'tipos-servicios',
            tiposProyecto: 'tipos-proyecto',
            competenciasTecnicas: 'competencias-tecnicas',
            competenciasTransversales: 'competencias-transversales',
            keywords: 'keywords'
        };

        try {
            const results = await Promise.all(
                Object.entries(endpoints).map(async ([key, path]) => {
                    const res = await fetch(`${API_BASE_URL}/${path}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) return [key, []];
                    const data = await res.json();
                    return [key, data];
                })
            );
            setCatalogos(Object.fromEntries(results));
        } catch (err) {
            console.error('Error loading catalogs:', err);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/usuarios/perfil/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('No se pudo obtener el perfil del usuario');
            const data = await response.json();
            if (data.id) {
                setUsuarioId(data.id);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            // No redirigimos inmediatamente para dar oportunidad de cargar si hay un token válido
        }
    };

    const fetchConvocatoria = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/convocatorias/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Error al cargar la convocatoria');
            const data = await response.json();
            setFormData({
                titulo: data.titulo || '',
                subtipo: data.subtipo || '',
                categoriaId: data.categoriaId || '',
                entidadId: data.entidadId || '',
                descripcion: data.descripcion || '',
                criteriosParticipacion: data.criteriosParticipacion || '',
                procesoEvaluacion: data.procesoEvaluacion || '',
                resultadosEsperados: data.resultadosEsperados || '',
                financiacion: data.financiacion || '',
                fechaInicio: data.fechaInicio || '',
                fechaLimite: data.fechaLimite || '',
                imagenFondo: data.imagenFondo || '',
                enlace: data.enlace || '',
                visible: data.visible ?? true,
                contactoNombre: data.contactoNombre || '',
                contactoCorreo: data.contactoCorreo || '',
                contactoDependencia: data.contactoDependencia || '',
                areasIds: data.areasIds || data.areas?.map(a => a.id) || [],
                areasEspecialidadIds: data.areasEspecialidadIds || data.areasEspecialidad?.map(a => a.id) || [],
                sectoresIds: data.sectoresIds || data.sectores?.map(s => s.id) || [],
                serviciosIds: data.serviciosIds || data.servicios?.map(s => s.id) || [],
                tiposProyectoIds: data.tiposProyectoIds || data.tiposProyecto?.map(t => t.id) || [],
                competenciasTecnicasIds: data.competenciasTecnicasIds || data.competenciasTecnicas?.map(c => c.id) || [],
                competenciasTransversalesIds: data.competenciasTransversalesIds || data.competenciasTransversales?.map(c => c.id) || [],
                keywords: data.keywords || [],
                lineasInvestigacion: data.lineasInvestigacion || []
            });
        } catch (err) {
            setError('No se pudo cargar la información para editar');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const currentUserId = usuarioId || user?.id || localStorage.getItem('userId');

        if (!currentUserId || currentUserId === 'undefined' || currentUserId === 'null') {
            setError('Error de sesión: No se pudo identificar al usuario. Por favor, intenta cerrar sesión e ingresar nuevamente.');
            setIsSubmitting(false);
            return;
        }

        const payload = {
            ...formData,
            usuarioId: currentUserId,
            categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null,
            entidadId: formData.entidadId ? parseInt(formData.entidadId) : null,
            // Asegurar que las listas siempre vayan como arrays
            keywords: Array.isArray(formData.keywords) ? formData.keywords : [],
            lineasInvestigacion: Array.isArray(formData.lineasInvestigacion) ? formData.lineasInvestigacion : []
        };

        console.log('DEBUG: Enviando payload FINAL:', payload);

        try {
            const url = isEdit ? `${API_BASE_URL}/convocatorias/${id}` : `${API_BASE_URL}/convocatorias`;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar la convocatoria');
            }

            alert(isEdit ? 'Convocatoria actualizada con éxito' : 'Convocatoria publicada con éxito');
            navigate('/mis-convocatorias');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = "w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#3db4ed]/10 focus:border-[#3db4ed] transition-all text-slate-700 font-medium placeholder:text-slate-400 disabled:opacity-50";
    const labelClasses = "block text-sm font-black text-slate-800 mb-2 ml-1 uppercase tracking-wider";

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => navigate('/mis-convocatorias')}
                className="flex items-center gap-2 text-slate-500 hover:text-[#3db4ed] transition-colors font-bold group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Volver a Mis Convocatorias
            </button>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {isEdit ? 'Editar Convocatoria' : 'Crear Nueva Convocatoria'}
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Completa los campos para publicar tu oportunidad.</p>
                    </div>
                    <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                        <Briefcase className="w-8 h-8 text-[#3db4ed]" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <input type="hidden" name="usuarioId" value={usuarioId || ''} />

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-3">
                            <X className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Sección: Información General */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-[#3db4ed]">
                            <Info className="w-5 h-5" />
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Información General</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Título de la Convocatoria *</label>
                                <input
                                    type="text"
                                    name="titulo"
                                    required
                                    className={inputClasses}
                                    placeholder="Ej: Convocatoria Nacional de Innovación 2024"
                                    value={formData.titulo}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Categoría *</label>
                                <select
                                    name="categoriaId"
                                    required
                                    className={inputClasses}
                                    value={formData.categoriaId}
                                    onChange={handleChange}
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {catalogos.categorias.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>Subtipo</label>
                                <input
                                    type="text"
                                    name="subtipo"
                                    className={inputClasses}
                                    placeholder="Ej: Beca, Crédito, etc."
                                    value={formData.subtipo}
                                    onChange={handleChange}
                                />
                            </div>

                                <div>
                                    <label className={labelClasses}>Financiación *</label>
                                    <input
                                        type="text"
                                        name="financiacion"
                                        required
                                        className={inputClasses}
                                        placeholder="Ej: $200.000.000 o Financiación externa"
                                        value={formData.financiacion}
                                        onChange={handleChange}
                                    />
                                </div>

                            <TagInput
                                label="Palabras Clave (Keywords)"
                                tags={formData.keywords}
                                setTags={(tags) => setFormData(prev => ({ ...prev, keywords: tags }))}
                                placeholder="Ej: Innovación, Rural, Salud"
                                suggestions={catalogos.keywords.map(k => k.nombre)}
                            />

                            {/* Oculto por ahora
                            <div className="md:col-span-2">
                                <TagInput
                                    label="Líneas de Investigación"
                                    tags={formData.lineasInvestigacion}
                                    setTags={(tags) => setFormData(prev => ({ ...prev, lineasInvestigacion: tags }))}
                                    placeholder="Ej: Biotecnología, IA"
                                />
                            </div>
                            */}

                            {/* Campo Entidad oculto por ahora */}
                            {/* 
                            <div>
                                <label className={labelClasses}>Entidad *</label>
                                <select
                                    name="entidadId"
                                    required
                                    className={inputClasses}
                                    value={formData.entidadId}
                                    onChange={handleChange}
                                >
                                    <option value="">Seleccionar entidad</option>
                                    {catalogos.entidades.map(ent => (
                                        <option key={ent.id} value={ent.id}>{ent.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            */}
                        </div>
                    </div>

                    {/* Sección: Información de Contacto */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-emerald-500">
                            <User className="w-5 h-5" />
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Información de Contacto</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClasses}>Nombre de Contacto</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="contactoNombre"
                                        className={`${inputClasses} pl-14`}
                                        placeholder="Nombre completo"
                                        value={formData.contactoNombre}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Correo de Contacto</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="contactoCorreo"
                                        className={`${inputClasses} pl-14`}
                                        placeholder="ejemplo@correo.com"
                                        value={formData.contactoCorreo}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Dependencia</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="contactoDependencia"
                                        className={`${inputClasses} pl-14`}
                                        placeholder="Ej: Facultad de Ingeniería"
                                        value={formData.contactoDependencia}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Fechas y Enlaces */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-orange-500">
                            <Calendar className="w-5 h-5" />
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Fechas y Enlaces</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClasses}>Fecha de Inicio</label>
                                <input
                                    type="date"
                                    name="fechaInicio"
                                    className={inputClasses}
                                    value={formData.fechaInicio}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Fecha Límite *</label>
                                <input
                                    type="date"
                                    name="fechaLimite"
                                    required
                                    className={inputClasses}
                                    value={formData.fechaLimite}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Enlace de la Convocatoria *</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="url"
                                        name="enlace"
                                        required
                                        className={`${inputClasses} pl-14`}
                                        placeholder="https://..."
                                        value={formData.enlace}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Imagen de Fondo (Opcional)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="url"
                                        name="imagenFondo"
                                        className={`${inputClasses} pl-14`}
                                        placeholder="URL de la imagen"
                                        value={formData.imagenFondo}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Detalles */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-indigo-500">
                            <Layers className="w-5 h-5" />
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Detalles y Requisitos</h2>
                        </div>

                        <div>
                            <label className={labelClasses}>Descripción (Opcional)</label>
                            <textarea
                                name="descripcion"
                                rows="4"
                                className={`${inputClasses} resize-none`}
                                placeholder="Describe el propósito de la convocatoria..."
                                value={formData.descripcion}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClasses}>Criterios de Participación *</label>
                                <textarea
                                    name="criteriosParticipacion"
                                    required
                                    rows="4"
                                    className={`${inputClasses} resize-none`}
                                    placeholder="¿Quiénes pueden aplicar?"
                                    value={formData.criteriosParticipacion}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Proceso de Evaluación</label>
                                <textarea
                                    name="procesoEvaluacion"
                                    rows="4"
                                    className={`${inputClasses} resize-none`}
                                    placeholder="Describe cómo se evaluarán las propuestas..."
                                    value={formData.procesoEvaluacion}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Resultados Esperados</label>
                            <textarea
                                name="resultadosEsperados"
                                rows="4"
                                className={`${inputClasses} resize-none`}
                                placeholder="¿Qué se espera obtener con esta convocatoria?"
                                value={formData.resultadosEsperados}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Sección: Áreas y Sectores (M:M) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-purple-500">
                            <Cpu className="w-5 h-5" />
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Categorización y Perfiles</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <MultiSelect
                                label="Áreas de Conocimiento"
                                options={catalogos.areas}
                                selectedIds={formData.areasIds}
                                setSelectedIds={(ids) => setFormData(prev => ({ ...prev, areasIds: ids }))}
                            />
                            <MultiSelect
                                label="Áreas de Especialidad"
                                options={catalogos.areasEspecialidad}
                                selectedIds={formData.areasEspecialidadIds}
                                setSelectedIds={(ids) => setFormData(prev => ({ ...prev, areasEspecialidadIds: ids }))}
                            />
                            <MultiSelect
                                label="Sectores de Experiencia"
                                options={catalogos.sectores}
                                selectedIds={formData.sectoresIds}
                                setSelectedIds={(ids) => setFormData(prev => ({ ...prev, sectoresIds: ids }))}
                            />
                            <MultiSelect
                                label="Tipos de Servicios"
                                options={catalogos.servicios}
                                selectedIds={formData.serviciosIds}
                                setSelectedIds={(ids) => setFormData(prev => ({ ...prev, serviciosIds: ids }))}
                            />
                            <MultiSelect
                                label="Tipos de Proyecto"
                                options={catalogos.tiposProyecto}
                                selectedIds={formData.tiposProyectoIds}
                                setSelectedIds={(ids) => setFormData(prev => ({ ...prev, tiposProyectoIds: ids }))}
                            />
                            <MultiSelect
                                label="Competencias Técnicas"
                                options={catalogos.competenciasTecnicas}
                                selectedIds={formData.competenciasTecnicasIds}
                                setSelectedIds={(ids) => setFormData(prev => ({ ...prev, competenciasTecnicasIds: ids }))}
                            />
                            <MultiSelect
                                label="Competencias Transversales"
                                options={catalogos.competenciasTransversales}
                                selectedIds={formData.competenciasTransversalesIds}
                                setSelectedIds={(ids) => setFormData(prev => ({ ...prev, competenciasTransversalesIds: ids }))}
                            />

                        </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/mis-convocatorias')}
                            className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-[24px] font-black text-lg hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] bg-slate-900 text-white py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-slate-300 hover:bg-[#3db4ed] transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 disabled:bg-slate-400 disabled:translate-y-0"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Save className="w-6 h-6" />
                            )}
                            {isEdit ? 'Actualizar Convocatoria' : 'Publicar Convocatoria'}
                        </button>
                    </div>

                    {/* Debug Section (Only visible in development) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-10 p-6 bg-slate-900 rounded-3xl text-[10px] font-mono text-emerald-400 overflow-auto max-h-60 border border-emerald-500/20 shadow-2xl">
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs border-b border-emerald-500/30 pb-2">Debug State Monitor</h3>
                            <pre>{JSON.stringify({
                                keywords: formData.keywords,
                                lineasInvestigacion: formData.lineasInvestigacion,
                                areasIds: formData.areasIds,
                                isEdit: isEdit,
                                usuarioId: usuarioId
                            }, null, 2)}</pre>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ConvocatoriaForm;
