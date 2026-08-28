import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import NetworkingSearch from './pages/NetworkingSearch';
import NetworkingSearchDirectivo from './pages/NetworkingSearchDirectivo';
import ProfileDetail from './pages/ProfileDetail';
import PerfilWizard from './components/PerfilWizard/PerfilWizard';
import AdminUsers from './pages/AdminUsers';
import Inicio from './pages/Inicio';
import Convocatorias from './pages/Convocatorias';
import ConvocatoriasDetalles from './pages/ConvocatoriasDetalles';
import MisConvocatorias from './pages/MisConvocatorias';
import ConvocatoriaForm from './pages/ConvocatoriaForm';
import CambioPasswordView from './pages/CambioPasswordView';
import GestionDatosMaestros from './pages/GestionDatosMaestros';
import Unauthorized from './pages/Unauthorized';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// ─── Roles ────────────────────────────────────────────────────────────────────
const ADMIN = 'ADMIN';
const DIRECTIVO = 'DIRECTIVO';
const PROFESOR = 'PROFESOR';

// Layout Component to handle persistent Navbar and Sidebar
const AppLayout = ({ children }) => {
  const location = useLocation();

  // MODIFICACIÓN: Usamos .includes o verificamos el final del path 
  // para que funcione con o sin el prefijo del servidor
  const isAuthPage = location.pathname.endsWith('/login') ||
    location.pathname.endsWith('/register') ||
    location.pathname.endsWith('/unauthorized');

  const isRootWithoutToken = (location.pathname === '/' || location.pathname === '/dattapro/')
    && !localStorage.getItem('token');

  if (isAuthPage || isRootWithoutToken) {
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

const RootRoute = () => {
  return localStorage.getItem('token') ? <Inicio /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    /* CAMBIO CRÍTICO: Añadir el basename aquí */
    <Router basename="/dattapro">
      <AppLayout>
        <Routes>
          {/* ── Rutas públicas ─────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── Inicio: todos los roles ────────────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <RootRoute />
              </ProtectedRoute>
            }
          />

          {/* ── Perfil (ver/editar): todos los roles ───────────────────── */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <PerfilWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil/ver/:id"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <ProfileDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Convocatorias: todos los roles ─────────────────────────── */}
          <Route
            path="/convocatorias"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <Convocatorias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/convocatorias/detalles/:id"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <ConvocatoriasDetalles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-convocatorias"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <MisConvocatorias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/convocatorias/crear"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <ConvocatoriaForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/convocatorias/editar/:id"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <ConvocatoriaForm />
              </ProtectedRoute>
            }
          />

          {/* ── Seguridad: todos los roles ─────────────────────────────── */}
          <Route
            path="/seguridad"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO, PROFESOR]}>
                <CambioPasswordView />
              </ProtectedRoute>
            }
          />

          {/* ── Networking (profesores): ADMIN queda excluido ──────────── */}
          <Route
            path="/network"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, PROFESOR]}>
                <NetworkingSearch />
              </ProtectedRoute>
            }
          />

          {/* ── Inteligencia académica: ADMIN + DIRECTIVO ──────────────── */}
          <Route
            path="/inteligencia-academica"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, DIRECTIVO]}>
                <NetworkingSearchDirectivo />
              </ProtectedRoute>
            }
          />

          {/* ── Administración: solo ADMIN ─────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[ADMIN]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/datos-maestros"
            element={
              <ProtectedRoute allowedRoles={[ADMIN]}>
                <GestionDatosMaestros />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
