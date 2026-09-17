import { Link } from 'react-router-dom';
import {
    ArrowRight,
    CircleCheck,
    GraduationCap,
    Handshake,
    Lightbulb,
    Rocket,
    Scale,
    UserRound,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DOMINIO_INSTITUCIONAL } from '@/utils/validaciones';
import { LogosInstitucionales } from '@/components/brand/LogosInstitucionales';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import fotoPortada from '@/assets/brand/login-hero.webp';

/*
 * Portada pública. Contenido estático: la galería, los rankings y las cifras de
 * los diseños llegan con las fases del dominio, cuando haya datos reales.
 */

// Cada fase tiene su propia inscripción: un proyecto no pasa solo de una a otra.
const FASES = [
    {
        fase: 'INNPRENDE I',
        nombre: 'Investigación',
        acento: 'primary',
        icon: Lightbulb,
        titulo: 'Esboza tu idea de emprendimiento',
        texto: 'Durante el semestre el equipo investiga hasta llegar a su idea de negocio y la presenta en un póster de investigación.',
        puntos: ['Inscripción del proyecto con tu equipo', 'Entrega del póster de investigación', 'Evaluación por jurados y ranking'],
    },
    {
        fase: 'INNPRENDE II',
        nombre: 'Prototipado',
        acento: 'lima',
        icon: Rocket,
        titulo: 'Convierte la idea en un prototipo',
        texto: 'La idea se vuelve una versión mínima del producto, se valida y se presenta en un pitch comercial ante jurados externos.',
        puntos: ['Prototipo y evidencias de validación', 'Pitch comercial ante jurados externos', 'Evaluación, comentarios y ranking'],
    },
];

const PERFILES = [
    { icon: UserRound, titulo: 'Estudiantes', texto: 'Inscriben sus proyectos, suben sus entregables y consultan su evaluación.' },
    { icon: GraduationCap, titulo: 'Docentes', texto: 'Acompañan a sus grupos y siguen sus resultados.' },
    { icon: Scale, titulo: 'Jurados', texto: 'Evalúan los proyectos que tienen asignados con criterios comunes.' },
    { icon: Handshake, titulo: 'MacondoLab', texto: 'Coordina las fases, valida a los jurados y publica los resultados.' },
];

function Etiqueta({ children }) {
    return (
        <Badge variant="primary" mono className="self-start whitespace-normal">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {children}
        </Badge>
    );
}

