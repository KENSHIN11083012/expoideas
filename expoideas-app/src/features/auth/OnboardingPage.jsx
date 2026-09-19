import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { ROUTES, homeRouteFor } from '@/lib/routes';
import { handleFormError } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DataConsentField } from '@/components/forms/DataConsentField';
import { PasswordFields } from '@/components/forms/PasswordFields';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert } from '@/components/ui/feedback';
import { accountApi } from './api';
import { dataConsentSchema, passwordChangeSchema } from './schemas';
import { useAuth } from './useAuth';

/** Pasos que conoce la app, en el orden en que se piden (el mismo de la API). */
const ONBOARDING_STEPS = {
    CHANGE_PASSWORD: {
        title: 'Crea tu contraseña',
        description: 'La contraseña que recibiste es temporal. Elige una propia para proteger tu cuenta.',
    },
    DATA_CONSENT: {
        title: 'Autoriza el tratamiento de tus datos',
        description:
            'Para usar Expoideas, la Universidad Simón Bolívar necesita tu autorización para tratar tus datos personales.',
    },
};

function ChangePasswordStep({ onDone }) {
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(passwordChangeSchema),
        mode: 'onTouched',
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    const submit = async (values) => {
        try {
            await accountApi.changePassword(values);
            onDone();
        } catch (error) {
            handleFormError(error, setError);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
            {errors.root && <Alert variant="error" title={errors.root.message} />}
            <Field
                label="Contraseña temporal"
                hint="La que te entregó MacondoLab o la administración."
                error={errors.currentPassword?.message}
                required
            >
                <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
            </Field>
            <PasswordFields form={{ register, control, errors }} />
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
                Guardar y continuar <ArrowRight />
            </Button>
        </form>
    );
}

function DataConsentStep({ onDone }) {
    const {
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(dataConsentSchema), defaultValues: { dataConsent: false } });

    const submit = async () => {
        try {
            await accountApi.giveDataConsent();
            onDone();
        } catch (error) {
            handleFormError(error, setError);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
            {errors.root && <Alert variant="error" title={errors.root.message} />}
            <DataConsentField control={control} />
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                Aceptar y continuar <ArrowRight />
            </Button>
        </form>
    );
}

/**
 * Primer ingreso de una cuenta con pasos pendientes (contraseña temporal,
 * autorización de datos). La API no deja hacer nada más hasta completarlos. Al
 * terminar el último, la sesión queda sin pendientes y la página lleva al inicio
 * que corresponde al rol.
 */
export default function OnboardingPage() {
    const { token, role, user, pendingSteps, completeStep, logout } = useAuth();
    const navigate = useNavigate();
    const steps = Object.keys(ONBOARDING_STEPS).filter((step) => pendingSteps.includes(step));
    // Cuántos pasos había al entrar, para mostrar "Paso 2 de 2" tras completar el primero.
    const [initialTotal] = useState(steps.length);

    if (!token) return <Navigate to={ROUTES.LOGIN} replace />;
    if (steps.length === 0) return <Navigate to={homeRouteFor(role)} replace />;

    const step = steps[0];
    const total = Math.max(initialTotal, steps.length);
    const current = total - steps.length + 1;

    const complete = () => {
        if (steps.length === 1) toast.success('Todo listo. Ya puedes usar Expoideas.');
        completeStep(step);
    };

    const signOut = () => {
        logout();
        navigate(ROUTES.LOGIN, { replace: true });
    };

    return (
        <AuthLayout
            title="Primer ingreso"
            panelTitle="Te damos la bienvenida a Expoideas"
            panelText="Antes de empezar, asegura tu cuenta y autoriza el uso de tus datos. Solo se hace una vez."
        >
            <div className="flex flex-col gap-3">
                <p className="label-mono text-primary">
                    Primer ingreso · Paso {current} de {total}
                </p>
                <div className="flex gap-2" aria-hidden="true">
                    {Array.from({ length: total }, (_, index) => (
                        <span
                            key={index}
                            className={cn('h-1.5 flex-1 rounded-full', index < current ? 'bg-primary' : 'bg-outline-variant')}
                        />
                    ))}
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{ONBOARDING_STEPS[step].title}</h1>
                <p className="text-on-surface-variant">{ONBOARDING_STEPS[step].description}</p>
            </div>

            <div className="mt-8">
                {step === 'CHANGE_PASSWORD' ? (
                    <ChangePasswordStep key={step} onDone={complete} />
                ) : (
                    <DataConsentStep key={step} onDone={complete} />
                )}
            </div>

            <p className="mt-6 text-center text-sm text-on-surface-variant">
                {user?.fullName ? `¿No eres ${user.fullName}? ` : ''}
                <button type="button" onClick={signOut} className="font-semibold text-primary underline-offset-4 hover:underline">
                    Cerrar sesión
                </button>
            </p>
        </AuthLayout>
    );
}
