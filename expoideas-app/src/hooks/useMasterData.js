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

    /** Lleva el resultado de una carga al estado, salvo que ya no esté vigente. */
    const aplicar = useCallback((carga, vigente = () => true) =>
        carga
            .then((data) => {
                if (!vigente()) return;
                setItems(Array.isArray(data) ? data : []);
                setError(null);
            })
            .catch((err) => vigente() && setError(err.message || 'Error desconocido.'))
            .finally(() => vigente() && setIsLoading(false)), []);

    useEffect(() => {
        let vigente = true;
        aplicar(masterDataService.getAll(endpoint), () => vigente);
        return () => {
            vigente = false;
        };
    }, [endpoint, aplicar]);

    const refresh = useCallback(() => {
        setIsLoading(true);
        return aplicar(masterDataService.getAll(endpoint));
    }, [endpoint, aplicar]);

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
