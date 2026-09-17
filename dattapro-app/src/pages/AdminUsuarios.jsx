import { useDeferredValue, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ellipsis, GraduationCap, KeyRound, RotateCw, Search, Trash2, UserX, Users } from 'lucide-react';
import { normalizarTexto } from '@/lib/utils';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, ROLE_LABELS, normalizeRole, requiereAdscripcion } from '@/utils/roles';
import { aplicarErroresDelServidor } from '@/utils/validaciones';
import { resetPasswordSchema } from '@/schemas/usuario';
import {
    adscripcionDesdeUsuario,
    adscripcionParaApi,
    adscripcionSchema,
    aplicarErrorDePrograma,
} from '@/schemas/adscripcion';
import { useCatalogosAdscripcion } from '@/hooks/useCatalogosAdscripcion';
import { PageContainer } from '@/components/layout/AppShell';
import { CamposAdscripcion } from '@/components/forms/CamposAdscripcion';
import { RequisitosPassword } from '@/components/forms/RequisitosPassword';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, EmptyState, Skeleton } from '@/components/ui/feedback';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** El rol admin no se otorga ni se quita desde aquí. */
const ROLES_ASIGNABLES = [ROLES.EMPRENDEDOR, ROLES.DOCENTE, ROLES.MENTOR, ROLES.VISITANTE];

function SelectorDeRol({ usuario, deshabilitado, onChange }) {
    const rolActual = normalizeRole(usuario.rol);

    if (rolActual === ROLES.ADMIN) {
        return <Badge variant="dark" mono>{ROLE_LABELS[ROLES.ADMIN]}</Badge>;
    }

    return (
        <NativeSelect
            aria-label={`Rol de ${usuario.nombres} ${usuario.apellidos}`}
            value={rolActual ?? ROLES.EMPRENDEDOR}
            disabled={deshabilitado}
            onChange={(e) => onChange(usuario, e.target.value.toLowerCase())}
            className="h-9 min-w-44 text-sm"
        >
            {ROLES_ASIGNABLES.map((rol) => (
                <option key={rol} value={rol}>{ROLE_LABELS[rol]}</option>
            ))}
        </NativeSelect>
    );
}

/** Facultad arriba; sede y programa debajo. El administrador no tiene adscripción. */
function ResumenAdscripcion({ usuario }) {
    if (!requiereAdscripcion(usuario.rol)) {
        return <p className="text-xs text-outline">No aplica</p>;
    }
    return (
        <>
            <p className={usuario.facultad ? undefined : 'italic text-outline'}>{usuario.facultad ?? 'Sin facultad'}</p>
            <p className="text-xs text-outline">
                {usuario.sede ?? 'Sin sede'} · {usuario.programaAcademico ?? 'Sin programa'}
            </p>
        </>
    );
}

