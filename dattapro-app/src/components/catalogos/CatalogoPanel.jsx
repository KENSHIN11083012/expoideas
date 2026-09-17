import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownAZ, ArrowUpAZ, FolderOpen, Pencil, Plus, RotateCw, Search, SearchX } from 'lucide-react';
import { normalizarTexto } from '@/lib/utils';
import { useMasterData } from '@/hooks/useMasterData';
import * as masterDataService from '@/services/masterDataService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, EmptyState, Skeleton } from '@/components/ui/feedback';
import { CatalogoDialog } from './CatalogoDialog';

/** Facultades para el select de programas académicos. */
function useFacultades(activo) {
    const [facultades, setFacultades] = useState([]);

    useEffect(() => {
        if (!activo) return;
        let cancelado = false;
        masterDataService
            .getAll('facultades')
            .then((data) => { if (!cancelado) setFacultades(Array.isArray(data) ? data : []); })
            .catch(() => { if (!cancelado) toast.error('No se pudieron cargar las facultades'); });
        return () => { cancelado = true; };
    }, [activo]);

    return facultades;
}

/**
 * Contenido de una pestaña de Catálogos: búsqueda, orden, tabla y diálogo de
 * alta o edición.
 */
export function CatalogoPanel({ catalogo }) {
    const { items, isLoading, error, refresh, createItem, updateItem } = useMasterData(catalogo.endpoint);
    const facultades = useFacultades(catalogo.requiereFacultad);

    const [busqueda, setBusqueda] = useState('');
    const [ascendente, setAscendente] = useState(true);
    const [dialogo, setDialogo] = useState(null); // { item: null | registro }
    const busquedaDiferida = useDeferredValue(busqueda);

    const visibles = useMemo(() => {
        const termino = normalizarTexto(busquedaDiferida.trim());
        return items
            .filter((item) => !termino || normalizarTexto(`${item.nombre} ${item.facultad ?? ''}`).includes(termino))
            .sort((a, b) => (ascendente ? 1 : -1) * a.nombre.localeCompare(b.nombre, 'es'));
    }, [items, busquedaDiferida, ascendente]);

    const guardar = async (datos) => {
        if (dialogo.item) {
            await updateItem(dialogo.item.id, datos);
            toast.success(`"${datos.nombre}" se actualizó`);
        } else {
            await createItem(datos);
            toast.success(`"${datos.nombre}" se agregó`);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" aria-hidden="true" />
                    <Input
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder={`Buscar en ${catalogo.label.toLowerCase()}`}
                        aria-label={`Buscar en ${catalogo.label}`}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAscendente((v) => !v)} aria-label={ascendente ? 'Ordenar de Z a A' : 'Ordenar de A a Z'}>
                        {ascendente ? <ArrowDownAZ /> : <ArrowUpAZ />}
                        <span className="sm:hidden lg:inline">{ascendente ? 'A–Z' : 'Z–A'}</span>
                    </Button>
                    <Button onClick={() => setDialogo({ item: null })} className="flex-1 sm:flex-none">
                        <Plus /> Agregar
                    </Button>
                </div>
            </div>

            {error ? (
                <Alert variant="error" title={`No pudimos cargar ${catalogo.label.toLowerCase()}`}>
                    <p>{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
                        <RotateCw /> Reintentar
                    </Button>
                </Alert>
            ) : isLoading ? (
                <div className="flex flex-col gap-2" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded" />)}
                </div>
            ) : visibles.length === 0 ? (
                <EmptyState
                    icon={busqueda ? SearchX : FolderOpen}
                    title={busqueda ? 'Sin resultados' : 'Todavía no hay registros'}
                    description={busqueda ? `Nada coincide con "${busqueda}".` : `Agrega ${catalogo.articulo} para empezar.`}
                    action={!busqueda && (
                        <Button size="sm" onClick={() => setDialogo({ item: null })}>
                            <Plus /> Agregar
                        </Button>
                    )}
                />
            ) : (
                <Card className="overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-outline-variant/60 bg-surface-container-low">
                            <tr className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                                <th scope="col" className="w-20 px-5 py-3 font-medium">ID</th>
                                <th scope="col" className="px-5 py-3 font-medium">Nombre</th>
                                {catalogo.requiereFacultad && (
                                    <th scope="col" className="hidden px-5 py-3 font-medium sm:table-cell">Facultad</th>
                                )}
                                <th scope="col" className="w-16 px-5 py-3 font-medium"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/50">
                            {visibles.map((item) => (
                                <tr key={item.id} className="transition-colors hover:bg-surface-container-low/60">
                                    <td className="px-5 py-3">
                                        <Badge variant="outline" mono>{item.id}</Badge>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="font-medium text-on-surface">{item.nombre}</p>
                                        {catalogo.requiereFacultad && (
                                            <p className="text-xs text-on-surface-variant sm:hidden">{item.facultad}</p>
                                        )}
                                    </td>
                                    {catalogo.requiereFacultad && (
                                        <td className="hidden px-5 py-3 text-on-surface-variant sm:table-cell">{item.facultad}</td>
                                    )}
                                    <td className="px-5 py-2 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => setDialogo({ item })}
                                            aria-label={`Editar ${item.nombre}`}
                                        >
                                            <Pencil />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="border-t border-outline-variant/50 px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant" aria-live="polite">
                        {visibles.length === items.length
                            ? `${items.length} ${items.length === 1 ? 'registro' : 'registros'}`
                            : `${visibles.length} de ${items.length} registros`}
                    </p>
                </Card>
            )}

            {dialogo && (
                <CatalogoDialog
                    catalogo={catalogo}
                    item={dialogo.item}
                    facultades={facultades}
                    onGuardar={guardar}
                    onClose={() => setDialogo(null)}
                />
            )}
        </div>
    );
}
