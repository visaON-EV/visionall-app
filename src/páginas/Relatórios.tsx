import { useState, useEffect, useMemo } from 'react';
import Layout from '@/componentes/Layout';
import { useOrdensServico } from '@/ganchos/useOrdensServico';
import { 
  ATIVIDADE_LABELS, 
  ATIVIDADES_PRINCIPAIS, 
  STATUS_LABELS, 
  ALL_STATUS,
  AtividadePrincipal, 
  OSStatus,
  PRIORIDADES,
  PRIORIDADE_LABELS,
  Prioridade
} from '@/tipos';
import { Textarea } from '@/componentes/interfaces do usuario/textarea';
import { Input } from '@/componentes/interfaces do usuario/input';
import { Label } from '@/componentes/interfaces do usuario/label';
import { Badge } from '@/componentes/interfaces do usuario/badge';
import { Button } from '@/componentes/interfaces do usuario/botão';
import { useToast } from '@/ganchos/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/interfaces do usuario/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/interfaces do usuario/tabela';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/interfaces do usuario/cartão';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/componentes/interfaces do usuario/diálogo';
import { 
  FileBarChart, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  Wrench,
  AlertTriangle,
  Filter,
  Calendar,
  Search
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

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
];

export default function Relatorios() {
  const { ordens, historico, editarOS } = useOrdensServico();
  const { toast } = useToast();
  const [modalForaDoPrazoAberto, setModalForaDoPrazoAberto] = useState(false);
  const [motivosEditaveis, setMotivosEditaveis] = useState<Record<string, string>>({});
  const [setoresEditaveis, setSetoresEditaveis] = useState<Record<string, string>>({});
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<OSStatus | 'todos'>('todos');
  const [filtroAtividade, setFiltroAtividade] = useState<AtividadePrincipal | 'todas'>('todas');
  const [filtroPrioridade, setFiltroPrioridade] = useState<Prioridade | 'todas'>('todas');
  const [campoData, setCampoData] = useState<'dataEntrada' | 'dataAutorizacao' | 'previsaoEntrega' | 'conclusao'>('dataEntrada');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todos' | 'mes_atual' | 'ano_atual' | 'mes_especifico' | 'ano_especifico' | 'intervalo'>('todos');
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState<number>(new Date().getFullYear());
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const parseData = (valor?: string) => {
    if (!valor) return null;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return null;
    return data;
  };

  const obterDataBaseOS = (os: typeof ordens[number]) => {
    if (campoData === 'dataEntrada') return parseData(os.dataEntrada || os.createdAt);
    if (campoData === 'dataAutorizacao') return parseData(os.dataAutorizacao);
    if (campoData === 'previsaoEntrega') return parseData(os.previsaoEntrega);
    if (campoData === 'conclusao') {
      if (os.status !== 'concluido') return null;
      return parseData(os.updatedAt);
    }
    return null;
  };

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>();
    ordens.forEach(os => {
      const data = parseData(os.dataEntrada || os.createdAt);
      if (data) anos.add(data.getFullYear());
    });
    if (anos.size === 0) anos.add(new Date().getFullYear());
    return Array.from(anos).sort((a, b) => b - a);
  }, [ordens]);

  useEffect(() => {
    if (!anosDisponiveis.includes(filtroAno)) {
      setFiltroAno(anosDisponiveis[0]);
    }
  }, [anosDisponiveis, filtroAno]);

  const intervaloPeriodo = useMemo(() => {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

    if (filtroPeriodo === 'mes_atual') {
      return { inicio, fim };
    }
    if (filtroPeriodo === 'ano_atual') {
      return { 
        inicio: new Date(hoje.getFullYear(), 0, 1, 0, 0, 0, 0), 
        fim: new Date(hoje.getFullYear(), 11, 31, 23, 59, 59, 999)
      };
    }
    if (filtroPeriodo === 'mes_especifico') {
      return {
        inicio: new Date(filtroAno, filtroMes - 1, 1, 0, 0, 0, 0),
        fim: new Date(filtroAno, filtroMes, 0, 23, 59, 59, 999)
      };
    }
    if (filtroPeriodo === 'ano_especifico') {
      return {
        inicio: new Date(filtroAno, 0, 1, 0, 0, 0, 0),
        fim: new Date(filtroAno, 11, 31, 23, 59, 59, 999)
      };
    }
    if (filtroPeriodo === 'intervalo') {
      const inicioIntervalo = dataInicio ? new Date(`${dataInicio}T00:00:00`) : null;
      const fimIntervalo = dataFim ? new Date(`${dataFim}T23:59:59`) : null;
      return { inicio: inicioIntervalo, fim: fimIntervalo };
    }
    return { inicio: null, fim: null };
  }, [filtroPeriodo, filtroMes, filtroAno, dataInicio, dataFim]);

  const ordensFiltradas = useMemo(() => {
    const termo = filtroTexto.trim().toLowerCase();
    return ordens.filter(os => {
      if (termo) {
        const matchTexto = [os.numero, os.cliente, os.tipoMotor]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(termo));
        if (!matchTexto) return false;
      }

      if (filtroStatus !== 'todos' && os.status !== filtroStatus) return false;
      if (filtroAtividade !== 'todas' && os.atividadePrincipal !== filtroAtividade) return false;
      if (filtroPrioridade !== 'todas' && os.prioridade !== filtroPrioridade) return false;

      if (filtroPeriodo !== 'todos') {
        const dataBase = obterDataBaseOS(os);
        if (!dataBase) return false;
        const { inicio, fim } = intervaloPeriodo;
        if (inicio && dataBase < inicio) return false;
        if (fim && dataBase > fim) return false;
      }

      return true;
    });
  }, [ordens, filtroTexto, filtroStatus, filtroAtividade, filtroPrioridade, filtroPeriodo, intervaloPeriodo, campoData]);

  const contagemAtividade = useMemo(() => {
    const contagem: Record<AtividadePrincipal, number> = {
      rebobinar: 0,
      rejuvenescer: 0,
      manutencao_mecanica: 0,
      balanceamento: 0
    };
    ordensFiltradas.forEach(os => {
      contagem[os.atividadePrincipal]++;
    });
    return contagem;
  }, [ordensFiltradas]);

  const prazos = useMemo(() => {
    const concluidas = ordensFiltradas.filter(os => os.status === 'concluido');
    let noPrazo = 0;
    let foraDoPrazo = 0;
    const detalhesForaDoPrazo: Array<{
      osId: string;
      numero: string;
      cliente: string;
      setorAtraso: string;
      motivoAtraso: string;
      diasAtraso: number;
    }> = [];

    concluidas.forEach(os => {
      if (!os.previsaoEntrega) {
        noPrazo++;
        return;
      }

      const previsao = new Date(os.previsaoEntrega);
      const conclusao = new Date(os.updatedAt);
      const previsaoNorm = new Date(previsao.getFullYear(), previsao.getMonth(), previsao.getDate(), 23, 59, 59);
      const conclusaoNorm = new Date(conclusao.getFullYear(), conclusao.getMonth(), conclusao.getDate());

      if (conclusaoNorm <= previsaoNorm) {
        noPrazo++;
      } else {
        foraDoPrazo++;

        const historicoOS = historico.filter(h => h.osId === os.id);
        let maiorTempo = 0;
        let setorMaiorTempo = 'Não identificado';
        historicoOS.forEach(h => {
          if (h.tempoNoStatus && h.tempoNoStatus > maiorTempo) {
            maiorTempo = h.tempoNoStatus;
            setorMaiorTempo = h.statusNovo;
          }
        });

        const diasAtraso = Math.ceil((conclusaoNorm.getTime() - previsaoNorm.getTime()) / (1000 * 60 * 60 * 24));
        detalhesForaDoPrazo.push({
          osId: os.id,
          numero: os.numero,
          cliente: os.cliente,
          setorAtraso: setorMaiorTempo,
          motivoAtraso: os.motivoAtraso || `Maior tempo no setor: ${setorMaiorTempo}`,
          diasAtraso
        });
      }
    });

    return { noPrazo, foraDoPrazo, total: concluidas.length, detalhesForaDoPrazo };
  }, [ordensFiltradas, historico]);

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

  const dadosMensais = useMemo(() => {
    const base = MESES.map(m => ({ mes: m.label, quantidade: 0 }));
    ordensFiltradas.forEach(os => {
      const data = obterDataBaseOS(os);
      if (!data) return;
      if (data.getFullYear() !== filtroAno) return;
      base[data.getMonth()].quantidade += 1;
    });
    return base;
  }, [ordensFiltradas, filtroAno, campoData]);

  // Calcular porcentagem no prazo
  const porcentagemNoPrazo = prazos.total > 0 
    ? Math.round((prazos.noPrazo / prazos.total) * 100) 
    : 0;

  const totalFiltrado = ordensFiltradas.length;
  const totalConcluidas = ordensFiltradas.filter(os => os.status === 'concluido').length;
  const totalEmAndamento = totalFiltrado - totalConcluidas;

  const limparFiltros = () => {
    setFiltroTexto('');
    setFiltroStatus('todos');
    setFiltroAtividade('todas');
    setFiltroPrioridade('todas');
    setCampoData('dataEntrada');
    setFiltroPeriodo('todos');
    setFiltroMes(new Date().getMonth() + 1);
    setFiltroAno(new Date().getFullYear());
    setDataInicio('');
    setDataFim('');
  };

  const formatarData = (data?: string) => {
    if (!data) return '-';
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('pt-BR');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Relatórios</h1>
            <p className="text-slate-400">Análise de desempenho e produtividade</p>
          </div>
        </div>

        {/* Filtros BI */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-cyan-400" />
              Filtros BI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Busca rápida</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Número, cliente ou motor"
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Status</Label>
                <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as OSStatus | 'todos')}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="todos" className="text-white">Todos</SelectItem>
                    {ALL_STATUS.map(status => (
                      <SelectItem key={status} value={status} className="text-white">
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Atividade Principal</Label>
                <Select value={filtroAtividade} onValueChange={(value) => setFiltroAtividade(value as AtividadePrincipal | 'todas')}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Todas as atividades" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="todas" className="text-white">Todas</SelectItem>
                    {ATIVIDADES_PRINCIPAIS.map(atividade => (
                      <SelectItem key={atividade} value={atividade} className="text-white">
                        {ATIVIDADE_LABELS[atividade]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Prioridade</Label>
                <Select value={filtroPrioridade} onValueChange={(value) => setFiltroPrioridade(value as Prioridade | 'todas')}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="todas" className="text-white">Todas</SelectItem>
                    {PRIORIDADES.map(prioridade => (
                      <SelectItem key={prioridade} value={prioridade} className="text-white">
                        {PRIORIDADE_LABELS[prioridade]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Campo de data</Label>
                <Select value={campoData} onValueChange={(value) => setCampoData(value as typeof campoData)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="dataEntrada" className="text-white">Data de Entrada</SelectItem>
                    <SelectItem value="dataAutorizacao" className="text-white">Data de Autorização</SelectItem>
                    <SelectItem value="previsaoEntrega" className="text-white">Previsão de Entrega</SelectItem>
                    <SelectItem value="conclusao" className="text-white">Data de Conclusão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Período</Label>
                <Select value={filtroPeriodo} onValueChange={(value) => setFiltroPeriodo(value as typeof filtroPeriodo)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="todos" className="text-white">Todos</SelectItem>
                    <SelectItem value="mes_atual" className="text-white">Mês Atual</SelectItem>
                    <SelectItem value="ano_atual" className="text-white">Ano Atual</SelectItem>
                    <SelectItem value="mes_especifico" className="text-white">Mês Específico</SelectItem>
                    <SelectItem value="ano_especifico" className="text-white">Ano Específico</SelectItem>
                    <SelectItem value="intervalo" className="text-white">Intervalo Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(filtroPeriodo === 'mes_especifico' || filtroPeriodo === 'ano_especifico' || filtroPeriodo === 'intervalo') && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {(filtroPeriodo === 'mes_especifico' || filtroPeriodo === 'ano_especifico') && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Ano</Label>
                    <Select value={String(filtroAno)} onValueChange={(value) => setFiltroAno(Number(value))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {anosDisponiveis.map(ano => (
                          <SelectItem key={ano} value={String(ano)} className="text-white">
                            {ano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filtroPeriodo === 'mes_especifico' && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Mês</Label>
                    <Select value={String(filtroMes)} onValueChange={(value) => setFiltroMes(Number(value))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {MESES.map(mes => (
                          <SelectItem key={mes.value} value={String(mes.value)} className="text-white">
                            {mes.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filtroPeriodo === 'intervalo' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Data inicial</Label>
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Data final</Label>
                      <Input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" className="border-slate-600 text-slate-300" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Geral */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/40 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Total Filtrado</p>
                <p className="text-white text-2xl font-bold">{totalFiltrado}</p>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Em Andamento</p>
                <p className="text-yellow-400 text-2xl font-bold">{totalEmAndamento}</p>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Concluídas</p>
                <p className="text-green-400 text-2xl font-bold">{totalConcluidas}</p>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Atrasadas</p>
                <p className="text-red-400 text-2xl font-bold">{prazos.foraDoPrazo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              {ordensFiltradas.length > 0 ? (
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
                    <p>Nenhuma O.S. encontrada</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Por Mês */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                O.S. por Mês ({filtroAno})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordensFiltradas.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosMensais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 11 }}
                      angle={-20}
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
                    <Bar dataKey="quantidade" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma O.S. para o período</p>
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
                const osAtividade = ordensFiltradas.filter(os => os.atividadePrincipal === atividade);
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

        {/* Lista Filtrada */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Lista de O.S. Filtradas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">Número</TableHead>
                    <TableHead className="text-slate-400">Cliente</TableHead>
                    <TableHead className="text-slate-400">Atividade</TableHead>
                    <TableHead className="text-slate-400">Prioridade</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Entrada</TableHead>
                    <TableHead className="text-slate-400">Previsão</TableHead>
                    <TableHead className="text-slate-400">Conclusão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordensFiltradas.length > 0 ? (
                    ordensFiltradas.map(os => (
                      <TableRow key={os.id} className="border-slate-700">
                        <TableCell className="font-mono text-blue-400 font-semibold">{os.numero}</TableCell>
                        <TableCell className="text-white">{os.cliente}</TableCell>
                        <TableCell className="text-slate-300">
                          {ATIVIDADE_LABELS[os.atividadePrincipal]}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-700 text-slate-200">
                            {PRIORIDADE_LABELS[os.prioridade]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-700 text-slate-200">
                            {STATUS_LABELS[os.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{formatarData(os.dataEntrada)}</TableCell>
                        <TableCell className="text-slate-300">{formatarData(os.previsaoEntrega)}</TableCell>
                        <TableCell className="text-slate-300">
                          {os.status === 'concluido' ? formatarData(os.updatedAt) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        Nenhuma O.S. encontrada com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
