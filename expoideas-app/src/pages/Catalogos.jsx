import { Building2, GraduationCap, Landmark, Shapes, Tags } from 'lucide-react';
import { PageContainer } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogoPanel } from '@/components/catalogos/CatalogoPanel';

/**
 * Catálogos maestros. Para agregar uno nuevo basta con sumarlo aquí (y su
 * endpoint en la API).
 */
const CATALOGOS = [
    { key: 'sedes', endpoint: 'sedes', label: 'Sedes', singular: 'sede', nuevo: 'Nueva sede', articulo: 'una sede', icon: Landmark },
    { key: 'facultades', endpoint: 'facultades', label: 'Facultades', singular: 'facultad', nuevo: 'Nueva facultad', articulo: 'una facultad', icon: Building2 },
    {
        key: 'programas',
        endpoint: 'programas-academicos',
        label: 'Programas académicos',
        singular: 'programa académico',
        nuevo: 'Nuevo programa académico',
        articulo: 'un programa académico',
        icon: GraduationCap,
        requiereFacultad: true,
    },
    { key: 'categorias', endpoint: 'categorias', label: 'Categorías', singular: 'categoría', nuevo: 'Nueva categoría', articulo: 'una categoría', icon: Shapes },
    { key: 'keywords', endpoint: 'keywords', label: 'Palabras clave', singular: 'palabra clave', nuevo: 'Nueva palabra clave', articulo: 'una palabra clave', icon: Tags },
];

const Catalogos = () => (
    <PageContainer>
        <PageHeader
            eyebrow="Administración"
            title="Catálogos"
            description="Datos de referencia que usan los formularios de la plataforma: estructura académica y clasificación de proyectos."
        />

        <Tabs defaultValue={CATALOGOS[0].key}>
            <TabsList aria-label="Catálogos">
                {CATALOGOS.map(({ key, label, icon: Icono }) => (
                    <TabsTrigger key={key} value={key}>
                        <Icono className="size-4" aria-hidden="true" />
                        {label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {CATALOGOS.map((catalogo) => (
                <TabsContent key={catalogo.key} value={catalogo.key}>
                    <CatalogoPanel catalogo={catalogo} />
                </TabsContent>
            ))}
        </Tabs>
    </PageContainer>
);

export default Catalogos;
