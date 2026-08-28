import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMasterData } from '../../hooks/useMasterData';
import CatalogTable from './CatalogTable';
import CatalogModal from './CatalogModal';

/**
 * Full CRUD tab for one catalog.
 *
 * Props:
 *   catalog   { key, label, endpoint, hasSubtitulo }
 *   toastRef  ref to the shared <Toast /> instance
 */
const CatalogTab = ({ catalog, toastRef }) => {
    const { items, isLoading, error, refresh, createItem, updateItem } = useMasterData(catalog.endpoint);

    const [searchInput, setSearchInput]   = useState('');
    const [searchTerm, setSearchTerm]     = useState('');
    const [modalOpen, setModalOpen]       = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // null = create mode
    const [isSaving, setIsSaving]         = useState(false);

    const debounceRef = useRef(null);
    const hasFetchedRef = useRef(false);

    // -----------------------------------------------------------------
    // Lazy load: fetch once when this tab first mounts
    // -----------------------------------------------------------------
    useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            refresh();
        }
    }, [refresh]);

    // -----------------------------------------------------------------
    // Debounced search (300 ms)
    // -----------------------------------------------------------------
    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setSearchInput(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearchTerm(value);
        }, 300);
    }, []);

    // Clear debounce on unmount
    useEffect(() => () => clearTimeout(debounceRef.current), []);

    // -----------------------------------------------------------------
    // Modal handlers
    // -----------------------------------------------------------------
    const openCreate = () => {
        setSelectedItem(null);
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setModalOpen(true);
    };

    const closeModal = () => {
        if (!isSaving) {
            setModalOpen(false);
            setSelectedItem(null);
        }
    };

    const handleSave = async (payload) => {
        setIsSaving(true);
        try {
            if (selectedItem) {
                await updateItem(selectedItem.id, payload);
                toastRef.current?.show({ type: 'success', message: `"${payload.nombre}" actualizado correctamente.` });
            } else {
                await createItem(payload);
                toastRef.current?.show({ type: 'success', message: `"${payload.nombre}" creado correctamente.` });
            }
            closeModal();
        } catch (err) {
            toastRef.current?.show({ type: 'error', message: err.message || 'No se pudo guardar el registro.' });
        } finally {
            setIsSaving(false);
        }
    };

    // -----------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------
    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={handleSearchChange}
                        placeholder={`Buscar en ${catalog.label}...`}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800
                            border border-slate-200 dark:border-slate-700 rounded-xl
                            text-slate-800 dark:text-white placeholder:text-slate-400
                            focus:ring-2 focus:ring-red-400 focus:border-red-400
                            outline-none transition-colors"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label="Limpiar búsqueda"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Add button */}
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white
                        bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-colors
                        whitespace-nowrap flex-shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar
                </button>
            </div>

            {/* Table */}
            <CatalogTable
                items={items}
                isLoading={isLoading}
                error={error}
                searchTerm={searchTerm}
                hasSubtitulo={catalog.hasSubtitulo}
                onEdit={openEdit}
            />

            {/* Modal */}
            <CatalogModal
                isOpen={modalOpen}
                onClose={closeModal}
                onSave={handleSave}
                item={selectedItem}
                catalogLabel={catalog.label}
                hasSubtitulo={catalog.hasSubtitulo}
                isSaving={isSaving}
            />
        </div>
    );
};

export default CatalogTab;
