import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/feedback';
import { useAuth } from '@/hooks/useAuth';
import { homePathForRole, ROLES_DE_GESTION } from '@/utils/roles';

// Cada página se descarga cuando se visita por primera vez.
const Inicio = lazy(() => import('@/pages/Inicio'));
const Login = lazy(() => import('@/pages/Login'));
const Registro = lazy(() => import('@/pages/Registro'));
const Perfil = lazy(() => import('@/pages/Perfil'));
const Seguridad = lazy(() => import('@/pages/Seguridad'));
const AdminUsuarios = lazy(() => import('@/pages/AdminUsuarios'));
const Catalogos = lazy(() => import('@/pages/Catalogos'));
const NoAutorizado = lazy(() => import('@/pages/NoAutorizado'));
const NoEncontrado = lazy(() => import('@/pages/NoEncontrado'));

// El basename sale de la config de Vite (base), asi no hay dos sitios que
// mantener sincronizados como pasaba en Dattapro.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Login y registro no tienen sentido con sesión iniciada. */
function SoloInvitados({ children }) {
    const { token, role } = useAuth();
    return token ? <Navigate to={homePathForRole(role)} replace /> : children;
}

function App() {
    return (
        <BrowserRouter basename={basename}>
            <Suspense fallback={<Spinner className="min-h-dvh" />}>
                <Routes>
                    {/* Acceso: pantalla completa, sin navegación */}
                    <Route path="/login" element={<SoloInvitados><Login /></SoloInvitados>} />
                    <Route path="/register" element={<SoloInvitados><Registro /></SoloInvitados>} />

                    <Route element={<AppShell />}>
                        {/* Públicas */}
                        <Route index element={<Inicio />} />
                        <Route path="unauthorized" element={<NoAutorizado />} />

                        {/* Con sesión */}
                        <Route path="perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                        <Route path="seguridad" element={<ProtectedRoute><Seguridad /></ProtectedRoute>} />

                        {/* Gestión: MacondoLab y administradores */}
                        <Route
                            path="admin/usuarios"
                            element={<ProtectedRoute allowedRoles={ROLES_DE_GESTION}><AdminUsuarios /></ProtectedRoute>}
                        />
                        <Route
                            path="admin/catalogos"
                            element={<ProtectedRoute allowedRoles={ROLES_DE_GESTION}><Catalogos /></ProtectedRoute>}
                        />
                        {/* Rutas anteriores del panel */}
                        <Route path="admin" element={<Navigate to="/admin/usuarios" replace />} />
                        <Route path="admin/datos-maestros" element={<Navigate to="/admin/catalogos" replace />} />

                        <Route path="*" element={<NoEncontrado />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
