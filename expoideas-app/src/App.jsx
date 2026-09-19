import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MANAGEMENT_ROLES } from '@/lib/roles';
import { ROUTES } from '@/lib/routes';
import { AppShell } from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/feedback';
import { GuestRoute } from '@/features/auth/GuestRoute';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

// Cada página se descarga cuando se visita por primera vez.
const HomePage = lazy(() => import('@/features/home/HomePage'));
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));
const OnboardingPage = lazy(() => import('@/features/auth/OnboardingPage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const SecurityPage = lazy(() => import('@/features/profile/SecurityPage'));
const UserAdminPage = lazy(() => import('@/features/users/UserAdminPage'));
const CatalogsPage = lazy(() => import('@/features/catalogs/CatalogsPage'));
const UnauthorizedPage = lazy(() => import('@/features/errors/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('@/features/errors/NotFoundPage'));

// El subdirectorio donde se sirve la app sale de la config de Vite (base).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
    return (
        <BrowserRouter basename={basename}>
            <Suspense fallback={<Spinner className="min-h-dvh" />}>
                <Routes>
                    {/* Acceso: pantalla completa, sin navegación */}
                    <Route
                        path={ROUTES.LOGIN}
                        element={
                            <GuestRoute>
                                <LoginPage />
                            </GuestRoute>
                        }
                    />
                    <Route
                        path={ROUTES.REGISTER}
                        element={
                            <GuestRoute>
                                <RegisterPage />
                            </GuestRoute>
                        }
                    />
                    {/* La página misma decide: sin sesión va al inicio de sesión y sin pendientes, al inicio. */}
                    <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />

                    <Route element={<AppShell />}>
                        {/* Públicas */}
                        <Route index element={<HomePage />} />
                        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

                        {/* Con sesión */}
                        <Route
                            path={ROUTES.PROFILE}
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.SECURITY}
                            element={
                                <ProtectedRoute>
                                    <SecurityPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Gestión: MacondoLab y administradores */}
                        <Route
                            path={ROUTES.USERS}
                            element={
                                <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                                    <UserAdminPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.CATALOGS}
                            element={
                                <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                                    <CatalogsPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}
