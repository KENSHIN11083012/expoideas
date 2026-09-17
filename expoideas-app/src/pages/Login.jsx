import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jwtDecode } from 'jwt-decode';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { post } from '@/services/apiClient';
import { homePathForRole, normalizeRole, RUTA_PRIMER_INGRESO, roleFromToken } from '@/utils/roles';
import { DOMINIO_INSTITUCIONAL } from '@/utils/validaciones';
import { loginSchema } from '@/schemas/auth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert } from '@/components/ui/feedback';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [errorGeneral, setErrorGeneral] = useState('');

    // El registro llega aquí con un mensaje y el correo recién creado.
    const mensajeRegistro = location.state?.message;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: location.state?.email ?? '', password: '' },
    });

    const onSubmit = async ({ email, password }) => {
        setErrorGeneral('');
        try {
            const data = await post('/auth/login', { email, password }, { auth: false });
            const rol = roleFromToken(jwtDecode(data.token)) ?? normalizeRole(data.rol);
            const name = [data.nombres, data.apellidos].filter(Boolean).join(' ');
            const pendientes = data.pendientes ?? [];
            login(data.token, { id: data.id, email, name, fotoId: data.fotoId ?? null }, rol, pendientes);

            // Primero el primer ingreso; si no, vuelve a la página protegida de la que venía.
            const destino = pendientes.length > 0
                ? RUTA_PRIMER_INGRESO
                : location.state?.from?.pathname ?? homePathForRole(rol);
            navigate(destino, { replace: true });
        } catch (error) {
            setErrorGeneral(error.message);
        }
    };

    return (
        <AuthLayout
            titulo="Iniciar sesión"
            panelTitulo="Las ideas de la Unisimón, a la vista de todos"
            panelTexto="Donde los proyectos de INNPRENDE I y II se inscriben, se evalúan con jurados y quedan como evidencia."
        >
            <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-primary">Acceso institucional</p>
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Bienvenido de nuevo</h1>
                <p className="text-on-surface-variant">Ingresa con tu correo {DOMINIO_INSTITUCIONAL}.</p>
            </div>

            <div className="mt-8 flex flex-col gap-5">
                {mensajeRegistro && !errorGeneral && <Alert variant="success" title={mensajeRegistro} />}
                {errorGeneral && <Alert variant="error" title={errorGeneral} />}

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                    <Field label="Correo institucional" error={errors.email?.message} required>
                        <Input
                            type="email"
                            autoComplete="username"
                            inputMode="email"
                            placeholder={`nombre${DOMINIO_INSTITUCIONAL}`}
                            {...register('email')}
                        />
                    </Field>

                    <Field label="Contraseña" error={errors.password?.message} required>
                        <PasswordInput autoComplete="current-password" {...register('password')} />
                    </Field>

                    <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
                        {isSubmitting ? 'Ingresando…' : <>Iniciar sesión <ArrowRight /></>}
                    </Button>
                </form>

                <p className="text-center text-sm text-on-surface-variant">
                    ¿Aún no tienes cuenta?{' '}
                    <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                        Crea tu cuenta
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Login;
