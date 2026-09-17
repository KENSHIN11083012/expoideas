import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MarcaExpoideas } from '@/components/brand/MarcaExpoideas';
import { LogosInstitucionales } from '@/components/brand/LogosInstitucionales';

/**
 * Pie de página institucional. Solo enlaces que existen: las secciones de
 * INNPRENDE I y II se agregan cuando existan sus pantallas.
 */
export function SiteFooter() {
    const { token } = useAuth();
    const anio = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-outline-variant/70 bg-surface-container-lowest">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
                <div className="flex flex-col gap-4">
                    <MarcaExpoideas size="sm" />
                    <p className="max-w-sm text-sm leading-relaxed text-on-surface-variant">
                        Los proyectos de la Cátedra UNISIMÓN INNPRENDE de la Universidad Simón Bolívar, con el
                        acompañamiento de MacondoLab.
                    </p>
                    <LogosInstitucionales size="sm" />
                </div>

                <nav className="flex flex-col gap-3" aria-label="Plataforma">
                    <h2 className="font-mono text-[11px] font-medium uppercase tracking-wider text-on-surface">Plataforma</h2>
                    <ul className="flex flex-col gap-2 text-sm text-on-surface-variant">
                        <li><Link className="hover:text-primary" to="/">Inicio</Link></li>
                        {token ? (
                            <>
                                <li><Link className="hover:text-primary" to="/perfil">Mi perfil</Link></li>
                                <li><Link className="hover:text-primary" to="/seguridad">Seguridad</Link></li>
                            </>
                        ) : (
                            <>
                                <li><Link className="hover:text-primary" to="/register">Crear cuenta</Link></li>
                                <li><Link className="hover:text-primary" to="/login">Iniciar sesión</Link></li>
                            </>
                        )}
                    </ul>
                </nav>

                <nav className="flex flex-col gap-3" aria-label="Institucional">
                    <h2 className="font-mono text-[11px] font-medium uppercase tracking-wider text-on-surface">Institucional</h2>
                    <ul className="flex flex-col gap-2 text-sm text-on-surface-variant">
                        <li>
                            <a
                                className="inline-flex items-center gap-1 hover:text-primary"
                                href="https://www.unisimon.edu.co"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Universidad Simón Bolívar <ArrowUpRight className="size-3.5" aria-hidden="true" />
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className="border-t border-outline-variant/60">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>© {anio} Universidad Simón Bolívar. Todos los derechos reservados.</p>
                    <p className="font-mono uppercase tracking-wider">Vigilada Mineducación · Barranquilla y Cúcuta</p>
                </div>
            </div>
        </footer>
    );
}
