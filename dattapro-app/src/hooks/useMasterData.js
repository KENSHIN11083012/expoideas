import { useState, useCallback, useEffect } from 'react';
import * as masterDataService from '@/services/masterDataService';

/**
 * Registros de un catálogo maestro. Carga al montarse: cada pestaña de
 * Catálogos se monta solo cuando está activa.
 *
 * @param {string} endpoint p. ej. 'sedes'
 */
export const useMasterData = (endpoint) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await masterDataService.getAll(endpoint);
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Error desconocido.');
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    /** Lanza el error para que el formulario lo muestre. */
    const createItem = useCallback(async (body) => {
        await masterDataService.create(endpoint, body);
        await refresh();
    }, [endpoint, refresh]);

    const updateItem = useCallback(async (id, body) => {
        await masterDataService.update(endpoint, id, body);
        await refresh();
    }, [endpoint, refresh]);

    return { items, isLoading, error, refresh, createItem, updateItem };
};
