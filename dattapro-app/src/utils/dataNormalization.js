export const normalizeNetworkingData = (usuarios) => {
    if (!Array.isArray(usuarios)) return [];

    return usuarios.map(usuario => {
        // Safe extractions
        const nombres = usuario.nombres || '';
        const apellidos = usuario.apellidos || '';
        const nombreCompleto = `${nombres} ${apellidos}`.trim();
        
        // Booleans can come as strings or have different casing
        const autorizaDatos = usuario.autorizaDatos === true || usuario.autorizadatos === true;
        const deseaVincularse = usuario.deseaVincularse === true || usuario.deseavincularse === true;
        
        // Normalize Arrays
        const normalizeArray = (arr, keyToExtract = 'nombre') => {
            if (!arr || !Array.isArray(arr)) return [];
            return arr.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return item[keyToExtract] || '';
                }
                return item || '';
            }).filter(Boolean);
        };

        const sectoresExperiencia = normalizeArray(usuario.sectoresExperiencia);
        const competenciasTecnicas = normalizeArray(usuario.competenciasTecnicas);
        const competenciasTransversales = normalizeArray(usuario.competenciasTransversales);
        const idiomas = normalizeArray(usuario.idiomas, 'idioma');

        return {
            ...usuario,
            nombres,
            apellidos,
            nombreCompleto,
            autorizaDatos,
            deseaVincularse,
            sectoresExperiencia,
            competenciasTecnicas,
            competenciasTransversales,
            idiomas,
            // Provide fallbacks for UI
            programaAcademico: usuario.programaAcademico || '',
            correoInstitucional: usuario.correoInstitucional || '',
            foto: usuario.foto || null,
            id: usuario.id || usuario.correoInstitucional, // Ensure unique ID
            estadoFormulario: usuario.estadoFormulario || '',
            rol: usuario.rol || 'profesor',
            facultad: usuario.facultad || '',
            ciudad: usuario.ciudad || ''
        };
    });
};
