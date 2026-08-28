import React, { useState, useEffect } from 'react';

/**
 * Reusable create/edit modal for any master-data catalog.
 *
 * Props:
 *   isOpen        {boolean}         Whether the modal is visible
 *   onClose       {function}        Called to close the modal
 *   onSave        {function}        Called with payload object on submit
 *   item          {object|null}     null = create mode; object = edit mode
 *   catalogLabel  {string}          Human-readable catalog name (for title)
 *   hasSubtitulo  {boolean}         Whether to show the subtitulo field
 *   isSaving      {boolean}         Whether save is in progress (disables form)
 */
const CatalogModal = ({ isOpen, onClose, onSave, item, catalogLabel, hasSubtitulo, isSaving }) => {
    const isEditMode = item !== null && item !== undefined;

    const emptyForm = { nombre: '', subtitulo: '' };
    const [form, setForm]     = useState(emptyForm);
    const [errors, setErrors] = useState({});

    // Sync form with selected item whenever modal opens
    useEffect(() => {
        if (isOpen) {
            setForm({
                nombre:    item?.nombre    ?? '',
                subtitulo: item?.subtitulo ?? '',
            });
            setErrors({});
        }
    }, [isOpen, item]);

    if (!isOpen) return null;

    // -------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------
    const validate = () => {
        const errs = {};
        if (!form.nombre.trim() || form.nombre.trim().length < 2) {
            errs.nombre = 'El nombre es obligatorio y debe tener al menos 2 caracteres.';
        }
        if (hasSubtitulo && !form.subtitulo.trim()) {
            errs.subtitulo = 'El subtítulo es obligatorio para este catálogo.';
        }
        return errs;
    };

    // -------------------------------------------------------------------
    // Submit
    // -------------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        // Confirm before updating existing record
        if (isEditMode) {
            const confirmed = window.confirm(
                `¿Confirmas la actualización del registro "${item.nombre}"?`
            );
            if (!confirmed) return;
        }

        const payload = { nombre: form.nombre.trim() };
        if (hasSubtitulo) payload.subtitulo = form.subtitulo.trim();

        await onSave(payload);
    };

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    // -------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------
    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose(); }}
        >
            {/* Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md
                animate-[scaleIn_0.2s_ease-out]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-0.5">
                            {isEditMode ? 'Editar registro' : 'Nuevo registro'}
                        </p>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            {catalogLabel}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-40"
                        aria-label="Cerrar modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="px-6 py-5 space-y-5">

                        {/* Nombre */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="modal-nombre"
                                type="text"
                                value={form.nombre}
                                onChange={handleChange('nombre')}
                                disabled={isSaving}
                                placeholder="Ingresa el nombre..."
                                className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                                    placeholder:text-slate-400 transition-colors outline-none
                                    focus:ring-2 focus:ring-red-400 focus:border-red-400
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${errors.nombre
                                        ? 'border-red-400 dark:border-red-500'
                                        : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            />
                            {errors.nombre && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.nombre}</p>
                            )}
                        </div>

                        {/* Subtítulo — only for centros-investigativos */}
                        {hasSubtitulo && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Subtítulo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="modal-subtitulo"
                                    type="text"
                                    value={form.subtitulo}
                                    onChange={handleChange('subtitulo')}
                                    disabled={isSaving}
                                    placeholder="Ingresa el subtítulo..."
                                    className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                                        placeholder:text-slate-400 transition-colors outline-none
                                        focus:ring-2 focus:ring-red-400 focus:border-red-400
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${errors.subtitulo
                                            ? 'border-red-400 dark:border-red-500'
                                            : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                />
                                {errors.subtitulo && (
                                    <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.subtitulo}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300
                                bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
                                rounded-xl transition-colors disabled:opacity-40"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white
                                bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-colors
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving && (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            )}
                            {isSaving ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CatalogModal;
