import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';

import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import { Usuario, Colaborador } from '@/tipos';

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  loading: boolean;
  isColaborador: boolean;
  colaboradores: Colaborador[];
  login: (email: string, senha: string) => Promise<{ ok: true; reason?: never } | { ok: false; reason: 'credenciais' | 'perfil' | 'erro' }>;
  loginVisitante: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Escuta a sessão do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, 'usuarios', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          const usuarioFirebase: Usuario = {
            id: user.uid,
            nome: data.nome,
            email: data.email,
            tipo: data.tipo,
            colaboradorId: data.colaboradorId
          };

          setUsuario(usuarioFirebase);
        } else {
          // Usuário autenticado sem perfil
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔐 Login real
  const login = async (email: string, senha: string): Promise<{ ok: true; reason?: never } | { ok: false; reason: 'credenciais' | 'perfil' | 'erro' }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const ref = doc(db, 'usuarios', cred.user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await signOut(auth);
        return { ok: false, reason: 'perfil' };
      }

      const data = snap.data();
      const usuarioFirebase: Usuario = {
        id: cred.user.uid,
        nome: data.nome,
        email: data.email,
        tipo: data.tipo,
        colaboradorId: data.colaboradorId
      };

      setUsuario(usuarioFirebase);
      return { ok: true };
    } catch (error) {
      console.error('Erro ao logar:', error);
      return { ok: false, reason: 'credenciais' };
    }
  };

  // 👀 Visitante (sem Firebase Auth)
  const loginVisitante = () => {
    const visitante: Usuario = {
      id: 'visitante',
      nome: 'Visitante',
      email: '',
      tipo: 'visitante'
    };
    setUsuario(visitante);
  };

  // 🚪 Logout
  const logout = async () => {
    await signOut(auth);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        loading,
        isColaborador: usuario?.tipo !== 'visitante',
        colaboradores,
        login,
        loginVisitante,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
