import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FotoDePerfil } from './FotoDePerfil';
import { useAuth } from '@/hooks/useAuth';
import { del, put } from '@/services/apiClient';
import { TAMANO_MAXIMO_BYTES, urlDeArchivo } from '@/utils/archivos';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/services/apiClient', () => ({ put: vi.fn(), del: vi.fn() }));

const ID_FOTO = '0b0f3f7e-8c1a-4c55-9d3e-2f1a6b7c8d9e';

/** Perfil con estado real, como en la página: la foto nueva se refleja al instante. */
function ConPerfil({ inicial }) {
    const [perfil, setPerfil] = useState(inicial);
    return <FotoDePerfil perfil={perfil} onActualizado={setPerfil} />;
}

function renderFoto(perfil = { nombres: 'Ana', apellidos: 'Pérez', fotoId: null }) {
    const updateUser = vi.fn();
    useAuth.mockReturnValue({ updateUser });
    render(<ConPerfil inicial={perfil} />);
    return updateUser;
}

const imagen = (nombre, tipo, tamano = 1024) => new File([new Uint8Array(tamano)], nombre, { type: tipo });

describe('Foto de perfil', () => {
    it('sin foto muestra las iniciales y la opción de subir una', () => {
        renderFoto();

        expect(screen.getByText('AP')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Subir foto/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Quitar/ })).not.toBeInTheDocument();
    });

    it('sube la imagen como formulario multipart y la muestra', async () => {
        const user = userEvent.setup();
        put.mockResolvedValue({ nombres: 'Ana', apellidos: 'Pérez', fotoId: ID_FOTO });
        const updateUser = renderFoto();
        const foto = imagen('yo.png', 'image/png');

        await user.upload(screen.getByLabelText('Elegir foto de perfil'), foto);

        expect(put).toHaveBeenCalledWith('/usuarios/me/foto', expect.any(FormData));
        expect(put.mock.calls[0][1].get('archivo')).toBe(foto);
        expect(await screen.findByRole('img', { name: 'Ana Pérez' })).toHaveAttribute('src', urlDeArchivo(ID_FOTO));
        expect(updateUser).toHaveBeenCalledWith({ fotoId: ID_FOTO });
        expect(screen.getByRole('button', { name: /Cambiar foto/ })).toBeInTheDocument();
    });

    it('no sube formatos que la API va a rechazar', async () => {
        // Sin filtrar por "accept", para simular a quien elige "Todos los archivos".
        const user = userEvent.setup({ applyAccept: false });
        renderFoto();

        await user.upload(screen.getByLabelText('Elegir foto de perfil'), imagen('poster.pdf', 'application/pdf'));

        expect(screen.getByRole('alert')).toHaveTextContent('Formato no permitido. Usa un archivo JPG, PNG o WEBP.');
        expect(put).not.toHaveBeenCalled();
    });

    it('no sube imágenes de más de 5 MB', async () => {
        const user = userEvent.setup();
        renderFoto();

        await user.upload(screen.getByLabelText('Elegir foto de perfil'), imagen('grande.jpg', 'image/jpeg', TAMANO_MAXIMO_BYTES + 1));

        expect(screen.getByRole('alert')).toHaveTextContent('El archivo supera el tamaño máximo permitido de 5 MB');
        expect(put).not.toHaveBeenCalled();
    });

    it('muestra el motivo si la API rechaza el contenido', async () => {
        const user = userEvent.setup();
        put.mockRejectedValue(Object.assign(new Error('Datos inválidos'), {
            status: 400,
            body: { campos: { archivo: 'Formato no permitido. Usa un archivo JPG, PNG o WEBP.' } },
        }));
        renderFoto();

        // Un archivo que dice ser PNG pero no lo es: solo la API lo puede saber.
        await user.upload(screen.getByLabelText('Elegir foto de perfil'), imagen('falsa.png', 'image/png'));

        expect(await screen.findByRole('alert')).toHaveTextContent('Formato no permitido. Usa un archivo JPG, PNG o WEBP.');
    });

    it('quita la foto', async () => {
        const user = userEvent.setup();
        del.mockResolvedValue(null);
        const updateUser = renderFoto({ nombres: 'Ana', apellidos: 'Pérez', fotoId: ID_FOTO });

        await user.click(screen.getByRole('button', { name: /Quitar/ }));

        expect(del).toHaveBeenCalledWith('/usuarios/me/foto');
        expect(await screen.findByText('AP')).toBeInTheDocument();
        expect(updateUser).toHaveBeenCalledWith({ fotoId: null });
    });
});
