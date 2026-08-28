import { FILTER_CONFIG } from './directoryConfig';

export const extractUniqueFilterOptions = (usuarios) => {
    const options = {};
    
    FILTER_CONFIG.forEach(filter => {
        if (filter.type === 'select') {
            options[filter.key] = [...new Set(
                usuarios.map(u => u[filter.key]).filter(Boolean)
            )].sort();
        } else if (filter.type === 'multi-select') {
            options[filter.key] = Array.from(
                new Set(usuarios.flatMap(u => u[filter.key] || []))
            ).filter(Boolean).sort();
        }
    });

    return options;
};

// Calculates a simple relevance score based on how many fields match search/filters
export const calculateRelevanceScore = (usuario, searchTerm, activeFilters) => {
    let score = 0;
    
    // Search match relevance
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (usuario.nombreCompleto.toLowerCase().includes(term)) score += 10;
        if (usuario.correoInstitucional.toLowerCase().includes(term)) score += 5;
    }

    // Filter match relevance (exact matches)
    Object.entries(activeFilters).forEach(([key, value]) => {
        if (!value) return;
        
        const userValue = usuario[key];
        if (Array.isArray(userValue)) {
            if (userValue.includes(value)) score += 5;
        } else {
            if (userValue === value) score += 5;
        }
    });

    // Baseline relevance based on profile completeness (mock completeness for this example: amount of data filled)
    score += (usuario.competenciasTecnicas?.length || 0) * 0.5;
    score += (usuario.sectoresExperiencia?.length || 0) * 0.5;

    return score;
};

export const filterUsersAdvanced = (usuarios, searchTerm, filters, sortBy = 'nombre') => {
    let filtered = usuarios.filter((usuario) => {
        // Base constraints: only those who authorized and want to be in the network, and not pending
        if (!usuario.autorizaDatos || !usuario.deseaVincularse || usuario.estadoFormulario === 'pendiente') {
            return false;
        }

        // Search text matching
        if (searchTerm) {
            const matchesSearch =
                usuario.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                usuario.correoInstitucional.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
        }

        // Dynamic config-driven filtering
        for (const [key, value] of Object.entries(filters)) {
            if (!value) continue; // Skip empty filters

            const filterConfig = FILTER_CONFIG.find(f => f.key === key);
            if (!filterConfig) continue;

            const userValue = usuario[key];

            if (filterConfig.type === 'multi-select' || Array.isArray(userValue)) {
                if (!userValue || !userValue.includes(value)) return false;
            } else {
                if (userValue !== value) return false;
            }
        }

        return true;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortBy === 'nombre') {
            return a.nombreCompleto.localeCompare(b.nombreCompleto);
        } else if (sortBy === 'relevancia') {
            const scoreA = calculateRelevanceScore(a, searchTerm, filters);
            const scoreB = calculateRelevanceScore(b, searchTerm, filters);
            return scoreB - scoreA; // Descending
        } else if (sortBy === 'experiencia') {
            const expA = (a.sectoresExperiencia?.length || 0) + (a.competenciasTecnicas?.length || 0);
            const expB = (b.sectoresExperiencia?.length || 0) + (b.competenciasTecnicas?.length || 0);
            return expB - expA;
        }
        return 0;
    });

    return filtered;
};
