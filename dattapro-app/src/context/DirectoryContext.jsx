import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useNetworkingData } from '../hooks/useNetworkingData';
import { filterUsersAdvanced } from '../utils/networkingHelpers';
import { FILTER_CONFIG } from '../utils/directoryConfig';

const DirectoryContext = createContext();

export const DirectoryProvider = ({ children }) => {
    const { usuariosRaw, isLoading, error, filterOptions } = useNetworkingData();

    // Init state from LocalStorage or Defaults
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('dir_searchTerm') || '');
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('dir_viewMode') || 'grid');
    const [sortBy, setSortBy] = useState(() => localStorage.getItem('dir_sortBy') || 'nombre');
    
    // Initialize empty filter state
    const initialFilters = {};
    FILTER_CONFIG.forEach(f => initialFilters[f.key] = '');
    
    const [filters, setFilters] = useState(() => {
        const saved = localStorage.getItem('dir_filters');
        return saved ? JSON.parse(saved) : initialFilters;
    });

    // Favorites State (Frontend only per requirements)
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('dir_favorites');
        return saved ? JSON.parse(saved) : [];
    });

    // Persist to local storage when state changes
    useEffect(() => {
        localStorage.setItem('dir_searchTerm', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem('dir_viewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('dir_sortBy', sortBy);
    }, [sortBy]);

    useEffect(() => {
        localStorage.setItem('dir_filters', JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        localStorage.setItem('dir_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const setFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters(initialFilters);
        setSearchTerm('');
    };

    const toggleFavorite = (userId) => {
        setFavorites(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Memoized Filtered Results
    // Debounce can be handled at input level, but memo is critical here
    const filteredUsuarios = useMemo(() => {
        return filterUsersAdvanced(usuariosRaw, searchTerm, filters, sortBy);
    }, [usuariosRaw, searchTerm, filters, sortBy]);

    const hasActiveFilters = searchTerm !== '' || Object.values(filters).some(v => v !== '');

    const value = {
        usuariosRaw,
        filteredUsuarios,
        isLoading,
        error,
        filterOptions,
        searchTerm,
        setSearchTerm,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        filters,
        setFilter,
        clearFilters,
        hasActiveFilters,
        favorites,
        toggleFavorite
    };

    return (
        <DirectoryContext.Provider value={value}>
            {children}
        </DirectoryContext.Provider>
    );
};

export const useDirectory = () => useContext(DirectoryContext);
