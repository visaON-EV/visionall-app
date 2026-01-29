import { useState, useEffect } from 'react';
import Layout from '@/componentes/Layout';
import { useOrdensServico } from '@/ganchos/useOrdensServico';
import { ATIVIDADE_LABELS, ATIVIDADES_PRINCIPAIS, STATUS_LABELS, AtividadePrincipal, OSStatus } from '@/tipos';
import { Textarea } from '@/componentes/interfaces do usuario/textarea';
import { Button } from '@/componentes/interfaces do usuario/botão';
import { useToast } from '@/ganchos/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/interfaces do usuario/cartão';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/componentes/interfaces do usuario/diálogo';
import { 
  FileBarChart, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CORES_ATIVIDADES = {
  rebobinar: '#3B82F6',
  rejuvenescer: '#10B981',
  manutencao_mecanica: '#F59E0B',
  balanceamento: '#8B5CF6'
};

export default function Relatorios() {
  const { ordens, contarPorAtividade, relatorioPrazos, editarOS } = useOrdensServico();
  const { toast } = useToast();
  const [modalForaDoPrazoAberto, setModalForaDoPrazoAberto] = useState(false);
  const [motivosEditaveis, setMotivosEditaveis] = useState<Record<string, string>>({});
  const [setoresEditaveis, setSetoresEditaveis] = useState<Record<string, string>>({});
  
  const contagemAtividade = contarPorAtividade();
  const prazos = relatorioPrazos();

  // Inicializar campos editáveis quando abrir modal
  useEffect(() => {
    if (modalForaDoPrazoAberto && prazos.detalhesForaDoPrazo) {
      const motivos: Record<string, string> = {};
      const setores: Record<string, string> = {};
      prazos.detalhesForaDoPrazo.forEach(item => {
        const os = ordens.find(o => o.id === item.osId);
        motivos[item.osId] = os?.motivoAtraso || item.motivoAtraso;
        setores[item.osId] = os?.setorAtraso || item.setorAtraso;
      });
      setMotivosEditaveis(motivos);
      setSetoresEditaveis(setores);
    }
  }, [modalForaDoPrazoAberto, prazos.detalhesForaDoPrazo, ordens]);

  const salvarMotivo = (osId: string) => {
    editarOS(osId, { motivoAtraso: motivosEditaveis[osId] });
    toast({
      title: 'Motivo salvo',
      description: 'O motivo do atraso foi atualizado com sucesso.'
    });
  };

  const salvarSetor = (osId: string) => {
    editarOS(osId, { setorAtraso: setoresEditaveis[osId] });
    toast({
      title: 'Setor salvo',
      description: 'O setor do atraso foi atualizado com sucesso.'
    });
  };

  // Dados para gráfico de pizza de prazos
  const dadosPrazos = [
    { name: 'No Prazo', value: prazos.noPrazo, color: '#22C55E' },
    { name: 'Fora do Prazo', value: prazos.foraDoPrazo, color: '#EF4444' }
  ].filter(d => d.value > 0);

  // Dados para gráfico de barras por atividade
  const dadosAtividades = ATIVIDADES_PRINCIPAIS.map(atividade => ({
    atividade: ATIVIDADE_LABELS[atividade],
    quantidade: contagemAtividade[atividade],
    fill: CORES_ATIVIDADES[atividade]
  }));

  // Calcular porcentagem no prazo
  const porcentagemNoPrazo = prazos.total > 0 
    ? Math.round((prazos.noPrazo / prazos.total) * 100) 
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Relatórios</h1>
            <p className="text-slate-400">Análise de desempenho e produtividade</p>
          </div>
        </div>

        {/* Cards de Resumo de Prazos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Concluídas no Prazo</p>
                  <p className="text-4xl font-bold text-white mt-2">{prazos.noPrazo}</p>
                </div>
                <div className="w-12 h-12 bg-green-400/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-red-500 to-rose-600 border-0 cursor-pointer hover:from-red-600 hover:to-rose-700 transition-all"
            onClick={() => setModalForaDoPrazoAberto(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Fora do Prazo</p>
                  <p className="text-4xl font-bold text-white mt-2">{prazos.foraDoPrazo}</p>
                  <p className="text-red-200 text-xs mt-1">Clique para ver detalhes</p>
                </div>
                <div className="w-12 h-12 bg-red-400/30 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Taxa de Sucesso</p>
                  <p className="text-4xl font-bold text-white mt-2">{porcentagemNoPrazo}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-400/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Prazos */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Conclusão por Prazo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosPrazos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosPrazos}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {dadosPrazos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma O.S. concluída ainda</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Por Atividade */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400" />
                O.S. por Atividade Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordens.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosAtividades}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="atividade" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 11 }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                      {dadosAtividades.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma O.S. cadastrada</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhamento por Atividade */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Detalhamento por Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ATIVIDADES_PRINCIPAIS.map(atividade => {
                const osAtividade = ordens.filter(os => os.atividadePrincipal === atividade);
                const concluidas = osAtividade.filter(os => os.status === 'concluido').length;
                const emAndamento = osAtividade.length - concluidas;
                
                return (
                  <div 
                    key={atividade}
                    className="bg-slate-700/50 rounded-lg p-4"
                  >
                    <div 
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: CORES_ATIVIDADES[atividade] }}
                    ></div>
                    <h4 className="text-white font-semibold">{ATIVIDADE_LABELS[atividade]}</h4>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total:</span>
                        <span className="text-white font-medium">{osAtividade.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Concluídas:</span>
                        <span className="text-green-400 font-medium">{concluidas}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Em andamento:</span>
                        <span className="text-yellow-400 font-medium">{emAndamento}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Modal Fora do Prazo */}
        <Dialog open={modalForaDoPrazoAberto} onOpenChange={setModalForaDoPrazoAberto}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                O.S. Fora do Prazo - Detalhes
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {prazos.detalhesForaDoPrazo && prazos.detalhesForaDoPrazo.length > 0 ? (
                prazos.detalhesForaDoPrazo.map((item) => (
                  <div 
                    key={item.osId}
                    className="bg-slate-700/50 rounded-lg p-4 border border-red-500/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-mono text-red-400 font-bold">
                        O.S. {item.numero}
                      </span>
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                        {item.diasAtraso} dia(s) de atraso
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-slate-400">Cliente:</span>
                        <span className="text-white ml-2">{item.cliente}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-600">
                      {/* Setor do Atraso Editável */}
                      <div>
                        <span className="text-slate-400 text-sm">Setor do Atraso:</span>
                        <input
                          type="text"
                          value={setoresEditaveis[item.osId] || ''}
                          onChange={(e) => setSetoresEditaveis(prev => ({
                            ...prev,
                            [item.osId]: e.target.value
                          }))}
                          placeholder="Ex: Montagem, Rebobinar..."
                          className="mt-2 w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-md px-3 py-2"
                        />
                        <Button
                          size="sm"
                          className="mt-2 bg-amber-600 hover:bg-amber-700"
                          onClick={() => salvarSetor(item.osId)}
                        >
                          Salvar Setor
                        </Button>
                      </div>
                      
                      {/* Motivo do Atraso Editável */}
                      <div>
                        <span className="text-slate-400 text-sm">Motivo do Atraso:</span>
                        <Textarea
                          value={motivosEditaveis[item.osId] || ''}
                          onChange={(e) => setMotivosEditaveis(prev => ({
                            ...prev,
                            [item.osId]: e.target.value
                          }))}
                          placeholder="Descreva o motivo do atraso..."
                          className="mt-2 bg-slate-700 border-slate-600 text-white text-sm resize-none"
                          rows={2}
                        />
                        <Button
                          size="sm"
                          className="mt-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => salvarMotivo(item.osId)}
                        >
                          Salvar Motivo
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>Nenhuma O.S. fora do prazo!</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
