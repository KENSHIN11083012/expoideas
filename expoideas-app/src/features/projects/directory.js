import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, get } from '@/lib/apiClient';
import { session } from '@/lib/session';

/**
 * Listado de proyectos para la gestión y los docentes. Los filtros vacíos no se
 * envían: la API los trata como "sin filtrar".
 */
const query = (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value != null) params.set(key, value);
    });
    return params.toString();
};

export const useProjectDirectory = (filters) => {
    const search = query(filters);
    return useQuery({
        queryKey: ['project-directory', search],
        queryFn: () => get(`/projects${search ? `?${search}` : ''}`),
    });
};

/**
 * Descarga el listado en CSV con los filtros puestos. Va con fetch porque un
 * enlace no llevaría el token de la sesión.
 */
export const downloadProjectsCsv = async (filters) => {
    const search = query(filters);
    const response = await fetch(`${API_BASE_URL}/projects/export${search ? `?${search}` : ''}`, {
        headers: { Authorization: `Bearer ${session.token()}` },
    });
    if (!response.ok) {
        throw new Error('No pudimos generar el archivo.');
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = `proyectos-${new Date().toLocaleDateString('en-CA')}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};
