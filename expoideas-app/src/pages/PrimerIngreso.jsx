import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { put } from '@/services/apiClient';
import { homePathForRole } from '@/utils/roles';
import { aplicarErroresDelServidor } from '@/utils/validaciones';
import { autorizacionDatosSchema, cambioPasswordSchema } from '@/schemas/usuario';
import { cn } from '@/lib/utils';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { CampoAutorizacionDatos } from '@/components/forms/CampoAutorizacionDatos';
import { RequisitosPassword } from '@/components/forms/RequisitosPassword';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert } from '@/components/ui/feedback';

/** Pasos que conoce la app, en el orden en que se piden (el mismo de la API). */
const PASOS = {
    cambiarPassword: {
        titulo: 'Crea tu contraseña',
        descripcion: 'La contraseña que recibiste es temporal. Elige una propia para proteger tu cuenta.',
    },
    autorizarDatos: {
        titulo: 'Autoriza el tratamiento de tus datos',
        descripcion: 'Para usar Expoideas, la Universidad Simón Bolívar necesita tu autorización para tratar tus datos personales.',
    },
};

function PasoCambiarPassword({ onCompletado }) {
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(cambioPasswordSchema),
        mode: 'onTouched',
        defaultValues: { passwordActual: '', passwordNueva: '', confirmacionPassword: '' },
    });
    const passwordNueva = useWatch({ control, name: 'passwordNueva' });

    const onSubmit = async (datos) => {
        try {
            await put('/usuarios/me/password', datos);
            onCompletado();
        } catch (error) {
            if (aplicarErroresDelServidor(error, setError)) return;
            // "La contraseña actual es incorrecta" llega como mensaje general del 400.
            if (error.status === 400 && /actual/i.test(error.message)) {
                setError('passwordActual', { type: 'server', message: error.message }, { shouldFocus: true });
                return;
            }
            setError('root', { type: 'server', message: error.message });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {errors.root && <Alert variant="error" title={errors.root.message} />}
            <Field
                label="Contraseña temporal"
                hint="La que te entregó MacondoLab o la administración."
                error={errors.passwordActual?.message}
                required
            >
                <PasswordInput autoComplete="current-password" {...register('passwordActual')} />
            </Field>
            <div className="flex flex-col gap-2">
                <Field label="Nueva contraseña" error={errors.passwordNueva?.message} required>
                    <PasswordInput autoComplete="new-password" {...register('passwordNueva')} />
                </Field>
                <RequisitosPassword valor={passwordNueva} />
            </div>
            <Field label="Confirmar nueva contraseña" error={errors.confirmacionPassword?.message} required>
                <PasswordInput autoComplete="new-password" {...register('confirmacionPassword')} />
            </Field>
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
                Guardar y continuar <ArrowRight />
            </Button>
        </form>
    );
}

function PasoAutorizarDatos({ onCompletado }) {
    const {
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(autorizacionDatosSchema), defaultValues: { autorizaDatos: false } });

    const onSubmit = async () => {
        try {
            await put('/usuarios/me/autorizacion-datos', { autorizaDatos: true });
            onCompletado();
        } catch (error) {
            if (!aplicarErroresDelServidor(error, setError)) {
                setError('root', { type: 'server', message: error.message });
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {errors.root && <Alert variant="error" title={errors.root.message} />}
            <CampoAutorizacionDatos control={control} />
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                Aceptar y continuar <ArrowRight />
            </Button>
        </form>
    );
}

/**
 * Primer ingreso de una cuenta con pasos pendientes (contraseña temporal,
 * autorización de datos). La API no deja hacer nada más hasta completarlos.
 * Al terminar el último, la sesión queda sin pendientes y la página lleva al
 * inicio que corresponde al rol.
 */
const PrimerIngreso = () => {
    const { token, role, user, pendientes = [], completarPendiente, logout } = useAuth();
    const navigate = useNavigate();
    const pasos = Object.keys(PASOS).filter((paso) => pendientes.includes(paso));
    // Cuántos pasos había al entrar, para mostrar "Paso 2 de 2" tras completar el primero.
    const [totalPasos] = useState(pasos.length);

    if (!token) return <Navigate to="/login" replace />;
    if (pasos.length === 0) return <Navigate to={homePathForRole(role)} replace />;

    const paso = pasos[0];
    const numero = Math.max(totalPasos, pasos.length) - pasos.length + 1;
    const total = Math.max(totalPasos, pasos.length);

    const completar = () => {
        if (pasos.length === 1) toast.success('Todo listo. Ya puedes usar Expoideas.');
        completarPendiente(paso);
    };

    const cerrarSesion = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <AuthLayout
            titulo="Primer ingreso"
            panelTitulo="Te damos la bienvenida a Expoideas"
            panelTexto="Antes de empezar, asegura tu cuenta y autoriza el uso de tus datos. Solo se hace una vez."
        >
            <div className="flex flex-col gap-3">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-primary">
                    Primer ingreso · Paso {numero} de {total}
                </p>
                <div className="flex gap-2" aria-hidden="true">
                    {Array.from({ length: total }, (_, indice) => (
                        <span
                            key={indice}
                            className={cn('h-1.5 flex-1 rounded-full', indice < numero ? 'bg-primary' : 'bg-outline-variant')}
                        />
                    ))}
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{PASOS[paso].titulo}</h1>
                <p className="text-on-surface-variant">{PASOS[paso].descripcion}</p>
            </div>

            <div className="mt-8">
                {paso === 'cambiarPassword'
                    ? <PasoCambiarPassword key={paso} onCompletado={completar} />
                    : <PasoAutorizarDatos key={paso} onCompletado={completar} />}
            </div>

            <p className="mt-6 text-center text-sm text-on-surface-variant">
                {user?.nombreCompleto ? `¿No eres ${user.nombreCompleto}? ` : ''}
                <button type="button" onClick={cerrarSesion} className="font-semibold text-primary underline-offset-4 hover:underline">
                    Cerrar sesión
                </button>
            </p>
        </AuthLayout>
    );
};

export default PrimerIngreso;
