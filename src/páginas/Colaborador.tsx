import Layout from '@/componentes/Layout';
import { useAuth } from '@/contextos/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/interfaces do usuario/cartão';
import { Users } from 'lucide-react';

export default function Colaboradores() {
  const { colaboradores } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Colaboradores</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colaboradores.map(c => (
            <Card key={c.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{c.nome}</p>
                  <p className="text-sm text-slate-400">{c.setor}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
