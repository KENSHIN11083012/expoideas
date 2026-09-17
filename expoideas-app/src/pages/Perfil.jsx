import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2, CalendarDays, GraduationCap, KeyRound, Landmark, Mail, RotateCw } from 'lucide-react';
import { get, put } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { requiereAdscripcion, roleLabel } from '@/utils/roles';
import { aplicarErroresDelServidor } from '@/utils/validaciones';
import { datosPersonalesSchema, perfilSchema } from '@/schemas/usuario';
import { adscripcionDesdeUsuario, adscripcionParaApi, aplicarErrorDePrograma } from '@/schemas/adscripcion';
import { useCatalogosAdscripcion } from '@/hooks/useCatalogosAdscripcion';
import { CamposAdscripcion } from '@/components/forms/CamposAdscripcion';
import { PageContainer } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, Skeleton } from '@/components/ui/feedback';

const valoresDelFormulario = (perfil, conAdscripcion) => ({
    nombres: perfil?.nombres ?? '',
    apellidos: perfil?.apellidos ?? '',
    ...(conAdscripcion ? adscripcionDesdeUsuario(perfil) : {}),
});

const fechaLarga = (iso) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

function Dato({ icon: Icono, etiqueta, valor, vacio = 'Sin asignar' }) {
    return (
        <div className="flex items-start gap-3 py-3">
            <Icono className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{etiqueta}</dt>
                <dd className={valor ? 'break-words text-sm text-on-surface' : 'text-sm italic text-outline'}>
                    {valor ?? vacio}
                </dd>
            </div>
        </div>
    );
}

function TarjetaIdentidad({ perfil }) {
    return (
        <Card acento="primary" className="h-fit">
            <CardContent className="flex flex-col items-center gap-3 pt-8 text-center">
                <Avatar nombres={perfil.nombres} apellidos={perfil.apellidos} fotoUrl={perfil.fotoUrl} size="lg" />
                <div className="flex flex-col items-center gap-2">
                    <p className="font-heading text-xl font-bold leading-tight">{perfil.nombres} {perfil.apellidos}</p>
                    <Badge variant="lima" mono>{roleLabel(perfil.rol)}</Badge>
                </div>
            </CardContent>
            <dl className="mx-6 divide-y divide-outline-variant/50 border-t border-outline-variant/50 pb-2">
                <Dato icon={Mail} etiqueta="Correo institucional" valor={perfil.correoInstitucional} />
                {requiereAdscripcion(perfil.rol) && (
                    <>
                        <Dato icon={Landmark} etiqueta="Sede" valor={perfil.sede} />
                        <Dato icon={Building2} etiqueta="Facultad" valor={perfil.facultad} />
                        <Dato icon={GraduationCap} etiqueta="Programa académico" valor={perfil.programaAcademico} vacio="Sin programa" />
                    </>
                )}
                <Dato icon={CalendarDays} etiqueta="Miembro desde" valor={fechaLarga(perfil.fechaCreacion)} />
            </dl>
        </Card>
    );
}

/** Los catálogos solo se piden si el rol lleva adscripción. */
function AdscripcionDelPerfil({ form }) {
    const catalogos = useCatalogosAdscripcion();
    return <CamposAdscripcion form={form} catalogos={catalogos} />;
}

/**
 * Se monta cuando el perfil ya cargó: el rol decide el esquema del formulario
 * desde el primer render.
 */
