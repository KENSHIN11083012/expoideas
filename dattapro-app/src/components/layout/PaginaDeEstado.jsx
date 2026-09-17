import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Página de estado (sin permiso, no encontrada): código técnico, mensaje y
 * vuelta al inicio.
 */
export function PaginaDeEstado({ codigo, icon: Icono, titulo, descripcion }) {
    return (
        <section className="tech-grid flex min-h-[70vh] items-center justify-center px-4 py-16">
            <title>{`${titulo} · Expoideas`}</title>
            <div className="flex max-w-md flex-col items-center gap-5 text-center">
                <span className="flex size-16 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-primary shadow-hard">
                    <Icono className="size-8" aria-hidden="true" />
                </span>
                <p className="font-mono text-xs font-medium uppercase tracking-widest text-on-surface-variant">{codigo}</p>
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{titulo}</h1>
                <p className="text-on-surface-variant">{descripcion}</p>
                <Button asChild size="lg" className="mt-2">
                    <Link to="/"><ArrowLeft /> Volver al inicio</Link>
                </Button>
            </div>
        </section>
    );
}
