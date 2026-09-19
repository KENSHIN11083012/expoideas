import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { affiliationToApi } from '@/lib/affiliation';
import { ROUTES } from '@/lib/routes';
import { INSTITUTIONAL_DOMAIN, handleFormError } from '@/lib/validation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeading } from '@/components/layout/AuthHeading';
import { DataConsentField } from '@/components/forms/DataConsentField';
import { PasswordFields } from '@/components/forms/PasswordFields';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/feedback';
import { AffiliationFields } from '@/features/catalogs/AffiliationFields';
import { authApi } from './api';
import { registrationSchema } from './schemas';

export default function RegisterPage() {
    const navigate = useNavigate();
    const form = useForm({
        resolver: zodResolver(registrationSchema),
        mode: 'onTouched',
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            campusId: '',
            facultyId: '',
            academicProgramId: '',
            dataConsent: false,
        },
    });
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = form;

    const submit = async ({ confirmPassword: _, campusId, facultyId, academicProgramId, ...values }) => {
        try {
            await authApi.register({ ...values, ...affiliationToApi({ campusId, facultyId, academicProgramId }) });
            navigate(ROUTES.LOGIN, {
                state: { message: 'Tu cuenta fue creada. Ya puedes iniciar sesión.', email: values.email },
            });
        } catch (error) {
            if (error.status === 409) {
                setError('email', { type: 'server', message: error.message }, { shouldFocus: true });
            } else {
                handleFormError(error, setError);
            }
        }
    };

    return (
        <AuthLayout
            title="Crear cuenta"
            panelTitle="Tu idea merece más que una presentación de clase"
            panelText="Crea tu cuenta con el correo institucional para inscribir tus proyectos, subir tus entregables y consultar tu evaluación."
        >
            <AuthHeading eyebrow="Nueva cuenta" title="Crea tu cuenta">
                Solo para la comunidad de la Universidad Simón Bolívar.
            </AuthHeading>

            <form onSubmit={handleSubmit(submit)} noValidate className="mt-8 flex flex-col gap-5">
                {errors.root && <Alert variant="error" title={errors.root.message} />}

                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nombres" error={errors.firstName?.message} required>
                        <Input autoComplete="given-name" {...register('firstName')} />
                    </Field>
                    <Field label="Apellidos" error={errors.lastName?.message} required>
                        <Input autoComplete="family-name" {...register('lastName')} />
                    </Field>
                </div>

                <Field
                    label="Correo institucional"
                    error={errors.email?.message}
                    hint={`Debe terminar en ${INSTITUTIONAL_DOMAIN}`}
                    required
                >
                    <Input
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder={`nombre${INSTITUTIONAL_DOMAIN}`}
                        {...register('email')}
                    />
                </Field>

                <fieldset className="flex flex-col gap-4 rounded-lg border border-outline-variant/70 p-4">
                    <legend className="px-1 font-heading text-sm font-semibold text-on-surface">
                        Tu vínculo con la universidad
                    </legend>
                    <AffiliationFields form={{ ...form, errors }} />
                </fieldset>

                <PasswordFields form={{ register, control, errors }} name="password" label="Contraseña" />

                <DataConsentField control={control} />

                <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
                    Crear cuenta <ArrowRight />
                </Button>

                <p className="text-center text-sm text-on-surface-variant">
                    ¿Ya tienes cuenta?{' '}
                    <Link to={ROUTES.LOGIN} className="font-semibold text-primary underline-offset-4 hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
