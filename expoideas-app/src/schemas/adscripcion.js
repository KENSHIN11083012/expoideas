import { z } from 'zod';

/**
 * Campos de adscripción académica compartidos por registro, perfil y
 * administración. Los <select> entregan los ids como texto.
 */
export const adscripcionShape = {
    sedeId: z.string().min(1, 'Selecciona tu sede'),
    facultadId: z.string().min(1, 'Selecciona tu facultad'),
    programaAcademicoId: z.string(),
};

export const adscripcionSchema = z.object(adscripcionShape);

/** Valores del formulario a partir de un UsuarioResponseDTO. */
export const adscripcionDesdeUsuario = (usuario) => ({
    sedeId: usuario?.sedeId != null ? String(usuario.sedeId) : '',
    facultadId: usuario?.facultadId != null ? String(usuario.facultadId) : '',
    programaAcademicoId: usuario?.programaAcademicoId != null ? String(usuario.programaAcademicoId) : '',
});

/**
 * El 400 "El programa académico no pertenece a la facultad seleccionada" llega
 * como mensaje general; lo lleva al campo del programa. Devuelve true si aplicó.
 */
export const aplicarErrorDePrograma = (error, setError) => {
    if (error?.status !== 400 || !/programa/i.test(error.message ?? '')) return false;
    setError('programaAcademicoId', { type: 'server', message: error.message }, { shouldFocus: true });
    return true;
};

/** Cuerpo para la API: ids numéricos y programa vacío como null ("sin programa"). */
export const adscripcionParaApi = ({ sedeId, facultadId, programaAcademicoId }) => ({
    sedeId: Number(sedeId),
    facultadId: Number(facultadId),
    programaAcademicoId: programaAcademicoId ? Number(programaAcademicoId) : null,
});
