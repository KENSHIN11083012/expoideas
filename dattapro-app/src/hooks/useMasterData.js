import { useState, useCallback, useRef } from 'react';
import * as masterDataService from '../services/masterDataService';

/**
 * Reusable hook for any master-data catalog.
 *
 * Lazy: does NOT auto-fetch on mount. Call `refresh()` when the tab becomes active.
 * Caches items in memory so switching back to a tab avoids a redundant request.
 *
 * @param {string} endpoint  e.g. 'tipos-vinculacion'
 * @returns {{ items, isLoading, error, refresh, createItem, updateItem }}
 */
export const useMasterData = (endpoint) => {
    const [items, setItems]       = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]       = useState(null);

    // Track whether we have loaded at least once so callers can decide
    // whether to show a skeleton or an empty state.
    const hasFetchedRef = useRef(false);

    // -----------------------------------------------------------------
    // REFRESH — fetches current data for this endpoint
    // -----------------------------------------------------------------
    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await masterDataService.getAll(endpoint);
            setItems(Array.isArray(data) ? data : []);
            hasFetchedRef.current = true;
        } catch (err) {
            setError(err.message || 'Error desconocido.');
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    // -----------------------------------------------------------------
    // CREATE — POST then refresh
    // -----------------------------------------------------------------
    const createItem = useCallback(async (body) => {
        await masterDataService.create(endpoint, body);
        await refresh();
    }, [endpoint, refresh]);

    // -----------------------------------------------------------------
    // UPDATE — PUT then refresh
    // -----------------------------------------------------------------
    const updateItem = useCallback(async (id, body) => {
        await masterDataService.update(endpoint, id, body);
        await refresh();
    }, [endpoint, refresh]);

    return {
        items,
        isLoading,
        error,
        hasFetched: hasFetchedRef.current,
        refresh,
        createItem,
        updateItem,
    };
};
