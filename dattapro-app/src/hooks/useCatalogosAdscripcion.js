import { useEffect, useState } from 'react';
import * as masterDataService from '@/services/masterDataService';

/**
 * Sedes, facultades y programas para los campos de adscripción académica.
 * Son públicos en la API: el registro los necesita antes de haber sesión.
 */
export const useCatalogosAdscripcion = () => {
    const [estado, setEstado] = useState({ sedes: [], facultades: [], programas: [], isLoading: true, error: null });

    useEffect(() => {
        let cancelado = false;
        Promise.all([
            masterDataService.getAll('sedes'),
            masterDataService.getAll('facultades'),
            masterDataService.getAll('programas-academicos'),
        ])
            .then(([sedes, facultades, programas]) => {
                if (cancelado) return;
                const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es');
                setEstado({
                    sedes: [...sedes].sort(porNombre),
                    facultades: [...facultades].sort(porNombre),
                    programas: [...programas].sort(porNombre),
                    isLoading: false,
                    error: null,
                });
            })
            .catch((error) => {
                if (!cancelado) setEstado((prev) => ({ ...prev, isLoading: false, error: error.message }));
            });
        return () => { cancelado = true; };
    }, []);

    return estado;
};
