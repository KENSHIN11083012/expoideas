import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Inicio from './pages/Inicio';
import Perfil from './pages/Perfil';
import CambioPasswordView from './pages/CambioPasswordView';
import AdminUsers from './pages/AdminUsers';
import GestionDatosMaestros from './pages/GestionDatosMaestros';
import Unauthorized from './pages/Unauthorized';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { ROLES } from './utils/roles';

const TODOS = [ROLES.ADMIN, ROLES.DOCENTE, ROLES.EMPRENDEDOR, ROLES.MENTOR, ROLES.VISITANTE];

/** Rutas que se muestran sin el chrome de la app. */
const RUTAS_SIN_LAYOUT = ['/login', '/register', '/unauthorized'];

const AppLayout = ({ children }) => {
    const location = useLocation();
    const { token } = useAuth();

    const esPaginaDeAuth = RUTAS_SIN_LAYOUT.includes(location.pathname);

    if (esPaginaDeAuth || !token) {
        return <main className="min-h-screen bg-slate-50 dark:bg-slate-900">{children}</main>;
    }

    return (
        <div className="h-screen bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

// El basename sale de la config de Vite (base), asi no hay dos sitios que
// mantener sincronizados como pasaba en Dattapro.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

function App() {
    return (
        <Router basename={basename}>
            <AppLayout>
                <Routes>
                    {/* Publicas */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Sesion iniciada */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute allowedRoles={TODOS}>
                                <Inicio />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/perfil"
                        element={
                            <ProtectedRoute allowedRoles={TODOS}>
                                <Perfil />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/seguridad"
                        element={
                            <ProtectedRoute allowedRoles={TODOS}>
                                <CambioPasswordView />
                            </ProtectedRoute>
                        }
                    />

                    {/* Administracion */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                <AdminUsers />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/datos-maestros"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                <GestionDatosMaestros />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AppLayout>
        </Router>
    );
}

export default App;
