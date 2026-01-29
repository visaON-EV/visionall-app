import Layout from '@/componentes/Layout';
import { ConfiguracaoExpediente } from '@/componentes/ConfiguraçãoExpediente';

export default function Configuracoes() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="text-slate-400">Personalize as configurações do sistema</p>
        </div>
        
        <ConfiguracaoExpediente />
      </div>
    </Layout>
  );
}
