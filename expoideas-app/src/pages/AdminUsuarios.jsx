import { useDeferredValue, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ellipsis, GraduationCap, KeyRound, RotateCw, Search, Trash2, UserPlus, UserX, Users } from 'lucide-react';
import { normalizarTexto } from '@/lib/utils';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/hooks/useAuth';
import {
    ROLES,
    ROLE_LABELS,
    esDeGestion,
    normalizeRole,
    puedeGestionar,
    requiereAdscripcion,
    roleLabel,
    rolesAsignablesPor,
} from '@/utils/roles';
import { aplicarErroresDelServidor, DOMINIO_INSTITUCIONAL } from '@/utils/validaciones';
import { nuevaCuentaSchemaPara, resetPasswordSchema } from '@/schemas/usuario';
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
import { urlDeArchivo } from '@/utils/archivos';
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

/**
 * La propia cuenta y las que el rol de la sesión no gestiona (MacondoLab frente a
 * cuentas de gestión) solo muestran el rol. La API aplica las mismas reglas.
 */
function SelectorDeRol({ usuario, actor, esPropio, deshabilitado, onChange }) {
    const rolActual = normalizeRole(usuario.rol);

    if (esPropio || !puedeGestionar(actor, rolActual)) {
        return (
            <Badge variant={esDeGestion(rolActual) ? 'dark' : 'outline'} mono>
                {roleLabel(rolActual)}
            </Badge>
        );
    }

    return (
        <NativeSelect
            aria-label={`Rol de ${usuario.nombres} ${usuario.apellidos}`}
            value={rolActual ?? ''}
            disabled={deshabilitado}
            onChange={(e) => onChange(usuario, e.target.value)}
            className="h-9 min-w-44 text-sm"
        >
            {rolesAsignablesPor(actor).map((rol) => (
                <option key={rol} value={rol}>{ROLE_LABELS[rol]}</option>
            ))}
        </NativeSelect>
    );
}

/** La persona aún no cambia su contraseña temporal o no ha autorizado sus datos. */
function PrimerIngresoPendiente({ usuario, className }) {
    if (!usuario.pendientes?.length) return null;
    return (
        <Badge variant="outline" mono className={className} title="Aún no completa su primer ingreso">
            Primer ingreso pendiente
        </Badge>
    );
}

/** Facultad arriba; sede y programa debajo. Gestión y jurados no tienen adscripción. */
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

function AccionesUsuario({ usuario, actor, esPropio, onAdscripcion, onReset, onEliminar }) {
    // MacondoLab no tiene nada que hacer sobre cuentas de gestión.
    if (!puedeGestionar(actor, usuario.rol)) return null;

    const esAdmin = normalizeRole(usuario.rol) === ROLES.ADMIN;
    const puedeEliminar = normalizeRole(actor) === ROLES.ADMIN;

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
                {puedeEliminar && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => onEliminar(usuario)} disabled={esAdmin || esPropio}>
                            <Trash2 /> Eliminar usuario
                        </DropdownMenuItem>
                    </>
                )}
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
                            Compártela por un canal seguro: se le pedirá cambiarla al ingresar.
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

/** Los catálogos se piden solo si el rol elegido lleva adscripción. */
function AdscripcionDeLaCuenta({ form }) {
    const catalogos = useCatalogosAdscripcion();
    return (
        <fieldset className="flex flex-col gap-4 rounded-lg border border-outline-variant/70 p-4">
            <legend className="px-1 font-heading text-sm font-semibold text-on-surface">Adscripción académica</legend>
            <CamposAdscripcion form={form} catalogos={catalogos} />
        </fieldset>
    );
}

