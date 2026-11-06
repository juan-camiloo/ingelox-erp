import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { OperationsPage } from './pages/OperationsPage';
import { ShipmentCreatePage } from './pages/ShipmentCreatePage';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';
import { ClientsPage } from './pages/ClientsPage';
import { UsersPage } from './pages/UsersPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { QuotationCreatePage } from './pages/QuotationCreatePage';
import { InstructionsPage } from './pages/InstructionsPage';
import { InstructionCreatePage } from './pages/InstructionCreatePage';
import { ThirdPartiesPage } from './pages/ThirdPartiesPage';
import { BillingConceptsPage } from './pages/BillingConceptsPage';
import AwbListPage from './pages/AwbListPage';
import AwbCreatePage from './pages/AwbCreatePage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isInternal, loading, profile, accessDeniedError } = useAuth();

  // Si ya tenemos sesión y perfil interno verificado, renderizar de inmediato sin desmontar el árbol
  if (session && isInternal && profile) {
    return <>{children}</>;
  }

  if (loading || (session && profile === null && !accessDeniedError)) {
    return (
      <div className="min-h-screen w-full bg-slate-950 [html:not(.dark)_&]:bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400 [html:not(.dark)_&]:text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs">Cargando Ingelox ERP...</span>
      </div>
    );
  }

  if (!session || !isInternal) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isInternal, loading, profile } = useAuth();

  if (session && isInternal) {
    return <Navigate to="/operations" replace />;
  }

  // Mostrar loader durante la carga inicial o mientras se resuelve el perfil de una sesión entrante
  if (loading && (session === null || profile === null)) {
    return (
      <div className="min-h-screen w-full bg-slate-950 [html:not(.dark)_&]:bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400 [html:not(.dark)_&]:text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return <>{children}</>;
};

export function App() {
  return (
    <ThemeProvider>
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
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="quotations/new" element={<QuotationCreatePage />} />
              <Route path="instructions" element={<InstructionsPage />} />
              <Route path="instructions/new" element={<InstructionCreatePage />} />
              <Route path="awb" element={<AwbListPage />} />
              <Route path="awb/new" element={<AwbCreatePage />} />
              <Route path="third-parties" element={<ThirdPartiesPage />} />
              <Route path="billing-concepts" element={<BillingConceptsPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/operations" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
