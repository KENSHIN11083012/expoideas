import { useDeferredValue, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RotateCw, UserPlus, UserX, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { ROLES, ROLE_LABELS, isManagement } from '@/lib/roles';
import { normalizeText } from '@/lib/text';
import { PageContainer } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { NativeSelect } from '@/components/ui/native-select';
import { SearchInput } from '@/components/ui/search-input';
import { AffiliationDialog, NewUserDialog, PasswordResetDialog } from './UserDialogs';
import { UserList } from './UserList';
import { useDeleteUser, useUpdateUser, useUsers } from './queries';

/** Lo que implica cada rol de gestión, para confirmarlo antes de otorgarlo. */
const MANAGEMENT_SCOPE = {
    [ROLES.MACONDOLAB]: 'Podrá gestionar las cuentas de estudiantes, docentes y jurados, y la clasificación de proyectos.',
    [ROLES.ADMIN]: 'Tendrá acceso completo a la plataforma, incluidas las cuentas de gestión y la estructura institucional.',
};

function LoadingUsers() {
    return (
        <div className="flex flex-col gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
        </div>
    );
}

export default function UserAdminPage() {
    const { user: me, role: actor } = useAuth();
    const { data: users = [], isPending, isFetching, error, refetch } = useUsers();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [dialog, setDialog] = useState(null); // { type: 'new' | 'affiliation' | 'password', user? }
    const [roleGrant, setRoleGrant] = useState(null); // { user, role }
    const [toDelete, setToDelete] = useState(null);
    const deferredSearch = useDeferredValue(search);

    const filtered = useMemo(() => {
        const term = normalizeText(deferredSearch.trim());
        return users.filter(
            (user) =>
                (!term || normalizeText(`${user.firstName} ${user.lastName} ${user.email}`).includes(term)) &&
                (!roleFilter || user.role === roleFilter),
        );
    }, [users, deferredSearch, roleFilter]);

    const isOwn = (user) => user.email?.toLowerCase() === me?.email?.toLowerCase();
    const isBusy = (user) => updateUser.isPending && updateUser.variables?.id === user.id;
    const hasFilters = Boolean(search || roleFilter);

    const changeRole = (user, role) =>
        updateUser.mutate(
            { id: user.id, changes: { role } },
            {
                onSuccess: () => toast.success(`Rol de ${user.firstName} actualizado`),
                onError: (changeError) => toast.error(changeError.message),
            },
        );

    // Otorgar un rol de gestión se confirma; los demás cambios se aplican directo.
    const onRoleChange = (user, role) => (isManagement(role) ? setRoleGrant({ user, role }) : changeRole(user, role));

    const confirmDelete = () =>
        deleteUser.mutate(toDelete.id, {
            onSuccess: () => toast.success(`${toDelete.firstName} ${toDelete.lastName} fue eliminado`),
            onError: (deleteError) => toast.error(deleteError.message),
        });

    const closeDialog = () => setDialog(null);

    return (
        <PageContainer>
            <PageHeader
                eyebrow="Gestión"
                title="Usuarios"
                description="Consulta las cuentas, asigna roles, crea cuentas para jurados y restablece contraseñas."
                actions={
                    <>
                        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                            <RotateCw className={isFetching ? 'animate-spin' : undefined} /> Actualizar
                        </Button>
                        <Button onClick={() => setDialog({ type: 'new' })}>
                            <UserPlus /> Nueva cuenta
                        </Button>
                    </>
                }
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchInput
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre o correo"
                    label="Buscar usuarios"
                    className="flex-1"
                />
                <NativeSelect
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    aria-label="Filtrar por rol"
                    className="sm:w-52"
                >
                    <option value="">Todos los roles</option>
                    {Object.values(ROLES).map((role) => (
                        <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                        </option>
                    ))}
                </NativeSelect>
                {!isPending && (
                    <Badge variant="outline" mono className="self-start sm:self-center" aria-live="polite">
                        {filtered.length} de {users.length}
                    </Badge>
                )}
            </div>

            {error ? (
                <ErrorState title="No pudimos cargar los usuarios" error={error} onRetry={refetch} />
            ) : isPending ? (
                <LoadingUsers />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={hasFilters ? UserX : Users}
                    title={hasFilters ? 'Sin resultados' : 'Aún no hay usuarios'}
                    description={
                        hasFilters
                            ? 'Prueba con otro nombre, correo o rol.'
                            : 'Las cuentas aparecerán aquí cuando alguien se registre.'
                    }
                    action={
                        hasFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearch('');
                                    setRoleFilter('');
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        )
                    }
                />
            ) : (
                <UserList
                    users={filtered}
                    actor={actor}
                    isOwn={isOwn}
                    isBusy={isBusy}
                    handlers={{
                        onRoleChange,
                        onEditAffiliation: (user) => setDialog({ type: 'affiliation', user }),
                        onResetPassword: (user) => setDialog({ type: 'password', user }),
                        onDelete: setToDelete,
                    }}
                />
            )}

            {dialog?.type === 'new' && <NewUserDialog actor={actor} onClose={closeDialog} />}
            {dialog?.type === 'affiliation' && <AffiliationDialog user={dialog.user} onClose={closeDialog} />}
            {dialog?.type === 'password' && <PasswordResetDialog user={dialog.user} onClose={closeDialog} />}

            <ConfirmDialog
                open={Boolean(roleGrant)}
                title={`¿Dar el rol ${ROLE_LABELS[roleGrant?.role]} a ${roleGrant?.user.firstName} ${roleGrant?.user.lastName}?`}
                description={MANAGEMENT_SCOPE[roleGrant?.role]}
                confirmLabel="Dar el rol"
                onConfirm={() => changeRole(roleGrant.user, roleGrant.role)}
                onClose={() => setRoleGrant(null)}
            />

            <ConfirmDialog
                open={Boolean(toDelete)}
                title={`¿Eliminar a ${toDelete?.firstName} ${toDelete?.lastName}?`}
                description={`Se borrará la cuenta ${toDelete?.email}. Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </PageContainer>
    );
}
