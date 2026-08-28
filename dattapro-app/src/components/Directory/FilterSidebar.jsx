import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { FILTER_CONFIG } from '../../utils/directoryConfig';
import { ChevronDown } from 'lucide-react';

const FilterSelect = ({ id, label, value, onChange, options, placeholder }) => (
    <div className="flex flex-col">
        <label htmlFor={id} className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
            {label}
        </label>
        <div className="relative">
            <select
                id={id}
                value={value}
                onChange={onChange}
                className="block w-full pl-4 pr-10 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 rounded-xl transition-all appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
                <option value="">{placeholder}</option>
                {options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="w-4 h-4" />
            </div>
        </div>
    </div>
);

const FilterSidebar = () => {
    const { 
        filterOptions, 
        filters, 
        setFilter, 
        clearFilters, 
        hasActiveFilters, 
        searchTerm, 
        setSearchTerm,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy
    } = useDirectory();

    return (
        <div className="mb-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            {/* Top row: Search and View Toggles */}
            <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1 block">
                        Buscar
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl py-2 transition-colors outline-none font-medium"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="w-48">
                        <FilterSelect
                            id="sort-select"
                            label="Ordenar Por"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            options={['nombre', 'relevancia', 'experiencia']}
                            placeholder="Seleccione..."
                        />
                    </div>

                    <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[42px] self-end">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-primary dark:bg-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            title="Vista de Cuadrícula"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-primary dark:bg-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            title="Vista de Tabla"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Filters Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {FILTER_CONFIG.map((filter) => (
                    <FilterSelect
                        key={filter.key}
                        id={`filter-${filter.key}`}
                        label={filter.label}
                        value={filters[filter.key] || ''}
                        onChange={(e) => setFilter(filter.key, e.target.value)}
                        options={filterOptions[filter.key] || []}
                        placeholder={`Todos...`}
                    />
                ))}
            </div>

            {/* Active filters indicator & clear */}
            {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center flex-wrap gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2">Activos:</span>
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value) return null;
                        const label = FILTER_CONFIG.find(f => f.key === key)?.label || key;
                        return (
                            <span key={key} className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
                                {label}: {value}
                                <button onClick={() => setFilter(key, '')} className="hover:text-red-500 ml-1 rounded-full focus:outline-none">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </span>
                        );
                    })}
                    {searchTerm && (
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                            Búsqueda: {searchTerm}
                            <button onClick={() => setSearchTerm('')} className="hover:text-red-500 ml-1 rounded-full focus:outline-none">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </span>
                    )}
                    <button
                        onClick={clearFilters}
                        className="ml-auto text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                        Limpiar todos ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export default FilterSidebar;
