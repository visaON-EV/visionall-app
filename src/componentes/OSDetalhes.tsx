import { useState } from 'react';
import { OrdemServico, STATUS_LABELS, STATUS_COLORS, ATIVIDADE_LABELS, PRIORIDADE_LABELS, PRIORIDADE_COLORS, STATUS_POR_ATIVIDADE, RESPONSAVEIS_SETOR } from '@/tipos';
import { useOrdensServico } from '@/ganchos/useOrdensServico';
import { useAuth } from '@/contextos/AuthContext';
import { formatarTempoUtil, calcularTempoUtil } from '@/utilitários/calcularTempoUtil';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/componentes/interfaces do usuario/diálogo';
import { Badge } from '@/componentes/interfaces do usuario/badge';
import { Separator } from '@/componentes/interfaces do usuario/separador';
import { Button } from '@/componentes/interfaces do usuario/botão';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/interfaces do usuario/select';
import { Clock, User, Calendar, Wrench, RefreshCw, CheckCircle2, Timer } from 'lucide-react';
import { useToast } from '@/ganchos/use-toast';

interface OSDetalhesProps {
  os: OrdemServico;
  aberto: boolean;
  onFechar: () => void;
}

export default function OSDetalhes({ os, aberto, onFechar }: OSDetalhesProps) {
  const { historico, registrarColaboradorNoStatus, calcularTempoParcialOS, calcularTempoTotalConcluido } = useOrdensServico();
  const { isColaborador, usuario } = useAuth();
  const { toast } = useToast();
  
  const [colaboradorInput, setColaboradorInput] = useState('');
  const [statusParaAtualizar, setStatusParaAtualizar] = useState<string | null>(null);

  const formatarData = (data: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarDataSomente = (data: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  // Obter fluxo de status baseado na atividade principal
  const fluxoStatus = STATUS_POR_ATIVIDADE[os.atividadePrincipal] || STATUS_POR_ATIVIDADE.rebobinar;
  
  // Calcular índice do status atual para a barra de progresso
  const statusIndex = fluxoStatus.indexOf(os.status);
  const progressoPercent = os.status === 'aguardando_material' 
    ? 0 
    : statusIndex >= 0 ? ((statusIndex + 1) / fluxoStatus.length) * 100 : 0;

  // Tempo parcial geral
  const tempoParcialGeral = calcularTempoParcialOS(os.id);
  
  // Tempo total (para OS concluída)
  const tempoTotalConcluido = os.status === 'concluido' ? calcularTempoTotalConcluido(os.id) : 0;

  // Histórico atualizado (usa o historico do hook diretamente para reagir às mudanças)
  const historicoAtualizado = historico
    .filter(h => h.osId === os.id)
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

  // Calcular tempo parcial acumulado até cada etapa
  // REGRA: Apenas exibe. Nunca salva. Usa tempos salvos para status passados, calcula em tempo real apenas para status atual.
  const calcularTempoParcialAteEtapa = (etapaIndex: number): number => {
    let tempoParcial = 0;
    
    for (let i = 0; i <= etapaIndex; i++) {
      const status = fluxoStatus[i];
      const h = historicoAtualizado.find(hist => hist.statusNovo === status);
      const isAtual = os.status === status;
      
      if (h) {
        if (isAtual && os.status !== 'concluido') {
          // Status atual em andamento: calcular em tempo real (visual apenas)
          const inicio = new Date(h.dataHora);
          const fim = new Date();
          tempoParcial += calcularTempoUtil(inicio, fim);
        } else if (h.tempoNoStatus !== null && h.tempoNoStatus !== undefined) {
          // Status passado: usar tempo salvo (nunca recalcular)
          tempoParcial += h.tempoNoStatus;
        }
        // Se status passado mas tempoNoStatus é null, não soma (não foi salvo ainda)
      } else if (isAtual && os.status !== 'concluido') {
        // Não tem histórico mas está no status atual: calcular desde criação da OS (visual apenas)
        const inicio = new Date(os.createdAt);
        const fim = new Date();
        tempoParcial += calcularTempoUtil(inicio, fim);
      }
    }
    
    return tempoParcial;
  };

  const handleRegistrarColaborador = async (statusIndex: number) => {
    if (!colaboradorInput.trim()) {
      toast({
        title: 'Erro',
        description: 'Selecione o nome do colaborador',
        variant: 'destructive'
      });
      return;
    }

    const status = fluxoStatus[statusIndex];
    try {
      await registrarColaboradorNoStatus(
        os.id,
        status,
        usuario?.colaboradorId || '',
        colaboradorInput.trim()
      );

      toast({
        title: 'Colaborador registrado',
        description: `${colaboradorInput} registrado em ${STATUS_LABELS[status]}. Tempo calculado.`
      });

      setColaboradorInput('');
      setStatusParaAtualizar(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o colaborador',
        variant: 'destructive'
      });
      console.error(error);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-3">
              <span className="text-2xl font-mono text-blue-400">{os.numero}</span>
              <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                {STATUS_LABELS[os.status]}
              </Badge>
              <Badge className={`${PRIORIDADE_COLORS[os.prioridade] || 'bg-gray-500'} text-white`}>
                {PRIORIDADE_LABELS[os.prioridade] || 'Normal'}
              </Badge>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Card de Tempo - Exibir tempo total quando concluído */}
          {os.status === 'concluido' ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <span className="text-green-400 font-semibold text-lg">Processo Concluído</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Timer className="w-5 h-5 text-green-300" />
                <span className="text-2xl font-bold text-white">
                  Tempo Total: {formatarTempoUtil(tempoTotalConcluido)}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Barra de Progresso */}
              {os.status !== 'aguardando_material' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progresso - {ATIVIDADE_LABELS[os.atividadePrincipal]}</span>
                    <span>{Math.round(progressoPercent)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${progressoPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{STATUS_LABELS[fluxoStatus[0]]}</span>
                    <span className="text-green-400">{STATUS_LABELS[fluxoStatus[fluxoStatus.length - 1]]}</span>
                  </div>
                </div>
              )}

              {/* Tempo Parcial Geral */}
              <div className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300">Tempo Parcial Geral:</span>
                </div>
                <span className="text-xl font-bold text-white">{formatarTempoUtil(tempoParcialGeral)}</span>
              </div>
            </>
          )}

          <Separator className="bg-slate-700" />

          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Dados do Cliente
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-blue-400 mt-1" />
                  <div>
                    <p className="text-white font-medium">{os.cliente}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Dados do Motor
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Wrench className="w-4 h-4 text-orange-400 mt-1" />
                  <div>
                    <p className="text-white font-medium">{os.tipoMotor}</p>
                    <p className="text-sm text-slate-400">{ATIVIDADE_LABELS[os.atividadePrincipal]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Atividade Secundária */}
          {os.atividadeSecundaria && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Atividade Secundária
              </h3>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap">{os.atividadeSecundaria}</p>
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Data de Entrada</span>
              </div>
              <p className="text-white font-medium">{formatarData(os.dataEntrada)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Data de Autorização</span>
              </div>
              <p className="text-white font-medium">
                {os.dataAutorizacao 
                  ? formatarDataSomente(os.dataAutorizacao)
                  : 'Não definida'
                }
              </p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Previsão de Entrega</span>
              </div>
              <p className="text-white font-medium">
                {os.previsaoEntrega 
                  ? formatarDataSomente(os.previsaoEntrega)
                  : 'Não definida'
                }
              </p>
            </div>
          </div>

          {/* Retrabalho */}
          {os.retrabalho && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-yellow-400" />
                Retrabalho
              </h3>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-200 whitespace-pre-wrap">{os.retrabalho}</p>
              </div>
            </div>
          )}

          {/* Observações */}
          {os.observacoes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Observações
              </h3>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-slate-300 whitespace-pre-wrap">{os.observacoes}</p>
              </div>
            </div>
          )}

          <Separator className="bg-slate-700" />

          {/* Timeline de Produção */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Linha do Tempo de Produção
            </h3>
            
            <div className="space-y-3">
              {fluxoStatus.map((status, index) => {
                const historicoDoStatus = historicoAtualizado.find(h => h.statusNovo === status);
                const isAtual = os.status === status;
                const isPassado = fluxoStatus.indexOf(os.status) > index;
                const isFuturo = fluxoStatus.indexOf(os.status) < index;
                const isConcluido = status === 'concluido';
                const tempoParcialAteAqui = calcularTempoParcialAteEtapa(index);
                
                // Calcular tempo do setor (apenas exibição, nunca salva)
                // REGRA: Se tempoNoStatus existe → exibir tempo salvo. Se for status atual e tempoNoStatus for null → calcular em tempo real.
                let tempoSetor: number | undefined = undefined;
                
                if (historicoDoStatus) {
                  if (historicoDoStatus.tempoNoStatus !== null && historicoDoStatus.tempoNoStatus !== undefined) {
                    // Tem tempo salvo: usar tempo salvo (nunca recalcular)
                    tempoSetor = historicoDoStatus.tempoNoStatus;
                  } else if (isAtual && !isConcluido) {
                    // Status atual sem tempo salvo: calcular em tempo real (visual apenas)
                    const inicio = new Date(historicoDoStatus.dataHora);
                    const fim = new Date();
                    tempoSetor = calcularTempoUtil(inicio, fim);
                  }
                  // Se status passado mas tempoNoStatus é null, não exibe (não foi salvo ainda)
                } else if (isAtual && !isConcluido) {
                  // Não tem histórico mas está no status atual: calcular desde criação da OS (visual apenas)
                  const inicio = new Date(os.createdAt);
                  const fim = new Date();
                  tempoSetor = calcularTempoUtil(inicio, fim);
                }
                
                return (
                  <div 
                    key={status}
                    className={`flex items-start gap-4 relative ${isFuturo ? 'opacity-50' : ''}`}
                  >
                    {/* Linha conectora */}
                    {index < fluxoStatus.length - 1 && (
                      <div className={`absolute left-[11px] top-6 w-0.5 h-full ${isPassado ? 'bg-green-500' : 'bg-slate-700'}`} />
                    )}
                    
                    {/* Bolinha */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                      isAtual 
                        ? 'bg-blue-500 ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800' 
                        : isPassado 
                          ? 'bg-green-500' 
                          : 'bg-slate-600'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${STATUS_COLORS[status]} text-white`}>
                          {STATUS_LABELS[status]}
                        </Badge>
                        {tempoSetor !== undefined && tempoSetor >= 0 && (
                          <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">
                            Setor: {formatarTempoUtil(tempoSetor)}
                          </span>
                        )}
                        {(isPassado || isAtual) && tempoParcialAteAqui > 0 && (
                          <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                            Parcial: {formatarTempoUtil(tempoParcialAteAqui)}
                          </span>
                        )}
                      </div>
                      
                      {/* Mostrar colaborador se já registrado */}
                      {historicoDoStatus && historicoDoStatus.colaboradorNome && historicoDoStatus.colaboradorNome !== 'Sistema' && (
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-white font-medium">{historicoDoStatus.colaboradorNome}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{formatarData(historicoDoStatus.dataHora)}</span>
                        </div>
                      )}
                      
                      {/* Input para adicionar colaborador - NÃO mostrar na etapa concluído */}
                      {isColaborador && isAtual && !isConcluido && statusParaAtualizar === status && (
                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                          <Select
                            value={colaboradorInput}
                            onValueChange={setColaboradorInput}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-sm">
                              <SelectValue placeholder="Selecionar colaborador" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {RESPONSAVEIS_SETOR.map((nome) => (
                                <SelectItem key={nome} value={nome} className="text-white">
                                  {nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleRegistrarColaborador(index)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Registrar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setStatusParaAtualizar(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Botão para adicionar colaborador - NÃO mostrar na etapa concluído */}
                      {isColaborador && isAtual && !isConcluido && !statusParaAtualizar && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="mt-1 text-xs text-slate-400 hover:text-white"
                          onClick={() => setStatusParaAtualizar(status)}
                        >
                          + Adicionar colaborador
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
