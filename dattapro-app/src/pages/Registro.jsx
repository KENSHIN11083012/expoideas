import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { post } from '@/services/apiClient';
import { aplicarErroresDelServidor, DOMINIO_INSTITUCIONAL } from '@/utils/validaciones';
import { registroSchema } from '@/schemas/auth';
import { adscripcionParaApi, aplicarErrorDePrograma } from '@/schemas/adscripcion';
import { useCatalogosAdscripcion } from '@/hooks/useCatalogosAdscripcion';
import { CamposAdscripcion } from '@/components/forms/CamposAdscripcion';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { RequisitosPassword } from '@/components/forms/RequisitosPassword';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert } from '@/components/ui/feedback';

const Registro = () => {
    const navigate = useNavigate();
    const [errorGeneral, setErrorGeneral] = useState('');

    const catalogos = useCatalogosAdscripcion();
    const {
        register,
        control,
        handleSubmit,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registroSchema),
        mode: 'onTouched',
        defaultValues: {
            nombres: '',
            apellidos: '',
            correoInstitucional: '',
            password: '',
            confirmPassword: '',
            sedeId: '',
            facultadId: '',
            programaAcademicoId: '',
            autorizaDatos: false,
        },
    });
    const password = useWatch({ control, name: 'password' });

    const onSubmit = async ({ confirmPassword, sedeId, facultadId, programaAcademicoId, ...datos }) => {
        setErrorGeneral('');
        try {
            const cuerpo = { ...datos, ...adscripcionParaApi({ sedeId, facultadId, programaAcademicoId }) };
            await post('/usuarios/registro', cuerpo, { auth: false });
            navigate('/login', {
                state: { message: 'Tu cuenta fue creada. Ya puedes iniciar sesión.', email: datos.correoInstitucional },
            });
        } catch (error) {
            if (error.status === 409) {
                setError('correoInstitucional', { type: 'server', message: error.message }, { shouldFocus: true });
            } else if (!aplicarErroresDelServidor(error, setError) && !aplicarErrorDePrograma(error, setError)) {
                setErrorGeneral(error.message);
            }
        }
    };

    return (
        <AuthLayout
            titulo="Crear cuenta"
            panelTitulo="Tu idea merece más que una presentación de clase"
            panelTexto="Crea tu cuenta con el correo institucional para postular proyectos, recibir evaluación de jurados y darlos a conocer."
        >
            <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-primary">Nueva cuenta</p>
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Crea tu cuenta</h1>
                <p className="text-on-surface-variant">Solo para la comunidad de la Universidad Simón Bolívar.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
                {errorGeneral && <Alert variant="error" title={errorGeneral} />}

                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nombres" error={errors.nombres?.message} required>
                        <Input autoComplete="given-name" {...register('nombres')} />
                    </Field>
                    <Field label="Apellidos" error={errors.apellidos?.message} required>
                        <Input autoComplete="family-name" {...register('apellidos')} />
                    </Field>
                </div>

                <Field
                    label="Correo institucional"
                    error={errors.correoInstitucional?.message}
                    hint={`Debe terminar en ${DOMINIO_INSTITUCIONAL}`}
                    required
                >
                    <Input
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder={`nombre${DOMINIO_INSTITUCIONAL}`}
                        {...register('correoInstitucional')}
                    />
                </Field>

                <fieldset className="flex flex-col gap-4 rounded-lg border border-outline-variant/70 p-4">
                    <legend className="px-1 font-heading text-sm font-semibold text-on-surface">Tu vínculo con la universidad</legend>
                    <CamposAdscripcion form={{ register, control, setValue, errors }} catalogos={catalogos} />
                </fieldset>

                <div className="flex flex-col gap-2">
                    <Field label="Contraseña" error={errors.password?.message} required>
                        <PasswordInput autoComplete="new-password" {...register('password')} />
                    </Field>
                    <RequisitosPassword valor={password} />
                </div>

                <Field label="Confirmar contraseña" error={errors.confirmPassword?.message} required>
                    <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
                </Field>

                <Controller
                    control={control}
                    name="autorizaDatos"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-start gap-3 rounded-lg border border-outline-variant/70 bg-surface-container-low p-4">
                                <Checkbox
                                    id="autorizaDatos"
                                    checked={field.value}
                                    onCheckedChange={(valor) => field.onChange(valor === true)}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    aria-invalid={fieldState.error ? true : undefined}
                                    aria-describedby={fieldState.error ? 'autorizaDatos-error' : undefined}
                                    className="mt-0.5"
                                />
                                <label htmlFor="autorizaDatos" className="text-sm leading-relaxed text-on-surface">
                                    Autorizo a la Universidad Simón Bolívar el tratamiento de mis datos personales conforme a la
                                    Ley 1581 de 2012.
                                </label>
                            </div>
                            {fieldState.error && (
                                <p id="autorizaDatos-error" role="alert" className="text-xs font-medium text-error">
                                    {fieldState.error.message}
                                </p>
                            )}
                        </div>
                    )}
                />

                <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
                    {isSubmitting ? 'Creando cuenta…' : <>Crear cuenta <ArrowRight /></>}
                </Button>

                <p className="text-center text-sm text-on-surface-variant">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default Registro;
