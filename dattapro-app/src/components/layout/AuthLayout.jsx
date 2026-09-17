import { Link } from 'react-router-dom';
import { MarcaExpoideas } from '@/components/brand/MarcaExpoideas';
import { LogosInstitucionales } from '@/components/brand/LogosInstitucionales';
import fotoLogin from '@/assets/brand/login-hero.webp';

/**
 * Pantallas de acceso (login y registro) a dos columnas: formulario a la
 * izquierda y panel institucional a la derecha. Por debajo de lg el panel se
 * oculta y los logos pasan al pie del formulario.
 *
 * @param {string} titulo       título de la pestaña del navegador
 * @param {string} panelTitulo  mensaje grande del panel
 * @param {string} panelTexto
 */
export function AuthLayout({ titulo, panelTitulo, panelTexto, children }) {
    return (
        <div className="grid min-h-dvh bg-surface-container-lowest lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <title>{`${titulo} · Expoideas`}</title>

            <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16 xl:px-24">
                <Link to="/" className="self-start rounded" aria-label="Expoideas, ir al inicio">
                    <MarcaExpoideas />
                </Link>

                <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</main>

                <footer className="flex flex-col items-center gap-4 text-center text-xs text-on-surface-variant">
                    <LogosInstitucionales size="sm" className="lg:hidden" />
                    <p>© {new Date().getFullYear()} Universidad Simón Bolívar · Vigilada Mineducación</p>
                </footer>
            </div>

            <aside className="relative hidden overflow-hidden bg-primary lg:block" aria-label="Expoideas">
                <div className="tech-grid-claro absolute inset-0" aria-hidden="true" />
                <div
                    className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-secondary-container/25 blur-3xl"
                    aria-hidden="true"
                />
                <div className="relative flex h-full flex-col justify-between gap-10 p-10 xl:p-14">
                    <div className="flex flex-col gap-5">
                        <span className="self-start rounded-xl border border-secondary-container/60 bg-secondary-container px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-on-secondary-fixed">
                            Universidad Simón Bolívar
                        </span>
                        <h2 className="max-w-lg font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-on-primary xl:text-5xl">
                            {panelTitulo}
                        </h2>
                        <p className="max-w-md text-base leading-relaxed text-on-primary-container">{panelTexto}</p>
                    </div>

                    <figure className="relative overflow-hidden rounded-lg border border-on-primary/15 shadow-hard-neutral">
                        <img
                            src={fotoLogin}
                            alt="Estudiantes de la Universidad Simón Bolívar en un evento de emprendimiento"
                            className="aspect-[16/10] w-full object-cover"
                        />
                        <figcaption className="absolute inset-x-4 bottom-4">
                            <LogosInstitucionales size="sm" className="bg-surface-container-lowest px-4 py-2.5 shadow-lg" />
                        </figcaption>
                    </figure>
                </div>
            </aside>
        </div>
    );
}