function AccionesPrincipales({ autenticado, esGestion }) {
    if (autenticado) {
        return (
            <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                    <Link to="/perfil">Ir a mi perfil <ArrowRight /></Link>
                </Button>
                {esGestion && (
                    <Button asChild size="lg" variant="outline">
                        <Link to="/admin/usuarios">Administración</Link>
                    </Button>
                )}
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                    <Link to="/register">Crear cuenta <ArrowRight /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link to="/login">Iniciar sesión</Link>
                </Button>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Acceso con correo {DOMINIO_INSTITUCIONAL}
            </p>
        </div>
    );
}

const Inicio = () => {
    const { token, esGestion } = useAuth();
    const autenticado = Boolean(token);

    return (
        <>
            <title>Expoideas · Universidad Simón Bolívar</title>

            {/* Portada */}
            <section className="relative overflow-hidden border-b border-outline-variant/60 bg-surface-container-lowest">
                <div className="tech-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
                <div className="absolute -right-40 -top-40 size-[32rem] rounded-full bg-secondary-container/30 blur-3xl" aria-hidden="true" />

                <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:py-24">
                    <div className="flex min-w-0 flex-col gap-6">
                        <Etiqueta>Universidad Simón Bolívar · Barranquilla y Cúcuta</Etiqueta>
                        <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-on-surface sm:text-5xl xl:text-6xl">
                            Las ideas de la Unisimón,{' '}
                            <span className="text-primary underline decoration-secondary-container decoration-[6px] underline-offset-[6px]">
                                a la vista de todos
                            </span>
                        </h1>
                        <p className="max-w-xl text-lg leading-relaxed text-on-surface-variant">
                            Expoideas reúne los proyectos de la Cátedra INNPRENDE: los equipos los inscriben con sus
                            entregables, los jurados los evalúan y los resultados quedan a la vista de la comunidad.
                        </p>
                        <AccionesPrincipales autenticado={autenticado} esGestion={esGestion()} />
                    </div>

                    <figure className="relative">
                        <div className="overflow-hidden rounded-lg border border-outline-variant/70 shadow-hard">
                            <img
                                src={fotoPortada}
                                alt="Estudiantes de la Universidad Simón Bolívar en un evento de emprendimiento"
                                className="aspect-[4/3] w-full object-cover"
                                fetchPriority="high"
                            />
                        </div>
                        <figcaption className="glass absolute -bottom-6 left-4 right-4 flex flex-col gap-3 rounded-lg border border-outline-variant/70 p-4 shadow-lg sm:left-auto sm:right-6 sm:w-80">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Con el respaldo de</p>
                            <LogosInstitucionales size="sm" />
                        </figcaption>
                    </figure>
                </div>
            </section>

            {/* Ruta en dos fases */}
            <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="ruta-titulo">
                <div className="flex max-w-2xl flex-col gap-3">
                    <Etiqueta>Cátedra UNISIMÓN INNPRENDE</Etiqueta>
                    <h2 id="ruta-titulo" className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                        De la investigación al prototipo, en dos fases
                    </h2>
                    <p className="text-on-surface-variant">
                        Cada fase tiene su propia inscripción y su propia evaluación por jurados. Los proyectos, sus
                        entregables y sus resultados quedan guardados como evidencia del proceso.
                    </p>
                </div>

                <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
                    {FASES.map(({ fase, nombre, acento, icon: Icono, titulo, texto, puntos }, indice) => (
                        <FaseCard
                            key={fase}
                            {...{ fase, nombre, acento, Icono, titulo, texto, puntos }}
                            conector={indice === 0}
                        />
                    ))}
                </div>
            </section>

            {/* Para quién */}
            <section className="border-y border-outline-variant/60 bg-surface-container-low" aria-labelledby="perfiles-titulo">
                <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8">
                    <div className="flex max-w-2xl flex-col gap-3">
                        <Etiqueta>Comunidad</Etiqueta>
                        <h2 id="perfiles-titulo" className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                            Un espacio para todo el ecosistema
                        </h2>
                    </div>
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {PERFILES.map(({ icon: Icono, titulo, texto }) => (
                            <li key={titulo}>
                                <Card className="flex h-full flex-col gap-4 p-6 transition-shadow hover:shadow-hard-sm">
                                    <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icono className="size-5" aria-hidden="true" />
                                    </span>
                                    <div className="flex flex-col gap-1.5">
                                        <h3 className="font-heading text-lg font-semibold">{titulo}</h3>
                                        <p className="text-sm text-on-surface-variant">{texto}</p>
                                    </div>
                                </Card>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Llamado a la acción */}
            <section className="relative overflow-hidden bg-primary" aria-labelledby="cta-titulo">
                <div className="tech-grid-claro absolute inset-0" aria-hidden="true" />
                <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
                    <div className="flex max-w-2xl flex-col gap-3">
                        <h2 id="cta-titulo" className="font-heading text-3xl font-bold tracking-tight text-on-primary sm:text-4xl">
                            {autenticado ? 'Tu cuenta está lista' : '¿Cursas INNPRENDE I o II?'}
                        </h2>
                        <p className="text-on-primary-container">
                            {autenticado
                                ? 'Revisa que tus datos estén al día para cuando se abran las inscripciones.'
                                : 'Crea tu cuenta con el correo institucional y prepárate para inscribir tu proyecto.'}
                        </p>
                    </div>
                    <Button asChild size="lg" variant="lima">
                        <Link to={autenticado ? '/perfil' : '/register'}>
                            {autenticado ? 'Revisar mi perfil' : 'Crear mi cuenta'} <ArrowRight />
                        </Link>
                    </Button>
                </div>
            </section>
        </>
    );
};

function FaseCard({ fase, nombre, acento, Icono, titulo, texto, puntos, conector }) {
    const esLima = acento === 'lima';

    return (
        <>
            <Card acento={acento} className="flex flex-col gap-5 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <Badge variant={esLima ? 'lima' : 'primary'} mono>{fase} · {nombre}</Badge>
                    <Badge variant="outline" mono>Próximamente</Badge>
                </div>
                <div className="flex items-start gap-4">
                    <span
                        className={
                            esLima
                                ? 'flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-fixed'
                                : 'flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary'
                        }
                    >
                        <Icono className="size-6" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col gap-2">
                        <h3 className="font-heading text-xl font-bold">{titulo}</h3>
                        <p className="text-on-surface-variant">{texto}</p>
                    </div>
                </div>
                <ul className="mt-auto flex flex-col gap-2.5 border-t border-outline-variant/50 pt-5">
                    {puntos.map((punto) => (
                        <li key={punto} className="flex items-start gap-2.5 text-sm">
                            <CircleCheck className={esLima ? 'mt-0.5 size-4 shrink-0 text-secondary' : 'mt-0.5 size-4 shrink-0 text-primary'} aria-hidden="true" />
                            {punto}
                        </li>
                    ))}
                </ul>
            </Card>
            {conector && (
                <div className="flex items-center justify-center" aria-hidden="true">
                    <span className="flex size-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-primary shadow-soft">
                        <ArrowRight className="size-5 rotate-90 lg:rotate-0" />
                    </span>
                </div>
            )}
        </>
    );
}

export default Inicio;
