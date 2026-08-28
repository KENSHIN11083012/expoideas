import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';
import { normalizeNetworkingData } from '../utils/dataNormalization';
import { extractUniqueFilterOptions } from '../utils/networkingHelpers';

export const useNetworkingData = () => {
    const [usuariosRaw, setUsuariosRaw] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const cleanToken = (localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');

                const response = await fetch(`${API_BASE_URL}/usuarios`, {
                    headers: {
                        'Authorization': 'Bearer ' + cleanToken
                    }
                });
                if (!response.ok) {
                    throw new Error('Error al obtener la lista de usuarios.');
                }
                const data = await response.json();
                
                // Normalization Layer
                const normalized = normalizeNetworkingData(data);
                setUsuariosRaw(normalized);
                
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsuarios();
    }, []);

    // Memoize filter options so they don't recalculate unless data changes
    const filterOptions = useMemo(() => extractUniqueFilterOptions(usuariosRaw), [usuariosRaw]);

    return {
        usuariosRaw,
        isLoading,
        error,
        filterOptions
    };
};