function FormularioPerfil({ perfil, onGuardado }) {
    const { updateUser } = useAuth();
    const conAdscripcion = requiereAdscripcion(perfil.rol);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        setValue,
        formState: { errors, isSubmitting, isDirty },
    } = useForm({
        resolver: zodResolver(conAdscripcion ? perfilSchema : datosPersonalesSchema),
        defaultValues: valoresDelFormulario(perfil, conAdscripcion),
    });

    const onSubmit = async ({ nombres, apellidos, ...adscripcion }) => {
        const cuerpo = conAdscripcion ? { nombres, apellidos, ...adscripcionParaApi(adscripcion) } : { nombres, apellidos };
        try {
            const actualizado = await put('/usuarios/me', cuerpo);
            onGuardado(actualizado);
            reset(valoresDelFormulario(actualizado, conAdscripcion));
            updateUser({ name: `${actualizado.nombres} ${actualizado.apellidos}`.trim() });
            toast.success('Tus datos se actualizaron');
        } catch (error) {
            if (!aplicarErroresDelServidor(error, setError) && !aplicarErrorDePrograma(error, setError)) {
                toast.error(error.message);
            }
        }
    };

    return (
        <>
            {conAdscripcion && perfil.facultadId == null && (
                <Alert variant="info" title="Completa tu vínculo con la universidad">
                    Indica tu sede y facultad (y tu programa, si tienes uno) para que tu perfil quede completo.
                </Alert>
            )}

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <CardHeader>
                        <CardTitle>Datos personales</CardTitle>
                        <CardDescription>Así aparece tu nombre en la plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2">
                        <Field label="Nombres" error={errors.nombres?.message} required>
                            <Input autoComplete="given-name" {...register('nombres')} />
                        </Field>
                        <Field label="Apellidos" error={errors.apellidos?.message} required>
                            <Input autoComplete="family-name" {...register('apellidos')} />
                        </Field>
                        <Field
                            label="Correo institucional"
                            hint="Es tu usuario de acceso; solo la administración puede cambiarlo."
                            className="sm:col-span-2"
                        >
                            <Input value={perfil.correoInstitucional} readOnly disabled />
                        </Field>
                    </CardContent>
                    {conAdscripcion && (
                        <>
                            <CardHeader className="border-t border-outline-variant/50">
                                <CardTitle as="h3">Adscripción académica</CardTitle>
                                <CardDescription>Tu sede, tu facultad y, si aplica, tu programa.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AdscripcionDelPerfil form={{ register, control, setValue, errors }} />
                            </CardContent>
                        </>
                    )}
                    <CardFooter className="justify-end">
                        <Button type="button" variant="ghost" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
                            Descartar
                        </Button>
                        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                            Guardar cambios
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </>
    );
}

function CargandoPerfil() {
    return (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]" aria-hidden="true">
            <Skeleton className="h-96 rounded-lg" />
            <div className="flex flex-col gap-6">
                <Skeleton className="h-64 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
            </div>
        </div>
    );
}

const Perfil = () => {
    const { role } = useAuth();
    const [perfil, setPerfil] = useState(null);
    const [errorCarga, setErrorCarga] = useState('');

    // Cambiar `intento` vuelve a pedir el perfil (botón Reintentar).
    const [intento, setIntento] = useState(0);

    // /usuarios/me identifica al usuario por la sesión, no por un id del cliente.
    useEffect(() => {
        let cancelado = false;
        get('/usuarios/me')
            .then((data) => {
                if (!cancelado) setPerfil(data);
            })
            .catch((error) => {
                if (!cancelado) setErrorCarga(error.message);
            });
        return () => { cancelado = true; };
    }, [intento]);

    const reintentar = () => {
        setErrorCarga('');
        setIntento((n) => n + 1);
    };

    return (
        <PageContainer>
            <PageHeader
                eyebrow="Mi cuenta"
                title="Mi perfil"
                description={
                    requiereAdscripcion(role)
                        ? 'Mantén al día tus datos y tu vínculo con la universidad.'
                        : 'Mantén al día tus datos personales.'
                }
            />

            {errorCarga ? (
                <Alert variant="error" title="No pudimos cargar tu perfil">
                    <p>{errorCarga}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={reintentar}>
                        <RotateCw /> Reintentar
                    </Button>
                </Alert>
            ) : !perfil ? (
                <CargandoPerfil />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
                    <TarjetaIdentidad perfil={perfil} />

                    <div className="flex flex-col gap-6">
                        <FormularioPerfil perfil={perfil} onGuardado={setPerfil} />

                        <Card>
                            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <KeyRound className="size-5" aria-hidden="true" />
                                    </span>
                                    <div className="flex flex-col gap-1">
                                        <CardTitle>Contraseña</CardTitle>
                                        <CardDescription>Cámbiala periódicamente y no la compartas.</CardDescription>
                                    </div>
                                </div>
                                <Button asChild variant="outline">
                                    <Link to="/seguridad">Cambiar contraseña</Link>
                                </Button>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};

export default Perfil;
