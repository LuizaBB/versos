import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { BottomNavLayout } from "./layouts/BottomNavLayout";
import { StackLayout } from "./layouts/StackLayout";
import { AnuncioDetalhe } from "./pages/AnuncioDetalhe";
import { CompraDetalhe } from "./pages/CompraDetalhe";
import { Comprados } from "./pages/Comprados";
import { GrupoDetalhe } from "./pages/GrupoDetalhe";
import { Grupos } from "./pages/Grupos";
import { Leituras } from "./pages/Leituras";
import { LivroDetalhe } from "./pages/LivroDetalhe";
import { Login } from "./pages/Login";
import { Notificacoes } from "./pages/Notificacoes";
import { NovoAnuncio } from "./pages/NovoAnuncio";
import { Perfil } from "./pages/Perfil";
import { Register } from "./pages/Register";
import { Vendidos } from "./pages/Vendidos";

//
import GrupoChat from "./pages/GrupoChat";
import GrupoHistorico from "./pages/GrupoHistorico";

<Route path="/grupos/:id/chat" element={<GrupoChat />} />
<Route path="/grupos/:id/historico" element={<GrupoHistorico />} />
//

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-center muted">
        <p>Carregando…</p>
      </div>
    );
  }
  return <Navigate to={user ? "/app/leituras" : "/login"} replace />;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="page-center muted">
        <p>Carregando…</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<ProtectedLayout />}>
        <Route element={<BottomNavLayout />}>
          <Route index element={<Navigate to="leituras" replace />} />
          <Route path="leituras" element={<Leituras />} />
          <Route path="vendidos" element={<Vendidos />} />
          <Route path="comprados" element={<Comprados />} />
          <Route path="grupos" element={<Grupos />} />
        </Route>
        <Route element={<StackLayout />}>
          <Route path="perfil" element={<Perfil />} />
          <Route path="notificacoes" element={<Notificacoes />} />
          <Route path="livros/:bookId" element={<LivroDetalhe />} />
          <Route path="grupos/:groupId" element={<GrupoDetalhe />} />
          <Route path="anuncios/novo" element={<NovoAnuncio />} />
          <Route path="anuncios/:listingId" element={<AnuncioDetalhe />} />
          <Route path="compras/:purchaseId" element={<CompraDetalhe />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
