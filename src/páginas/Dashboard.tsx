import { useState } from 'react';
import { useAuth } from '@/contextos/AuthContext';
import { useOrdensServico } from '@/ganchos/useOrdensServico';
import { useNotificacoesPrazo } from '@/ganchos/useNotificacoesPrazo';
import { STATUS_LABELS, STATUS_COLORS, ATIVIDADE_LABELS, ATIVIDADES_PRINCIPAIS, OSStatus } from '@/tipos';
import { formatarTempoUtil } from '@/utilitários/calcularTempoUtil';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/interfaces do usuario/cartão';
import { Badge } from '@/componentes/interfaces do usuario/badge';
import { Button } from '@/componentes/interfaces do usuario/botão';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/componentes/interfaces do usuario/diálogo';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Timer,
  RefreshCw,
  Bell,
  CalendarClock
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import Layout from '@/componentes/Layout';

const CHART_COLORS = [
  '#3B82F6', '#F97316', '#06B6D4', '#D97706', '#8B5CF6',
  '#EF4444', '#6366F1', '#EAB308', '#EC4899', '#14B8A6',
  '#22C55E', '#6B7280'
];

export default function Dashboard() {
  const { usuario } = useAuth();
  const { 
    ordens, 
    contarPorStatus, 
    contarPorAtividade,
    tempoTotalEmProducao,
    listarRetrabalho,
    calcularTempoParcialOS
  } = useOrdensServico();

  const [modalRetrabalho, setModalRetrabalho] = useState(false);
  const [modalAlertas, setModalAlertas] = useState(false);
  const [modalTotal, setModalTotal] = useState(false);
  const [modalEmAndamento, setModalEmAndamento] = useState(false);
  const [modalConcluidas, setModalConcluidas] = useState(false);
  const [modalAguardando, setModalAguardando] = useState(false);
  const [modalAguardandoExecucao, setModalAguardandoExecucao] = useState(false);
  const [modalTempoTotal, setModalTempoTotal] = useState(false);

  // Hook de notificações de prazo
  const { 
    osProximasDoPrazo, 
    totalAlertas, 
    alertasUrgentes 
  } = useNotificacoesPrazo(ordens);

  const contagemStatus = contarPorStatus();
  const contagemAtividade = contarPorAtividade();
  const tempoTotal = tempoTotalEmProducao();
  const osRetrabalho = listarRetrabalho();

  // Dados para gráfico de pizza (status)
  const dadosPizza = Object.entries(contagemStatus)
    .filter(([_, value]) => value > 0)
    .map(([status, value], index) => ({
      name: STATUS_LABELS[status as OSStatus],
      value,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));

  // Estatísticas gerais
  const totalOS = ordens.length;
  const osConcluidas = contagemStatus.concluido || 0;
  const osAguardandoMaterial = contagemStatus.aguardando_material || 0;
  const osAguardandoExecucao = contagemStatus.aguardando_execucao || 0;
  const osEmAndamento = totalOS - osConcluidas - osAguardandoMaterial - osAguardandoExecucao;
  
  // Filtrar OSs por categoria
  const todasOS = ordens;
  const osEmAndamentoList = ordens.filter(os => (
    os.status !== 'concluido' &&
    os.status !== 'aguardando_material' &&
    os.status !== 'aguardando_execucao'
  ));
  const osConcluidasList = ordens.filter(os => os.status === 'concluido');
  const osAguardandoList = ordens.filter(os => os.status === 'aguardando_material');
  const osAguardandoExecucaoList = ordens.filter(os => os.status === 'aguardando_execucao');

  // Status ativos para mostrar no grid
  const statusAtivos = Object.entries(contagemStatus).filter(([_, count]) => count > 0);

  const formatarDataSomente = (data: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Bem-vindo, {usuario?.nome}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-400">Tempo real</span>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card 
            className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all"
            onClick={() => setModalTotal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total de O.S.</p>
                  <p className="text-4xl font-bold text-white mt-2">{totalOS}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/50 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 cursor-pointer hover:from-amber-600 hover:to-orange-700 transition-all"
            onClick={() => setModalEmAndamento(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Em Andamento</p>
                  <p className="text-4xl font-bold text-white mt-2">{osEmAndamento}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 cursor-pointer hover:from-green-600 hover:to-emerald-700 transition-all"
            onClick={() => setModalConcluidas(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Concluídas</p>
                  <p className="text-4xl font-bold text-white mt-2">{osConcluidas}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-red-500 to-rose-600 border-0 cursor-pointer hover:from-red-600 hover:to-rose-700 transition-all"
            onClick={() => setModalAguardando(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Aguardando Material</p>
                  <p className="text-4xl font-bold text-white mt-2">{osAguardandoMaterial}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-sky-500 to-cyan-600 border-0 cursor-pointer hover:from-sky-600 hover:to-cyan-700 transition-all"
            onClick={() => setModalAguardandoExecucao(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-100 text-sm font-medium">Aguardando Execução</p>
                  <p className="text-4xl font-bold text-white mt-2">{osAguardandoExecucao}</p>
                </div>
                <div className="w-12 h-12 bg-sky-500/50 rounded-lg flex items-center justify-center">
                  <CalendarClock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-violet-600 border-0 cursor-pointer hover:from-purple-600 hover:to-violet-700 transition-all"
            onClick={() => setModalTempoTotal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Tempo Total</p>
                  <p className="text-2xl font-bold text-white mt-2">{formatarTempoUtil(tempoTotal)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/50 rounded-lg flex items-center justify-center">
                  <Timer className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Retrabalho */}
          <Card 
            className="bg-gradient-to-br from-yellow-500 to-amber-600 border-0 cursor-pointer hover:from-yellow-600 hover:to-amber-700 transition-all"
            onClick={() => setModalRetrabalho(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Retrabalho</p>
                  <p className="text-4xl font-bold text-white mt-2">{osRetrabalho.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-400/50 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Prazo */}
        {totalAlertas > 0 && (
          <Card 
            className={`border-0 cursor-pointer transition-all ${
              alertasUrgentes > 0 
                ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 animate-pulse' 
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
            }`}
            onClick={() => setModalAlertas(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    alertasUrgentes > 0 ? 'bg-red-500/50' : 'bg-amber-500/50'
                  }`}>
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {alertasUrgentes > 0 
                        ? `🚨 ${alertasUrgentes} O.S. com prazo crítico!` 
                        : `⚠️ ${totalAlertas} O.S. próximas do prazo`}
                    </p>
                    <p className="text-white/80 text-sm">
                      Clique para ver detalhes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contagem por Atividade */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">O.S. por Atividade Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ATIVIDADES_PRINCIPAIS.map((atividade) => (
                <div 
                  key={atividade}
                  className="bg-slate-700/50 rounded-lg p-4 text-center hover:bg-slate-700 transition-colors"
                >
                  <p className="text-3xl font-bold text-white">{contagemAtividade[atividade]}</p>
                  <p className="text-sm text-slate-400 mt-1">{ATIVIDADE_LABELS[atividade]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Cards Grid */}
        {statusAtivos.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Status em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {statusAtivos.map(([status, count]) => (
                  <div 
                    key={status}
                    className="bg-slate-700/50 rounded-lg p-4 text-center hover:bg-slate-700 transition-colors"
                  >
                    <div 
                      className={`w-3 h-3 rounded-full mx-auto mb-2 ${STATUS_COLORS[status as OSStatus]}`}
                    ></div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{STATUS_LABELS[status as OSStatus]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Pizza */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizza.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${value}`}
                  >
                    {dadosPizza.map((entry, index) => (
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
                Nenhuma O.S. cadastrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ordens Recentes */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Ordens de Serviço Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {ordens.length > 0 ? (
              <div className="space-y-3">
                {ordens.slice(-5).reverse().map((os) => (
                  <div 
                    key={os.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{os.numero}</p>
                        <p className="text-sm text-slate-400">{os.cliente}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={`${STATUS_COLORS[os.status]} text-white`}
                      >
                        {STATUS_LABELS[os.status]}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {ATIVIDADE_LABELS[os.atividadePrincipal] || os.tipoMotor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma ordem de serviço cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Retrabalho */}
      <Dialog open={modalRetrabalho} onOpenChange={setModalRetrabalho}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-yellow-400" />
              Ordens de Serviço com Retrabalho ({osRetrabalho.length})
            </DialogTitle>
          </DialogHeader>
          
          {osRetrabalho.length > 0 ? (
            <div className="space-y-4">
              {osRetrabalho.map(os => (
                <div key={os.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-400 font-semibold">{os.numero}</span>
                      <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                        {STATUS_LABELS[os.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-400">{os.cliente}</span>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-slate-400 mb-1">Descrição do Retrabalho:</p>
                    <p className="text-yellow-200 whitespace-pre-wrap">{os.retrabalho}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma O.S. com retrabalho registrado</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Alertas de Prazo */}
      <Dialog open={modalAlertas} onOpenChange={setModalAlertas}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-400" />
              Alertas de Prazo de Entrega ({totalAlertas})
            </DialogTitle>
          </DialogHeader>
          
          {osProximasDoPrazo.length > 0 ? (
            <div className="space-y-4">
              {osProximasDoPrazo.map(({ os, diasRestantes, tipo }) => (
                <div 
                  key={os.id} 
                  className={`rounded-lg p-4 border ${
                    tipo === 'urgente' 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : tipo === 'atencao' 
                        ? 'bg-amber-500/10 border-amber-500/30' 
                        : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-400 font-semibold">{os.numero}</span>
                      <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                        {STATUS_LABELS[os.status]}
                      </Badge>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        tipo === 'urgente' 
                          ? 'border-red-500 text-red-400' 
                          : tipo === 'atencao' 
                            ? 'border-amber-500 text-amber-400' 
                            : 'border-blue-500 text-blue-400'
                      }`}
                    >
                      {diasRestantes <= 0 
                        ? '🚨 VENCIDO' 
                        : diasRestantes === 1 
                          ? '⚠️ Vence amanhã' 
                          : `📅 ${diasRestantes} dias restantes`}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Cliente</p>
                      <p className="text-white">{os.cliente}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Previsão de Entrega</p>
                      <p className={`${
                        tipo === 'urgente' ? 'text-red-400' : tipo === 'atencao' ? 'text-amber-400' : 'text-white'
                      }`}>
                        {new Date(os.previsaoEntrega).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Tipo de Motor</p>
                      <p className="text-white">{os.tipoMotor}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Atividade</p>
                      <p className="text-white">{ATIVIDADE_LABELS[os.atividadePrincipal]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum alerta de prazo no momento</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Total de O.S. */}
      <Dialog open={modalTotal} onOpenChange={setModalTotal}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              Todas as Ordens de Serviço ({todasOS.length})
            </DialogTitle>
          </DialogHeader>
          
          {todasOS.length > 0 ? (
            <div className="space-y-4">
              {todasOS.map(os => (
                <div key={os.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-400 font-semibold">{os.numero}</span>
                      <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                        {STATUS_LABELS[os.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-400">{os.cliente}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Tipo de Motor</p>
                      <p className="text-white">{os.tipoMotor}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Atividade</p>
                      <p className="text-white">{ATIVIDADE_LABELS[os.atividadePrincipal]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma ordem de serviço cadastrada</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Em Andamento */}
      <Dialog open={modalEmAndamento} onOpenChange={setModalEmAndamento}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Ordens de Serviço em Andamento ({osEmAndamentoList.length})
            </DialogTitle>
          </DialogHeader>
          
          {osEmAndamentoList.length > 0 ? (
            <div className="space-y-4">
              {osEmAndamentoList.map(os => (
                <div key={os.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-400 font-semibold">{os.numero}</span>
                      <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                        {STATUS_LABELS[os.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-400">{os.cliente}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Tipo de Motor</p>
                      <p className="text-white">{os.tipoMotor}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Atividade</p>
                      <p className="text-white">{ATIVIDADE_LABELS[os.atividadePrincipal]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma O.S. em andamento no momento</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Concluídas */}
      <Dialog open={modalConcluidas} onOpenChange={setModalConcluidas}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Ordens de Serviço Concluídas ({osConcluidasList.length})
            </DialogTitle>
          </DialogHeader>
          
          {osConcluidasList.length > 0 ? (
            <div className="space-y-4">
              {osConcluidasList.map(os => (
                <div key={os.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-400 font-semibold">{os.numero}</span>
                      <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                        {STATUS_LABELS[os.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-400">{os.cliente}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Tipo de Motor</p>
                      <p className="text-white">{os.tipoMotor}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Atividade</p>
                      <p className="text-white">{ATIVIDADE_LABELS[os.atividadePrincipal]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma O.S. concluída</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Aguardando */}
      <Dialog open={modalAguardando} onOpenChange={setModalAguardando}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Ordens de Serviço Aguardando Material ({osAguardandoList.length})
            </DialogTitle>
          </DialogHeader>
          
          {osAguardandoList.length > 0 ? (
            <div className="space-y-4">
              {osAguardandoList.map(os => (
                <div key={os.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-400 font-semibold">{os.numero}</span>
                      <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                        {STATUS_LABELS[os.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-400">{os.cliente}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Cliente</p>
                      <p className="text-white">{os.cliente}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Peça/Material</p>
                      <p className="text-white">{os.materialAguardando || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Prazo de Chegada</p>
                      <p className="text-white">{formatarDataSomente(os.dataEntregaMaterial || '')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma O.S. aguardando material</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Aguardando Execução */}
      <Dialog open={modalAguardandoExecucao} onOpenChange={setModalAguardandoExecucao}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-sky-400" />
              Ordens de Serviço Aguardando Execução ({osAguardandoExecucaoList.length})
            </DialogTitle>
          </DialogHeader>
          
          {osAguardandoExecucaoList.length > 0 ? (
            <div className="space-y-4">
              {osAguardandoExecucaoList.map(os => (
                <div key={os.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-400 font-semibold">{os.numero}</span>
                      <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                        {STATUS_LABELS[os.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-400">{os.cliente}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Tipo de Motor</p>
                      <p className="text-white">{os.tipoMotor}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Atividade</p>
                      <p className="text-white">{ATIVIDADE_LABELS[os.atividadePrincipal]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma O.S. aguardando execução</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Tempo Total */}
      <Dialog open={modalTempoTotal} onOpenChange={setModalTempoTotal}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-purple-400" />
              Tempo Total de Produção ({formatarTempoUtil(tempoTotal)})
            </DialogTitle>
          </DialogHeader>
          
          {ordens.length > 0 ? (
            <div className="space-y-4">
              {ordens.map(os => {
                const tempoParcial = calcularTempoParcialOS(os.id);
                return (
                  <div key={os.id} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-blue-400 font-semibold">{os.numero}</span>
                        <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                          {STATUS_LABELS[os.status]}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Tempo Parcial</p>
                        <p className="text-lg font-bold text-purple-400">{formatarTempoUtil(tempoParcial)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Cliente</p>
                        <p className="text-white">{os.cliente}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Atividade</p>
                        <p className="text-white">{ATIVIDADE_LABELS[os.atividadePrincipal]}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Timer className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma ordem de serviço cadastrada</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
