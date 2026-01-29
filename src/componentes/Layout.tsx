import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contextos/AuthContext';
import { Button } from '@/componentes/interfaces do usuario/botão';
import {
  LayoutDashboard,
  ClipboardList,
  FileBarChart,
  LogOut,
  Zap,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/biblioteca/utils';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList },
  { path: '/relatorios', label: 'Relatórios', icon: FileBarChart },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const { usuario, logout, isColaborador } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-slate-800/50 backdrop-blur-sm border-r border-slate-700">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Vision All
              </h1>
              <p className="text-xs text-slate-500">Gestão de Produção</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {usuario?.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{usuario?.nome}</p>
                <p className="text-xs text-slate-500">
                  {isColaborador ? 'Colaborador' : 'Visitante'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-slate-600 text-slate-400 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Vision All</span>
          </div>
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="text-slate-400 hover:text-white"
          >
            {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuAberto && (
          <div className="px-4 py-4 border-t border-slate-700 bg-slate-800">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuAberto(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      isActive 
                        ? 'bg-blue-600/20 text-blue-400' 
                        : 'text-slate-400 hover:bg-slate-700/50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                className="w-full border-slate-600 text-slate-400"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
