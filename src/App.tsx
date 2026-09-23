import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { OperationsPage } from './pages/OperationsPage';
import { ShipmentCreatePage } from './pages/ShipmentCreatePage';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';
import { ClientsPage } from './pages/ClientsPage';
import { UsersPage } from './pages/UsersPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isInternal, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs">Verificando credenciales operativas...</span>
      </div>
    );
  }

  if (!session || !isInternal) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isInternal, loading } = useAuth();

  if (session && isInternal) {
    return <Navigate to="/operations" replace />;
  }

  // Solo mostrar loader en la carga inicial cuando no hay sesión definida
  if (loading && session === null) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Internal Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/operations" replace />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="shipments/new" element={<ShipmentCreatePage />} />
            <Route path="shipments/:id" element={<ShipmentDetailPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/operations" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
