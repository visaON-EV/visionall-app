import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contextos/AuthContext';
import { Button } from '@/componentes/interfaces do usuario/botão';
import { Input } from '@/componentes/interfaces do usuario/input';
import { Label } from '@/componentes/interfaces do usuario/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/interfaces do usuario/cartão';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useToast } from '@/ganchos/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const { login, loginVisitante } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    const resultado = await login(email, senha);

    if (resultado.ok) {
      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo ao Vision All',
      });
      navigate('/dashboard');
    } else {
      let descricao = 'Email ou senha incorretos';
      if ('reason' in resultado && resultado.reason === 'perfil') {
        descricao = 'Usuário sem perfil cadastrado. Fale com o administrador.';
      }
      toast({
        title: 'Erro no login',
        description: descricao,
        variant: 'destructive',
      });
    }
    
    setCarregando(false);
  };

  const handleVisitante = () => {
    loginVisitante();
    toast({
      title: 'Modo Visitante',
      description: 'Você está visualizando como visitante (somente leitura)',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-slate-800/90 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Vision All
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Sistema de Gerenciamento de Produção
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-slate-300">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
              disabled={carregando}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-500">ou</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={handleVisitante}
          >
            Entrar como Visitante
          </Button>
          
          <div className="text-center text-xs text-slate-500 space-y-1">
            <p className="font-mono">VisiON™</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
