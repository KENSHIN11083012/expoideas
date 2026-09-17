import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { put } from '@/services/apiClient';
import { aplicarErroresDelServidor } from '@/utils/validaciones';
import { cambioPasswordSchema } from '@/schemas/usuario';
import { PageContainer } from '@/components/layout/AppShell';
import { RequisitosPassword } from '@/components/forms/RequisitosPassword';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';

const VACIO = { passwordActual: '', passwordNueva: '', confirmacionPassword: '' };

const CONSEJOS = [
    'Usa una contraseña que no uses en otros sitios.',
    'Combina palabras, números y símbolos: la longitud importa más que la complejidad.',
    'Si crees que alguien la conoce, cámbiala de inmediato.',
];

/**
 * Cambio de la propia contraseña. El restablecimiento de contraseñas de otros
 * usuarios está en Administración > Usuarios.
 */
const Seguridad = () => {
    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(cambioPasswordSchema), mode: 'onTouched', defaultValues: VACIO });
    const passwordNueva = useWatch({ control, name: 'passwordNueva' });

    const onSubmit = async (datos) => {
        try {
            await put('/usuarios/me/password', datos);
            reset(VACIO);
            toast.success('Tu contraseña se actualizó');
        } catch (error) {
            if (aplicarErroresDelServidor(error, setError)) return;
            // "La contraseña actual es incorrecta" llega como mensaje general del 400.
            if (error.status === 400 && /actual/i.test(error.message)) {
                setError('passwordActual', { type: 'server', message: error.message }, { shouldFocus: true });
                return;
            }
            toast.error(error.message);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                eyebrow="Mi cuenta"
                title="Seguridad"
                description="Actualiza la contraseña con la que ingresas a Expoideas."
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <Card>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <CardHeader>
                            <CardTitle>Cambiar contraseña</CardTitle>
                            <CardDescription>Por seguridad, primero confirma tu contraseña actual.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <Field label="Contraseña actual" error={errors.passwordActual?.message} required>
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
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button type="submit" loading={isSubmitting}>Actualizar contraseña</Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card acento="lima" className="h-fit">
                    <CardHeader>
                        <span className="flex size-10 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-fixed">
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        </span>
                        <CardTitle as="h2" className="mt-2">Buenas prácticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="flex flex-col gap-3 text-sm text-on-surface-variant">
                            {CONSEJOS.map((consejo) => (
                                <li key={consejo} className="flex gap-2">
                                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                                    {consejo}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
};

export default Seguridad;
