import { ShieldOff } from 'lucide-react';
import { PaginaDeEstado } from '@/components/layout/PaginaDeEstado';

const NoAutorizado = () => (
    <PaginaDeEstado
        codigo="Error 403 · Acceso restringido"
        icon={ShieldOff}
        titulo="No tienes acceso a esta sección"
        descripcion="Tu cuenta no tiene los permisos necesarios. Si crees que es un error, comunícate con la administración de la plataforma."
    />
);

export default NoAutorizado;
