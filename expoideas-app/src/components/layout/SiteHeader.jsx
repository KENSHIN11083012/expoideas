import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Database, House, KeyRound, LogIn, LogOut, Menu, User, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { fileUrl } from '@/lib/files';
import { roleLabel } from '@/lib/roles';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { ExpoideasLogo } from '@/components/brand/ExpoideasLogo';
import { InstitutionalLogos } from '@/components/brand/InstitutionalLogos';
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
const linksFor = (signedIn, management) => [
    { to: ROUTES.HOME, label: 'Inicio', icon: House, end: true },
    ...(signedIn ? [{ to: ROUTES.PROFILE, label: 'Mi perfil', icon: User }] : []),
    ...(management
        ? [
              { to: ROUTES.USERS, label: 'Usuarios', icon: Users },
              { to: ROUTES.CATALOGS, label: 'Catálogos', icon: Database },
          ]
        : []),
];

/** Enlace de escritorio: la sección activa lleva la barra lima inferior. */
const desktopLinkClass = ({ isActive }) =>
    cn(
        'relative flex h-full items-center px-3 text-sm font-semibold transition-colors',
        'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:bg-secondary-container after:transition-opacity',
        isActive ? 'text-primary after:opacity-100' : 'text-on-surface-variant after:opacity-0 hover:text-primary',
    );

const mobileLinkClass = ({ isActive }) =>
    cn(
        'flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-colors',
        isActive
            ? 'border-secondary-container bg-primary/10 text-primary'
            : 'border-transparent text-on-surface hover:bg-surface-container-low',
    );

const displayName = (user) => user?.fullName || user?.email || 'Mi cuenta';

function UserAvatar({ user, size }) {
    return <Avatar firstName={user?.firstName} lastName={user?.lastName} photoUrl={fileUrl(user?.photoId)} size={size} />;
}

function AccountMenu({ user, role, onLogout }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-surface-container-low"
                    aria-label="Abrir menú de la cuenta"
                >
                    <UserAvatar user={user} size="sm" />
                    <span className="hidden flex-col items-start text-left lg:flex">
                        <span className="max-w-40 truncate text-sm font-semibold leading-tight text-on-surface">{displayName(user)}</span>
                        <span className="label-mono text-[10px] font-normal text-on-surface-variant">{roleLabel(role)}</span>
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
                <DropdownMenuLabel>
                    <p className="truncate text-sm font-semibold text-on-surface">{displayName(user)}</p>
                    {user?.email && <p className="truncate text-xs text-on-surface-variant">{user.email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to={ROUTES.PROFILE}>
                        <User /> Mi perfil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to={ROUTES.SECURITY}>
                        <KeyRound /> Seguridad
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                    <LogOut /> Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function MobileMenu({ links, signedIn, user, role, onLogout }) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    // En escritorio, Seguridad vive en el menú de la cuenta.
    const mobileLinks = signedIn ? [...links, { to: ROUTES.SECURITY, label: 'Seguridad', icon: KeyRound }] : links;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
                    <Menu className="size-5" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <div className="border-b border-outline-variant/60 px-5 py-5">
                    <SheetTitle asChild>
                        <span>
                            <ExpoideasLogo size="sm" />
                        </span>
                    </SheetTitle>
                    <SheetDescription className="sr-only">Menú de navegación</SheetDescription>
                </div>

                {signedIn && (
                    <div className="flex items-center gap-3 border-b border-outline-variant/60 px-5 py-4">
                        <UserAvatar user={user} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{displayName(user)}</p>
                            <p className="label-mono text-[10px] font-normal text-on-surface-variant">{roleLabel(role)}</p>
                        </div>
                    </div>
                )}

                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Principal">
                    {mobileLinks.map(({ to, label, icon: Icon, end }) => (
                        <NavLink key={to} to={to} end={end} onClick={close} className={mobileLinkClass}>
                            <Icon className="size-4" aria-hidden="true" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex flex-col gap-2 border-t border-outline-variant/60 p-4">
                    {signedIn ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                close();
                                onLogout();
                            }}
                        >
                            <LogOut /> Cerrar sesión
                        </Button>
                    ) : (
                        <>
                            <Button asChild onClick={close}>
                                <Link to={ROUTES.REGISTER}>
                                    <UserPlus /> Crear cuenta
                                </Link>
                            </Button>
                            <Button asChild variant="outline" onClick={close}>
                                <Link to={ROUTES.LOGIN}>
                                    <LogIn /> Iniciar sesión
                                </Link>
                            </Button>
                        </>
                    )}
                    <InstitutionalLogos className="mt-3 self-center" />
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
    const { token, user, role, isManagement, logout } = useAuth();
    const navigate = useNavigate();
    const signedIn = Boolean(token);
    const links = linksFor(signedIn, isManagement);

    const signOut = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <header className="glass sticky top-0 z-40 border-b border-outline-variant/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
                <Link to={ROUTES.HOME} className="flex shrink-0 items-center rounded" aria-label="Expoideas, ir al inicio">
                    <ExpoideasLogo size="sm" className="lg:hidden" />
                    <ExpoideasLogo className="hidden lg:inline-flex" />
                </Link>

                <span className="hidden h-8 w-px bg-outline-variant xl:block" aria-hidden="true" />
                <InstitutionalLogos className="hidden xl:inline-flex" />

                <nav className="ml-auto hidden h-full items-stretch md:flex" aria-label="Principal">
                    {links.map(({ to, label, end }) => (
                        <NavLink key={to} to={to} end={end} className={desktopLinkClass}>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 md:ml-4">
                    {signedIn ? (
                        <div className="hidden md:block">
                            <AccountMenu user={user} role={role} onLogout={signOut} />
                        </div>
                    ) : (
                        <div className="hidden items-center gap-2 md:flex">
                            <Button asChild variant="ghost">
                                <Link to={ROUTES.LOGIN}>Iniciar sesión</Link>
                            </Button>
                            <Button asChild>
                                <Link to={ROUTES.REGISTER}>Crear cuenta</Link>
                            </Button>
                        </div>
                    )}
                    <MobileMenu links={links} signedIn={signedIn} user={user} role={role} onLogout={signOut} />
                </div>
            </div>
        </header>
    );
}
