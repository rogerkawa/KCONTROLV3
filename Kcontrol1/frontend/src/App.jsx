import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout/DashboardLayout";

import Login from "./pages/login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Registros from "./pages/Registros/Registros";
import Salas from "./pages/Salas/Salas";
import Setores from "./pages/Setores/Setores";
import Membros from "./pages/Membros/Membros";
import Auditoria from "./pages/Auditoria/Auditoria";
import Perfil from "./pages/Perfil/Perfil";
import Configuracoes from "./pages/Configuracoes/Configuracoes";
import SolicitarAcesso from "./pages/SolicitarAcesso/SolicitarAcesso";
import Empresas from "./pages/Empresas/Empresas";
import Solicitacoes from "./pages/Solicitacoes/Solicitacoes";
import DefinirSenha from "./pages/DefinirSenha/DefinirSenha";
import LandingPage from "./pages/landpage/LandingPage";
import VerificarMFA from "./pages/mfa/VerificarMFA";
import ConfigurarMFA from "./pages/mfa/ConfigurarMFA";
import Reservas from "./pages/Reservas/Reservas";


function PublicRoute({ children }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <span>Carregando...</span>
      </div>
    );
  }

  return autenticado ? <RedirecionarInicio /> : children;
}

function DashboardAcesso() {
    const { usuario } = useAuth();

    const cargo = usuario?.role?.toLowerCase();

    if (cargo === "user") {
        return <Navigate to="/registros" replace />;
    }

    if (cargo === "superadmin") {
        return <Navigate to="/empresas" replace />;
    }

    return <Dashboard />;
}
function RotaSuperAdmin({ children }) {
    const { usuario } = useAuth();

    const cargo = usuario?.role?.toLowerCase();

    if (cargo !== "superadmin") {
        return (
            <Navigate
                to={cargo === "user" ? "/registros" : "/dashboard"}
                replace
            />
        );
    }

    return children;
} 
function RotaReservas({ children }) {
    const { usuario } = useAuth();

    if (usuario?.role?.toLowerCase() === "superadmin") {
        return <Navigate to="/empresas" replace />;
    }

    return children;
}

function PaginaEmConstrucao() {
  return (
    <section>
      <span style={{ color: "var(--muted)", fontSize: "11px" }}>
        KCONTROL V3
      </span>

      <h2 style={{ marginTop: "12px", fontFamily: "var(--font-heading)" }}>
        Página em desenvolvimento
      </h2>

      <p style={{ marginTop: "8px", color: "var(--muted)" }}>
        Estamos preparando este módulo.
      </p>
    </section>
  );
}
function RedirecionarInicio() {
    const { usuario } = useAuth();

    const cargo = usuario?.role?.toLowerCase();

    if (cargo === "user") {
        return <Navigate to="/registros" replace />;
    }

    if (cargo === "superadmin") {
        return <Navigate to="/empresas" replace />;
    }

    return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (

    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
    path="/mfa/configurar"
    element={<ConfigurarMFA />}
/>
      <Route
    path="/mfa/verificar"
    element={<VerificarMFA />}
/>

      <Route path="/solicitar-acesso" element={<SolicitarAcesso />} />
      <Route path="/definir-senha" element={<DefinirSenha />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardAcesso />} />

          <Route path="/registros" element={<Registros />} />
          <Route path="/reservas" element={<RotaReservas> <Reservas /> </RotaReservas>}/>
          <Route path="/salas" element={<Salas />} />
          <Route path="/setores" element={<Setores />} />
          <Route path="/membros" element={<Membros />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route
            path="/empresas"
            element={
              <RotaSuperAdmin>
                <Empresas />
              </RotaSuperAdmin>
            }
          />
          <Route
            path="/solicitacoes"
            element={
              <RotaSuperAdmin>
                <Solicitacoes />
              </RotaSuperAdmin>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<RedirecionarInicio />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
