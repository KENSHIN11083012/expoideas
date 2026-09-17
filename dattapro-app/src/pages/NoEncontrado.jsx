import { Compass } from 'lucide-react';
import { PaginaDeEstado } from '@/components/layout/PaginaDeEstado';

const NoEncontrado = () => (
    <PaginaDeEstado
        codigo="Error 404 · Página no encontrada"
        icon={Compass}
        titulo="Esta página no existe"
        descripcion="Puede que el enlace esté mal escrito o que la página se haya movido."
    />
);

export default NoEncontrado;
