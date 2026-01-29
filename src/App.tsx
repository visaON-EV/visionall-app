import { Toaster } from "@/componentes/interfaces do usuario/torradeira";
import { Toaster as Sonner } from "@/componentes/interfaces do usuario/sonner";
import { TooltipProvider } from "@/componentes/interfaces do usuario/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contextos/AuthContext";
import Login from "./páginas/Login";
import Dashboard from "./páginas/Dashboard";
import OrdensServico from "./páginas/OrdensServico";
import Relatorios from "./páginas/Relatórios";
import Configuracoes from "./páginas/Configurações";
import NotFound from "./páginas/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/ordens" element={<ProtectedRoute><OrdensServico /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;