function AccionesUsuario({ usuario, esPropio, onAdscripcion, onReset, onEliminar }) {
    const esAdmin = normalizeRole(usuario.rol) === ROLES.ADMIN;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${usuario.nombres} ${usuario.apellidos}`}>
                    <Ellipsis />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {requiereAdscripcion(usuario.rol) && (
                    <DropdownMenuItem onSelect={() => onAdscripcion(usuario)}>
                        <GraduationCap /> Editar adscripción
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => onReset(usuario)} disabled={esPropio}>
                    <KeyRound /> Restablecer contraseña
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onEliminar(usuario)} disabled={esAdmin || esPropio}>
                    <Trash2 /> Eliminar usuario
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function DialogoResetPassword({ usuario, onClose, onConfirmar }) {
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(resetPasswordSchema),
        mode: 'onTouched',
        defaultValues: { passwordNueva: '', confirmacionPassword: '' },
    });
    const passwordNueva = useWatch({ control, name: 'passwordNueva' });

    const onSubmit = async (datos) => {
        try {
            await onConfirmar(usuario, datos);
            onClose();
        } catch (error) {
            if (!aplicarErroresDelServidor(error, setError)) {
                setError('root', { type: 'server', message: error.message });
            }
        }
    };

    return (
        <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogHeader>
                        <DialogTitle>Restablecer contraseña</DialogTitle>
                        <DialogDescription>
                            Nueva contraseña para {usuario.nombres} {usuario.apellidos} ({usuario.correoInstitucional}).
                            Compártela por un canal seguro.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {errors.root && <Alert variant="error" title={errors.root.message} />}
                        <div className="flex flex-col gap-2">
                            <Field label="Nueva contraseña" error={errors.passwordNueva?.message} required>
                                <PasswordInput autoComplete="new-password" {...register('passwordNueva')} />
                            </Field>
                            <RequisitosPassword valor={passwordNueva} className="sm:grid-cols-1" />
                        </div>
                        <Field label="Confirmar contraseña" error={errors.confirmacionPassword?.message} required>
                            <PasswordInput autoComplete="new-password" {...register('confirmacionPassword')} />
                        </Field>
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" loading={isSubmitting}>Restablecer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DialogoAdscripcion({ usuario, onClose, onConfirmar }) {
    const catalogos = useCatalogosAdscripcion();
    const {
        register,
        control,
        handleSubmit,
        setError,
        setValue,
        formState: { errors, isSubmitting, isDirty },
    } = useForm({ resolver: zodResolver(adscripcionSchema), defaultValues: adscripcionDesdeUsuario(usuario) });

    const onSubmit = async (datos) => {
        try {
            await onConfirmar(usuario, adscripcionParaApi(datos));
            onClose();
        } catch (error) {
            if (!aplicarErroresDelServidor(error, setError) && !aplicarErrorDePrograma(error, setError)) {
                setError('root', { type: 'server', message: error.message });
            }
        }
    };

    return (
        <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogHeader>
                        <DialogTitle>Editar adscripción</DialogTitle>
                        <DialogDescription>
                            Sede, facultad y programa de {usuario.nombres} {usuario.apellidos}.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {errors.root && <Alert variant="error" title={errors.root.message} />}
                        <CamposAdscripcion form={{ register, control, setValue, errors }} catalogos={catalogos} />
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Guardar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CargandoUsuarios() {
    return (
        <div className="flex flex-col gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
    );
}

const AdminUsuarios = () => {
    const { user } = useAuth();
    const { usuarios, isLoading, error, updatingId, fetchUsuarios, handleRoleChange, updateAdscripcion, resetPassword, handleDeleteUser } =
        useUserManagement();

    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [usuarioAdscripcion, setUsuarioAdscripcion] = useState(null);
    const [usuarioReset, setUsuarioReset] = useState(null);
    const [usuarioEliminar, setUsuarioEliminar] = useState(null);
    const busquedaDiferida = useDeferredValue(busqueda);

    const filtrados = useMemo(() => {
        const termino = normalizarTexto(busquedaDiferida.trim());
        return usuarios.filter((u) => {
            const coincideTexto =
                !termino || normalizarTexto(`${u.nombres} ${u.apellidos} ${u.correoInstitucional}`).includes(termino);
            const coincideRol = !filtroRol || normalizeRole(u.rol) === filtroRol;
            return coincideTexto && coincideRol;
        });
    }, [usuarios, busquedaDiferida, filtroRol]);

    const esPropio = (u) => u.correoInstitucional?.toLowerCase() === user?.email?.toLowerCase();
    const hayFiltros = Boolean(busqueda || filtroRol);

    return (
        <PageContainer>
            <PageHeader
                eyebrow="Administración"
                title="Usuarios"
                description="Consulta las cuentas registradas, asigna roles y restablece contraseñas."
                actions={
                    <Button variant="outline" onClick={fetchUsuarios} disabled={isLoading}>
                        <RotateCw className={isLoading ? 'animate-spin' : undefined} /> Actualizar
                    </Button>
                }
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" aria-hidden="true" />
                    <Input
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre o correo"
                        aria-label="Buscar usuarios"
                        className="pl-9"
                    />
                </div>
                <NativeSelect
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    aria-label="Filtrar por rol"
                    className="sm:w-52"
                >
                    <option value="">Todos los roles</option>
                    {Object.values(ROLES).map((rol) => (
                        <option key={rol} value={rol}>{ROLE_LABELS[rol]}</option>
                    ))}
                </NativeSelect>
                {!isLoading && (
                    <Badge variant="outline" mono className="self-start sm:self-center" aria-live="polite">
                        {filtrados.length} de {usuarios.length}
                    </Badge>
                )}
            </div>

            {error ? (
                <Alert variant="error" title="No pudimos cargar los usuarios">
                    <p>{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={fetchUsuarios}>
                        <RotateCw /> Reintentar
                    </Button>
                </Alert>
            ) : isLoading ? (
                <CargandoUsuarios />
            ) : filtrados.length === 0 ? (
                <EmptyState
                    icon={hayFiltros ? UserX : Users}
                    title={hayFiltros ? 'Sin resultados' : 'Aún no hay usuarios'}
                    description={hayFiltros ? 'Prueba con otro nombre, correo o rol.' : 'Las cuentas aparecerán aquí cuando alguien se registre.'}
                    action={hayFiltros && (
                        <Button variant="outline" size="sm" onClick={() => { setBusqueda(''); setFiltroRol(''); }}>
                            Limpiar filtros
                        </Button>
                    )}
                />
            ) : (
                <>
                    {/* Escritorio: tabla */}
                    <Card className="hidden overflow-hidden md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-outline-variant/60 bg-surface-container-low">
                                <tr className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                                    <th scope="col" className="px-5 py-3 font-medium">Usuario</th>
                                    <th scope="col" className="px-5 py-3 font-medium">Adscripción</th>
                                    <th scope="col" className="px-5 py-3 font-medium">Rol</th>
                                    <th scope="col" className="px-5 py-3 font-medium"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/50">
                                {filtrados.map((u) => (
                                    <tr key={u.id} className="transition-colors hover:bg-surface-container-low/60">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar nombres={u.nombres} apellidos={u.apellidos} fotoUrl={u.fotoUrl} />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-on-surface">
                                                        {u.nombres} {u.apellidos}
                                                        {esPropio(u) && <Badge variant="lima" mono className="ml-2">Tú</Badge>}
                                                    </p>
                                                    <p className="truncate text-on-surface-variant">{u.correoInstitucional}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-on-surface-variant">
                                            <ResumenAdscripcion usuario={u} />
                                        </td>
                                        <td className="px-5 py-3">
                                            <SelectorDeRol usuario={u} deshabilitado={updatingId === u.id} onChange={handleRoleChange} />
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <AccionesUsuario
                                                usuario={u}
                                                esPropio={esPropio(u)}
                                                onAdscripcion={setUsuarioAdscripcion}
                                                onReset={setUsuarioReset}
                                                onEliminar={setUsuarioEliminar}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    {/* Celular: tarjetas */}
                    <ul className="flex flex-col gap-3 md:hidden">
                        {filtrados.map((u) => (
                            <li key={u.id}>
                                <Card className="flex flex-col gap-4 p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar nombres={u.nombres} apellidos={u.apellidos} fotoUrl={u.fotoUrl} />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">{u.nombres} {u.apellidos}</p>
                                            <p className="truncate text-sm text-on-surface-variant">{u.correoInstitucional}</p>
                                            <div className="mt-1 text-sm text-on-surface-variant">
                                                <ResumenAdscripcion usuario={u} />
                                            </div>
                                        </div>
                                        <AccionesUsuario
                                            usuario={u}
                                            esPropio={esPropio(u)}
                                            onAdscripcion={setUsuarioAdscripcion}
                                            onReset={setUsuarioReset}
                                            onEliminar={setUsuarioEliminar}
                                        />
                                    </div>
                                    <SelectorDeRol usuario={u} deshabilitado={updatingId === u.id} onChange={handleRoleChange} />
                                </Card>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {usuarioAdscripcion && (
                <DialogoAdscripcion
                    usuario={usuarioAdscripcion}
                    onClose={() => setUsuarioAdscripcion(null)}
                    onConfirmar={updateAdscripcion}
                />
            )}

            {usuarioReset && (
                <DialogoResetPassword usuario={usuarioReset} onClose={() => setUsuarioReset(null)} onConfirmar={resetPassword} />
            )}

            <AlertDialog open={Boolean(usuarioEliminar)} onOpenChange={(abierto) => !abierto && setUsuarioEliminar(null)}>
                <AlertDialogContent>
                    <AlertDialogTitle>¿Eliminar a {usuarioEliminar?.nombres} {usuarioEliminar?.apellidos}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Se borrará la cuenta {usuarioEliminar?.correoInstitucional}. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(usuarioEliminar)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageContainer>
    );
};

export default AdminUsuarios;
