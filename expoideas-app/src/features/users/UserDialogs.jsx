import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { affiliationFromUser, affiliationToApi } from '@/lib/affiliation';
import { ROLES, ROLE_LABELS, assignableRoles, requiresAffiliation } from '@/lib/roles';
import { INSTITUTIONAL_DOMAIN, handleFormError } from '@/lib/validation';
import { FormDialog } from '@/components/forms/FormDialog';
import { PasswordFields } from '@/components/forms/PasswordFields';
import { PasswordRequirements } from '@/components/forms/PasswordRequirements';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { PasswordInput } from '@/components/ui/password-input';
import { AffiliationFields } from '@/features/catalogs/AffiliationFields';
import { useCreateUser, useResetPassword, useUpdateUser } from './queries';
import { affiliationSchema, newAccountSchemaFor, passwordResetSchema } from './schemas';

export function PasswordResetDialog({ user, onClose }) {
    const reset = useResetPassword();
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(passwordResetSchema),
        mode: 'onTouched',
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    const submit = async (passwords) => {
        try {
            await reset.mutateAsync({ id: user.id, passwords });
            toast.success(`Contraseña restablecida para ${user.email}`);
            onClose();
        } catch (error) {
            handleFormError(error, setError);
        }
    };

    return (
        <FormDialog
            title="Restablecer contraseña"
            description={`Nueva contraseña para ${user.firstName} ${user.lastName} (${user.email}). Compártela por un canal seguro: se le pedirá cambiarla al ingresar.`}
            onClose={onClose}
            onSubmit={handleSubmit(submit)}
            error={errors.root?.message}
            submitLabel="Restablecer"
            submitting={isSubmitting}
        >
            <PasswordFields form={{ register, control, errors }} />
        </FormDialog>
    );
}

export function AffiliationDialog({ user, onClose }) {
    const update = useUpdateUser();
    const form = useForm({ resolver: zodResolver(affiliationSchema), defaultValues: affiliationFromUser(user) });
    const {
        handleSubmit,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = form;

    const submit = async (values) => {
        try {
            await update.mutateAsync({ id: user.id, changes: affiliationToApi(values) });
            toast.success(`Adscripción de ${user.firstName} actualizada`);
            onClose();
        } catch (error) {
            handleFormError(error, setError);
        }
    };

    return (
        <FormDialog
            title="Editar adscripción"
            description={`Sede, facultad y programa de ${user.firstName} ${user.lastName}.`}
            onClose={onClose}
            onSubmit={handleSubmit(submit)}
            error={errors.root?.message}
            submitLabel="Guardar"
            submitting={isSubmitting}
            submitDisabled={!isDirty}
        >
            <AffiliationFields form={{ ...form, errors }} />
        </FormDialog>
    );
}

export function NewUserDialog({ actor, onClose }) {
    const create = useCreateUser();
    const allowedRoles = assignableRoles(actor);
    const form = useForm({
        // El esquema se arma con el rol elegido en cada validación.
        resolver: (values, context, options) => zodResolver(newAccountSchemaFor(values.role))(values, context, options),
        mode: 'onTouched',
        defaultValues: {
            // El caso más común es un jurado externo.
            role: allowedRoles.includes(ROLES.JUDGE) ? ROLES.JUDGE : allowedRoles[0],
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            campusId: '',
            facultyId: '',
            academicProgramId: '',
        },
    });
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = form;
    const [role, password] = useWatch({ control, name: ['role', 'password'] });

    const submit = async ({ campusId, facultyId, academicProgramId, ...values }) => {
        const body = {
            ...values,
            ...(requiresAffiliation(values.role) ? affiliationToApi({ campusId, facultyId, academicProgramId }) : {}),
        };
        try {
            const created = await create.mutateAsync(body);
            toast.success(`Cuenta de ${created.firstName} ${created.lastName} creada`);
            onClose();
        } catch (error) {
            if (error.status === 409) {
                setError('email', { type: 'server', message: error.message }, { shouldFocus: true });
            } else {
                handleFormError(error, setError);
            }
        }
    };

    return (
        <FormDialog
            title="Nueva cuenta"
            description="Para jurados externos o personas que necesitan otro rol. Los estudiantes pueden crear su cuenta por sí mismos."
            onClose={onClose}
            onSubmit={handleSubmit(submit)}
            error={errors.root?.message}
            submitLabel="Crear cuenta"
            submitting={isSubmitting}
        >
            <Field label="Rol" error={errors.role?.message} required>
                <NativeSelect {...register('role')}>
                    {allowedRoles.map((option) => (
                        <option key={option} value={option}>
                            {ROLE_LABELS[option]}
                        </option>
                    ))}
                </NativeSelect>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombres" error={errors.firstName?.message} required>
                    <Input autoComplete="off" {...register('firstName')} />
                </Field>
                <Field label="Apellidos" error={errors.lastName?.message} required>
                    <Input autoComplete="off" {...register('lastName')} />
                </Field>
            </div>
            <Field
                label="Correo"
                error={errors.email?.message}
                hint={
                    role === ROLES.JUDGE ? 'Puede ser personal o de su organización.' : `Debe terminar en ${INSTITUTIONAL_DOMAIN}`
                }
                required
            >
                <Input type="email" inputMode="email" autoComplete="off" {...register('email')} />
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
                <PasswordRequirements value={password} className="sm:grid-cols-1" />
            </div>
            {requiresAffiliation(role) && (
                <fieldset className="flex flex-col gap-4 rounded-lg border border-outline-variant/70 p-4">
                    <legend className="px-1 font-heading text-sm font-semibold text-on-surface">Adscripción académica</legend>
                    <AffiliationFields form={{ ...form, errors }} />
                </fieldset>
            )}
        </FormDialog>
    );
}
