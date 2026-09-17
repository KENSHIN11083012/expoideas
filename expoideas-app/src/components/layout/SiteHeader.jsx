import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Database, House, KeyRound, LogIn, LogOut, Menu, User, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { roleLabel } from '@/utils/roles';
import { cn } from '@/lib/utils';
import { MarcaExpoideas } from '@/components/brand/MarcaExpoideas';
import { LogosInstitucionales } from '@/components/brand/LogosInstitucionales';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/**
 * Secciones del menú. Solo aparecen las que existen: las de INNPRENDE I y II se
 * agregan en las fases del dominio.
 */
const enlacesPara = (autenticado, esGestion) => [
    { to: '/', label: 'Inicio', icon: House, end: true },
    ...(autenticado ? [{ to: '/perfil', label: 'Mi perfil', icon: User }] : []),
    ...(esGestion
        ? [
            { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
            { to: '/admin/catalogos', label: 'Catálogos', icon: Database },
        ]
        : []),
];

/** Enlace de escritorio: la sección activa lleva la barra lima inferior. */
const claseEnlace = ({ isActive }) =>
    cn(
        'relative flex h-full items-center px-3 text-sm font-semibold transition-colors',
        'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:bg-secondary-container after:transition-opacity',
        isActive ? 'text-primary after:opacity-100' : 'text-on-surface-variant after:opacity-0 hover:text-primary',
    );

function nombreVisible(user) {
    return user?.name || user?.email || 'Mi cuenta';
}

function MenuDeUsuario({ user, role, onLogout }) {
    const [nombres = '', ...resto] = (user?.name ?? '').split(' ');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-surface-container-low"
                    aria-label="Abrir menú de la cuenta"
                >
                    <Avatar nombres={nombres} apellidos={resto.join(' ')} size="sm" />
                    <span className="hidden flex-col items-start text-left lg:flex">
                        <span className="max-w-40 truncate text-sm font-semibold leading-tight text-on-surface">{nombreVisible(user)}</span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{roleLabel(role)}</span>
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
                <DropdownMenuLabel>
                    <p className="truncate text-sm font-semibold text-on-surface">{nombreVisible(user)}</p>
                    {user?.email && <p className="truncate text-xs text-on-surface-variant">{user.email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/perfil"><User /> Mi perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/seguridad"><KeyRound /> Seguridad</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                    <LogOut /> Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const claseEnlaceMovil = ({ isActive }) =>
    cn(
        'flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-colors',
        isActive ? 'border-secondary-container bg-primary/10 text-primary' : 'border-transparent text-on-surface hover:bg-surface-container-low',
    );

function MenuMovil({ enlaces, autenticado, user, role, onLogout }) {
    const [abierto, setAbierto] = useState(false);
    const cerrar = () => setAbierto(false);
    // En el menú de escritorio, Seguridad vive en el menú de la cuenta.
    const enlacesMovil = autenticado
        ? [...enlaces, { to: '/seguridad', label: 'Seguridad', icon: KeyRound }]
        : enlaces;

    return (
        <Sheet open={abierto} onOpenChange={setAbierto}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
                    <Menu className="size-5" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <div className="border-b border-outline-variant/60 px-5 py-5">
                    <SheetTitle asChild>
                        <span><MarcaExpoideas size="sm" /></span>
                    </SheetTitle>
                    <SheetDescription className="sr-only">Menú de navegación</SheetDescription>
                </div>

                {autenticado && (
                    <div className="flex items-center gap-3 border-b border-outline-variant/60 px-5 py-4">
                        <Avatar nombres={user?.name?.split(' ')[0]} apellidos={user?.name?.split(' ').slice(1).join(' ')} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{nombreVisible(user)}</p>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{roleLabel(role)}</p>
                        </div>
                    </div>
                )}

                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Principal">
                    {enlacesMovil.map(({ to, label, icon: Icono, end }) => (
                        <NavLink key={to} to={to} end={end} onClick={cerrar} className={claseEnlaceMovil}>
                            <Icono className="size-4" aria-hidden="true" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex flex-col gap-2 border-t border-outline-variant/60 p-4">
                    {autenticado ? (
                        <Button variant="outline" onClick={() => { cerrar(); onLogout(); }}>
                            <LogOut /> Cerrar sesión
                        </Button>
                    ) : (
                        <>
                            <Button asChild onClick={cerrar}>
                                <Link to="/register"><UserPlus /> Crear cuenta</Link>
                            </Button>
                            <Button asChild variant="outline" onClick={cerrar}>
                                <Link to="/login"><LogIn /> Iniciar sesión</Link>
                            </Button>
                        </>
                    )}
                    <LogosInstitucionales size="sm" className="mt-3 self-center" />
                </div>
            </SheetContent>
        </Sheet>
    );
}

/**
 * Barra superior fija con efecto cristal (Academic Nexus). En escritorio muestra
 * la navegación y el menú de la cuenta; por debajo de md, un menú lateral.
 */
export function SiteHeader() {
    const { token, user, role, esGestion, logout } = useAuth();
    const navigate = useNavigate();
    const autenticado = Boolean(token);
    const enlaces = enlacesPara(autenticado, esGestion());

    const cerrarSesion = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="glass sticky top-0 z-40 border-b border-outline-variant/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
                <Link to="/" className="flex shrink-0 items-center rounded" aria-label="Expoideas, ir al inicio">
                    <MarcaExpoideas size="sm" className="lg:hidden" />
                    <MarcaExpoideas className="hidden lg:inline-flex" />
                </Link>

                <span className="hidden h-8 w-px bg-outline-variant xl:block" aria-hidden="true" />
                <LogosInstitucionales size="sm" className="hidden xl:inline-flex" />

                <nav className="ml-auto hidden h-full items-stretch md:flex" aria-label="Principal">
                    {enlaces.map(({ to, label, end }) => (
                        <NavLink key={to} to={to} end={end} className={claseEnlace}>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 md:ml-4">
                    {autenticado ? (
                        <div className="hidden md:block">
                            <MenuDeUsuario user={user} role={role} onLogout={cerrarSesion} />
                        </div>
                    ) : (
                        <div className="hidden items-center gap-2 md:flex">
                            <Button asChild variant="ghost">
                                <Link to="/login">Iniciar sesión</Link>
                            </Button>
                            <Button asChild>
                                <Link to="/register">Crear cuenta</Link>
                            </Button>
                        </div>
                    )}
                    <MenuMovil enlaces={enlaces} autenticado={autenticado} user={user} role={role} onLogout={cerrarSesion} />
                </div>
            </div>
        </header>
    );
}