function DialogoNuevaCuenta({ actor, onClose, onCrear }) {
    const rolesPermitidos = rolesAsignablesPor(actor);
    const {
        register,
        control,
        handleSubmit,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        // El esquema se arma con el rol elegido en cada validación.
        resolver: (valores, contexto, opciones) => zodResolver(nuevaCuentaSchemaPara(valores.rol))(valores, contexto, opciones),
        mode: 'onTouched',
        defaultValues: {
            // El caso más común es un jurado externo.
            rol: rolesPermitidos.includes(ROLES.JURADO) ? ROLES.JURADO : rolesPermitidos[0],
            nombres: '',
            apellidos: '',
            correoInstitucional: '',
            password: '',
            sedeId: '',
            facultadId: '',
            programaAcademicoId: '',
        },
    });
    const [rol, password] = useWatch({ control, name: ['rol', 'password'] });

    const onSubmit = async ({ rol: rolElegido, sedeId, facultadId, programaAcademicoId, ...datos }) => {
        const cuerpo = {
            ...datos,
            rol: rolElegido.toLowerCase(),
            ...(requiereAdscripcion(rolElegido) ? adscripcionParaApi({ sedeId, facultadId, programaAcademicoId }) : {}),
        };
        try {
            await onCrear(cuerpo);
            onClose();
        } catch (error) {
            if (error.status === 409) {
                setError('correoInstitucional', { type: 'server', message: error.message }, { shouldFocus: true });
            } else if (!aplicarErroresDelServidor(error, setError) && !aplicarErrorDePrograma(error, setError)) {
                setError('root', { type: 'server', message: error.message });
            }
        }
    };

    return (
        <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogHeader>
                        <DialogTitle>Nueva cuenta</DialogTitle>
                        <DialogDescription>
                            Para jurados externos o personas que necesitan otro rol. Los estudiantes pueden crear su
                            cuenta por sí mismos.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {errors.root && <Alert variant="error" title={errors.root.message} />}
                        <Field label="Rol" error={errors.rol?.message} required>
                            <NativeSelect {...register('rol')}>
                                {rolesPermitidos.map((opcion) => (
                                    <option key={opcion} value={opcion}>{ROLE_LABELS[opcion]}</option>
                                ))}
                            </NativeSelect>
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Nombres" error={errors.nombres?.message} required>
                                <Input autoComplete="off" {...register('nombres')} />
                            </Field>
                            <Field label="Apellidos" error={errors.apellidos?.message} required>
                                <Input autoComplete="off" {...register('apellidos')} />
                            </Field>
                        </div>
                        <Field
                            label="Correo"
                            error={errors.correoInstitucional?.message}
                            hint={rol === ROLES.JURADO ? 'Puede ser personal o de su organización.' : `Debe terminar en ${DOMINIO_INSTITUCIONAL}`}
                            required
                        >
                            <Input type="email" inputMode="email" autoComplete="off" {...register('correoInstitucional')} />
                        </Field>
                        <div className="flex flex-col gap-2">
                            <Field
                                label="Contraseña temporal"
                                error={errors.password?.message}
                                hint="Entrégala por un canal seguro; se le pedirá cambiarla en su primer ingreso."
                                required
                            >
                                <PasswordInput autoComplete="new-password" {...register('password')} />
                            </Field>
                            <RequisitosPassword valor={password} className="sm:grid-cols-1" />
                        </div>
                        {requiereAdscripcion(rol) && <AdscripcionDeLaCuenta form={{ register, control, setValue, errors }} />}
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" loading={isSubmitting}>Crear cuenta</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** Lo que implica cada rol de gestión, para confirmarlo antes de otorgarlo. */
const ALCANCE_DE_GESTION = {
    [ROLES.MACONDOLAB]: 'Podrá gestionar las cuentas de estudiantes, docentes y jurados, y la clasificación de proyectos.',
    [ROLES.ADMIN]: 'Tendrá acceso completo a la plataforma, incluidas las cuentas de gestión y la estructura institucional.',
};

function CargandoUsuarios() {
    return (
        <div className="flex flex-col gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
    );
}

const AdminUsuarios = () => {
    const { user, role } = useAuth();
    const {
        usuarios,
        isLoading,
        error,
        updatingId,
        fetchUsuarios,
        crearUsuario,
        handleRoleChange,
        updateAdscripcion,
        resetPassword,
        handleDeleteUser,
    } = useUserManagement();

    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [usuarioAdscripcion, setUsuarioAdscripcion] = useState(null);
    const [usuarioReset, setUsuarioReset] = useState(null);
    const [usuarioEliminar, setUsuarioEliminar] = useState(null);
    const [cambioDeRol, setCambioDeRol] = useState(null);
    const [creandoCuenta, setCreandoCuenta] = useState(false);
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

    // Otorgar un rol de gestión se confirma; los demás cambios se aplican directo.
    const solicitarCambioDeRol = (usuario, rol) => {
        if (esDeGestion(rol)) {
            setCambioDeRol({ usuario, rol });
        } else {
            handleRoleChange(usuario, rol.toLowerCase());
        }
    };

    return (
        <PageContainer>
            <PageHeader
                eyebrow="Gestión"
                title="Usuarios"
                description="Consulta las cuentas, asigna roles, crea cuentas para jurados y restablece contraseñas."
                actions={
                    <>
                        <Button variant="outline" onClick={fetchUsuarios} disabled={isLoading}>
                            <RotateCw className={isLoading ? 'animate-spin' : undefined} /> Actualizar
                        </Button>
                        <Button onClick={() => setCreandoCuenta(true)}>
                            <UserPlus /> Nueva cuenta
                        </Button>
                    </>
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
                                                <Avatar nombres={u.nombres} apellidos={u.apellidos} fotoUrl={urlDeArchivo(u.fotoId)} />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-on-surface">
                                                        {u.nombres} {u.apellidos}
                                                        {esPropio(u) && <Badge variant="lima" mono className="ml-2">Tú</Badge>}
                                                        <PrimerIngresoPendiente usuario={u} className="ml-2" />
                                                    </p>
                                                    <p className="truncate text-on-surface-variant">{u.correoInstitucional}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-on-surface-variant">
                                            <ResumenAdscripcion usuario={u} />
                                        </td>
                                        <td className="px-5 py-3">
                                            <SelectorDeRol
                                                usuario={u}
                                                actor={role}
                                                esPropio={esPropio(u)}
                                                deshabilitado={updatingId === u.id}
                                                onChange={solicitarCambioDeRol}
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <AccionesUsuario
                                                usuario={u}
                                                actor={role}
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
                                        <Avatar nombres={u.nombres} apellidos={u.apellidos} fotoUrl={urlDeArchivo(u.fotoId)} />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">{u.nombres} {u.apellidos}</p>
                                            <PrimerIngresoPendiente usuario={u} className="mt-1" />
                                            <p className="truncate text-sm text-on-surface-variant">{u.correoInstitucional}</p>
                                            <div className="mt-1 text-sm text-on-surface-variant">
                                                <ResumenAdscripcion usuario={u} />
                                            </div>
                                        </div>
                                        <AccionesUsuario
                                            usuario={u}
                                            actor={role}
                                            esPropio={esPropio(u)}
                                            onAdscripcion={setUsuarioAdscripcion}
                                            onReset={setUsuarioReset}
                                            onEliminar={setUsuarioEliminar}
                                        />
                                    </div>
                                    <SelectorDeRol
                                        usuario={u}
                                        actor={role}
                                        esPropio={esPropio(u)}
                                        deshabilitado={updatingId === u.id}
                                        onChange={solicitarCambioDeRol}
                                    />
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

            {creandoCuenta && (
                <DialogoNuevaCuenta actor={role} onClose={() => setCreandoCuenta(false)} onCrear={crearUsuario} />
            )}

            <AlertDialog open={Boolean(cambioDeRol)} onOpenChange={(abierto) => !abierto && setCambioDeRol(null)}>
                <AlertDialogContent>
                    <AlertDialogTitle>
                        ¿Dar el rol {ROLE_LABELS[cambioDeRol?.rol]} a {cambioDeRol?.usuario.nombres} {cambioDeRol?.usuario.apellidos}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>{ALCANCE_DE_GESTION[cambioDeRol?.rol]}</AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRoleChange(cambioDeRol.usuario, cambioDeRol.rol.toLowerCase())}>
                            Dar el rol
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
