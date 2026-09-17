import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Trash2 } from 'lucide-react';
import { del, put } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { TIPOS_IMAGEN, urlDeArchivo, validarImagen } from '@/utils/archivos';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

/**
 * Foto de perfil con acciones para cambiarla o quitarla. La imagen se valida
 * antes de subir (formato y 5 MB) y la API la vuelve a validar por su contenido.
 *
 * @param {object}   perfil        UsuarioResponseDTO actual
 * @param {Function} onActualizado recibe el perfil con la foto nueva (o sin foto)
 */
export function FotoDePerfil({ perfil, onActualizado }) {
    const { updateUser } = useAuth();
    const selector = useRef(null);
    const [ocupado, setOcupado] = useState(false);
    const [error, setError] = useState('');

    const subir = async (evento) => {
        const archivo = evento.target.files?.[0];
        // Permite volver a elegir el mismo archivo después de un error.
        evento.target.value = '';
        if (!archivo) return;

        const problema = validarImagen(archivo);
        if (problema) {
            setError(problema);
            return;
        }

        const formulario = new FormData();
        formulario.append('archivo', archivo);
        setError('');
        setOcupado(true);
        try {
            const actualizado = await put('/usuarios/me/foto', formulario);
            onActualizado(actualizado);
            updateUser({ fotoId: actualizado.fotoId });
            toast.success('Tu foto se actualizó');
        } catch (errorSubida) {
            setError(errorSubida.body?.campos?.archivo ?? errorSubida.message);
        } finally {
            setOcupado(false);
        }
    };

    const quitar = async () => {
        setError('');
        setOcupado(true);
        try {
            await del('/usuarios/me/foto');
            onActualizado({ ...perfil, fotoId: null });
            updateUser({ fotoId: null });
            toast.success('Quitaste tu foto');
        } catch (errorQuitar) {
            setError(errorQuitar.message);
        } finally {
            setOcupado(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <Avatar nombres={perfil.nombres} apellidos={perfil.apellidos} fotoUrl={urlDeArchivo(perfil.fotoId)} size="lg" />
            <input
                ref={selector}
                type="file"
                accept={TIPOS_IMAGEN.join(',')}
                onChange={subir}
                className="sr-only"
                aria-label="Elegir foto de perfil"
                tabIndex={-1}
            />
            <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" size="sm" loading={ocupado} onClick={() => selector.current?.click()}>
                    <Camera /> {perfil.fotoId ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {perfil.fotoId && (
                    <Button type="button" variant="ghost" size="sm" disabled={ocupado} onClick={quitar}>
                        <Trash2 /> Quitar
                    </Button>
                )}
            </div>
            {error ? (
                <p role="alert" className="max-w-56 text-xs font-medium text-error">{error}</p>
            ) : (
                <p className="text-xs text-on-surface-variant">JPG, PNG o WEBP de hasta 5 MB.</p>
            )}
        </div>
    );
}
