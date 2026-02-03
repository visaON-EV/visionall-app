import { useState, useEffect, useCallback } from 'react';
import { OrdemServico, HistoricoStatus, OSStatus, AtividadePrincipal, STATUS_POR_ATIVIDADE } from '@/tipos';
import { calcularTempoUtil } from '@/utilitários/calcularTempoUtil';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';


//const STORAGE_KEY = 'visionall_ordens'; // remover
//const HISTORICO_KEY = 'visionall_historico'; // remover

function normalizarTexto(valor: unknown): string {
  return String(valor ?? '')
    .trim()
    .toLowerCase();
}

function normalizarAtividadePrincipal(valor: unknown): AtividadePrincipal {
  const v = normalizarTexto(valor);

  // aceita tanto os valores internos quanto os labels vindos do Firestore/UI
  if (v === 'rebobinar') return 'rebobinar';
  if (v === 'rejuvenescer') return 'rejuvenescer';
  if (v === 'manutencao_mecanica' || v === 'manutenção mecânica' || v === 'manutencao mecanica') return 'manutencao_mecanica';
  if (v === 'balanceamento') return 'balanceamento';

  // fallback seguro
  return 'rebobinar';
}

function normalizarStatus(valor: unknown): OSStatus {
  const v = normalizarTexto(valor);
  if (!v) return 'corte';

  // valores internos
  if (v === 'peritagem') return 'peritagem';
  if (v === 'corte') return 'corte';
  if (v === 'lavagem') return 'lavagem';
  if (v === 'tratamento_carcaca' || v === 'tratamento de carcaça' || v === 'tratamento carcaca' || v === 'tratamento de carcaca') return 'tratamento_carcaca';
  if (v === 'rebobinar') return 'rebobinar';
  if (v === 'estufa') return 'estufa';
  if (v === 'impregnacao_estufa' || v === 'impregnação e estufa' || v === 'impregnacao e estufa') return 'impregnacao_estufa';
  if (v === 'desmontagem') return 'desmontagem';
  if (v === 'montagem') return 'montagem';
  if (v === 'teste') return 'teste';
  if (v === 'balanceamento') return 'balanceamento';
  if (v === 'pintura') return 'pintura';
  if (v === 'acabamento') return 'acabamento';
  if (v === 'concluido' || v === 'concluído') return 'concluido';
  if (v === 'aguardando_material' || v === 'aguardando material externo') return 'aguardando_material';

  // fallback seguro
  return 'corte';
}

function normalizarPrioridade(valor: unknown): OrdemServico['prioridade'] {
  const v = normalizarTexto(valor);
  if (v === 'normal') return 'normal';
  if (v === 'alta') return 'alta';
  if (v === 'emergencia' || v === 'emergência') return 'emergencia';
  return 'normal';
}

function parseDateInputToLocal(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (dateStr.includes('T')) return new Date(dateStr);

  const partes = dateStr.split('-').map(Number);
  if (partes.length !== 3 || partes.some((p) => Number.isNaN(p))) {
    return new Date(dateStr);
  }

  const [ano, mes, dia] = partes;
  // Usa meio-dia para evitar problemas de fuso/DST ao salvar como Timestamp
  return new Date(ano, mes - 1, dia, 12, 0, 0, 0);
}

export function useOrdensServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [historico, setHistorico] = useState<HistoricoStatus[]>([]); // ainda apenas em memória
  const [loading, setLoading] = useState(true);

  // Carregar dados do localStorage
  useEffect(() => {
    setLoading(true);
  
    const q = query(
      collection(db, 'ordens_servico'),
      orderBy('createdAt', 'desc')
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordensFirestore: OrdemServico[] = snapshot.docs.map(doc => {
        const data = doc.data() as any;

        // Alguns campos no Firestore usam nomes diferentes dos do front.
        // Aqui fazemos o "mapeamento" para o formato da interface OrdemServico.

        const createdAtRaw =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt ?? new Date().toISOString();

        const updatedAtRaw =
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt ?? createdAtRaw;

        const ordem: OrdemServico = {
          id: doc.id,
          numero: String(data.numero ?? data.numeroOS ?? ''),
          cliente: String(data.cliente ?? data.clienteNome ?? ''),
          tipoMotor: String(data.tipoMotor ?? data.tipoMotorNome ?? data.motor ?? ''),
          atividadePrincipal: normalizarAtividadePrincipal(data.atividadePrincipal),
          atividadeSecundaria: data.atividadeSecundaria ?? '',
          prioridade: normalizarPrioridade(data.prioridade),
          dataEntrada:
            data.dataEntrada instanceof Timestamp
              ? data.dataEntrada.toDate().toISOString()
              : (data.dataEntrada ?? createdAtRaw),
          dataAutorizacao:
            data.dataAutorizacao instanceof Timestamp
              ? data.dataAutorizacao.toDate().toISOString()
              : (data.dataAutorizacao ?? ''),
          previsaoEntrega:
            data.previsaoEntrega instanceof Timestamp
              ? data.previsaoEntrega.toDate().toISOString()
              : (data.previsaoEntrega ?? ''),
          status: normalizarStatus(data.status ?? data.statusAtual),
          observacoes: data.observacoes ?? '',
          retrabalho: data.retrabalho ?? '',
          colaboradorAtual: data.colaboradorAtual,
          motivoAtraso: data.motivoAtraso,
          setorAtraso: data.setorAtraso,
          createdAt: createdAtRaw,
          updatedAt: updatedAtRaw
        };

        return ordem;
      });
  
      setOrdens(ordensFirestore);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  // Carregar histórico do Firestore (mantém nomes de colaboradores na timeline)
  useEffect(() => {
    const q = query(
      collection(db, 'historico_status'),
      orderBy('dataHora', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historicoFS: HistoricoStatus[] = snapshot.docs.map((d) => {
        const data = d.data() as any;

        const dataHora =
          data.dataHora instanceof Timestamp
            ? data.dataHora.toDate().toISOString()
            : (data.dataHora ?? new Date().toISOString());

        return {
          id: d.id,
          osId: String(data.osId ?? ''),
          statusAnterior: data.statusAnterior ? normalizarStatus(data.statusAnterior) : null,
          statusNovo: normalizarStatus(data.statusNovo),
          colaboradorId: String(data.colaboradorId ?? ''),
          colaboradorNome: String(data.colaboradorNome ?? ''),
          dataHora,
          tempoNoStatus: typeof data.tempoNoStatus === 'number' ? data.tempoNoStatus : undefined
        };
      });

      setHistorico(historicoFS);
    });

    return () => unsubscribe();
  }, []);

  // Atualizar ordens apenas no estado (sem localStorage)
  const salvarOrdens = useCallback((novasOrdens: OrdemServico[]) => {
    setOrdens(novasOrdens);
  }, []);

  // Atualizar histórico apenas no estado (sem localStorage)
  const salvarHistorico = useCallback((novoHistorico: HistoricoStatus[]) => {
    setHistorico(novoHistorico);
  }, []);

  // Obter status inicial baseado na atividade (agora sem peritagem)
  const getStatusInicial = (atividade: AtividadePrincipal): OSStatus => {
    const fluxo = STATUS_POR_ATIVIDADE[atividade];
    return fluxo[0];
  };

  // Criar nova OS (persiste no Firestore)
  const criarOS = useCallback(async (dados: Omit<OrdemServico, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const statusInicial = getStatusInicial(dados.atividadePrincipal);
    
    const novaOS: OrdemServico = {
      ...dados,
      id: crypto.randomUUID(),
      status: statusInicial,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const dataAutorizacaoDate = parseDateInputToLocal(novaOS.dataAutorizacao);
    const previsaoEntregaDate = parseDateInputToLocal(novaOS.previsaoEntrega);

    // Salva usando o id como id do documento, para ficar consistente no app
    const ref = doc(db, 'ordens_servico', novaOS.id);
    await setDoc(ref, {
      numero: novaOS.numero,
      cliente: novaOS.cliente,
      tipoMotor: novaOS.tipoMotor,
      atividadePrincipal: novaOS.atividadePrincipal,
      atividadeSecundaria: novaOS.atividadeSecundaria,
      prioridade: novaOS.prioridade,
      dataEntrada: novaOS.dataEntrada ? Timestamp.fromDate(new Date(novaOS.dataEntrada)) : serverTimestamp(),
      dataAutorizacao: dataAutorizacaoDate ? Timestamp.fromDate(dataAutorizacaoDate) : null,
      previsaoEntrega: previsaoEntregaDate ? Timestamp.fromDate(previsaoEntregaDate) : null,
      status: novaOS.status,
      observacoes: novaOS.observacoes,
      retrabalho: novaOS.retrabalho,
      colaboradorAtual: novaOS.colaboradorAtual ?? '',
      motivoAtraso: novaOS.motivoAtraso ?? '',
      setorAtraso: novaOS.setorAtraso ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Registrar no histórico (Firestore): 1 doc por OS+status
    // REGRA: Criar com tempoNoStatus = null (será salvo apenas ao mudar de status)
    const historicoId = `${novaOS.id}_${statusInicial}`;
    const dataHoraCriacao = Timestamp.fromDate(new Date(novaOS.createdAt));
    await setDoc(doc(db, 'historico_status', historicoId), {
      osId: novaOS.id,
      statusAnterior: null,
      statusNovo: statusInicial,
      colaboradorId: dados.colaboradorAtual || '',
      colaboradorNome: 'Sistema',
      dataHora: dataHoraCriacao,
      tempoNoStatus: null
    }, { merge: true });
    
    return novaOS;
  }, []);

  // Atualizar status da OS
  // REGRA: ÚNICO lugar autorizado a salvar tempo. Salva tempo do status anterior ao mudar de status.
  const atualizarStatus = useCallback(async (
    osId: string, 
    novoStatus: OSStatus, 
    colaboradorId: string, 
    colaboradorNome: string
  ) => {
    const osIndex = ordens.findIndex(o => o.id === osId);
    if (osIndex === -1) return null;
    
    const os = ordens[osIndex];
    const statusAnterior = os.status;
    
    // 1. Buscar o registro do status anterior (o primeiro, quando entrou no status)
    const registroStatusAnterior = historico
      .filter(h => h.osId === osId && h.statusNovo === statusAnterior)
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())[0];
    
    // 2. Calcular e salvar o tempo do status anterior (ÚNICO lugar que salva tempo)
    if (registroStatusAnterior) {
      const inicio = new Date(registroStatusAnterior.dataHora);
      const fim = new Date();
      const tempoNoStatus = calcularTempoUtil(inicio, fim);

      // Atualiza o tempo no Firestore (preservando colaborador e dataHora)
      await updateDoc(doc(db, 'historico_status', registroStatusAnterior.id), {
        tempoNoStatus
      });
    }
    
    // 3. Atualizar OS com novo status
    const osAtualizada: OrdemServico = {
      ...os,
      status: novoStatus,
      colaboradorAtual: colaboradorId,
      updatedAt: new Date().toISOString()
    };
    
    const ref = doc(db, 'ordens_servico', osId);
    await updateDoc(ref, {
      status: osAtualizada.status,
      colaboradorAtual: osAtualizada.colaboradorAtual ?? '',
      updatedAt: serverTimestamp()
    });
    
    // 4. Criar registro do novo status (com tempoNoStatus = null)
    const historicoId = `${osId}_${novoStatus}`;
    await setDoc(doc(db, 'historico_status', historicoId), {
      osId,
      statusAnterior,
      statusNovo: novoStatus,
      colaboradorId,
      colaboradorNome,
      dataHora: serverTimestamp(),
      tempoNoStatus: null
    }, { merge: true });
    
    return osAtualizada;
  }, [ordens, historico]);

  // Registrar colaborador no status atual (sem mudar de status)
  // REGRA: Apenas registra colaborador. NÃO calcula tempo. NÃO atualiza dataHora. NÃO salva tempoNoStatus.
  const registrarColaboradorNoStatus = useCallback(async (
    osId: string, 
    status: OSStatus,
    colaboradorId: string, 
    colaboradorNome: string
  ) => {
    // Buscar registro existente do status (para manter dataHora original)
    const registroExistente = historico
      .filter(h => h.osId === osId && h.statusNovo === status)
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())[0];
    
    const historicoId = `${osId}_${status}`;
    const dadosAtualizacao: any = {
      osId,
      statusNovo: status,
      colaboradorId,
      colaboradorNome
    };
    
    // Se já existe registro, manter dataHora original e tempoNoStatus existente
    if (registroExistente) {
      dadosAtualizacao.dataHora = registroExistente.dataHora;
      // Manter tempoNoStatus existente (não sobrescrever)
      if (registroExistente.tempoNoStatus !== null && registroExistente.tempoNoStatus !== undefined) {
        dadosAtualizacao.tempoNoStatus = registroExistente.tempoNoStatus;
      }
    } else {
      // Se não existe, criar novo registro com dataHora atual e tempoNoStatus = null
      const os = ordens.find(o => o.id === osId);
      dadosAtualizacao.dataHora = os && os.status === status 
        ? Timestamp.fromDate(new Date(os.createdAt))
        : serverTimestamp();
      dadosAtualizacao.tempoNoStatus = null;
    }
    
    await setDoc(doc(db, 'historico_status', historicoId), dadosAtualizacao, { merge: true });
    
    return true;
  }, [ordens, historico]);

  // Editar OS
  const editarOS = useCallback(async (id: string, dados: Partial<OrdemServico>) => {
    const osIndex = ordens.findIndex(o => o.id === id);
    if (osIndex === -1) return null;
    
    const osAtualizada = {
      ...ordens[osIndex],
      ...dados,
      updatedAt: new Date().toISOString()
    };
    
    const ref = doc(db, 'ordens_servico', id);
    await updateDoc(ref, {
      ...(dados.numero !== undefined ? { numero: String(dados.numero) } : {}),
      ...(dados.cliente !== undefined ? { cliente: String(dados.cliente) } : {}),
      ...(dados.tipoMotor !== undefined ? { tipoMotor: String(dados.tipoMotor) } : {}),
      ...(dados.atividadePrincipal !== undefined ? { atividadePrincipal: dados.atividadePrincipal } : {}),
      ...(dados.atividadeSecundaria !== undefined ? { atividadeSecundaria: dados.atividadeSecundaria } : {}),
      ...(dados.prioridade !== undefined ? { prioridade: dados.prioridade } : {}),
      ...(dados.dataEntrada !== undefined
        ? { dataEntrada: dados.dataEntrada ? Timestamp.fromDate(new Date(dados.dataEntrada)) : null }
        : {}),
      ...(dados.dataAutorizacao !== undefined
        ? {
          dataAutorizacao: dados.dataAutorizacao
            ? Timestamp.fromDate(parseDateInputToLocal(dados.dataAutorizacao) ?? new Date(dados.dataAutorizacao))
            : null
        }
        : {}),
      ...(dados.previsaoEntrega !== undefined
        ? {
          previsaoEntrega: dados.previsaoEntrega
            ? Timestamp.fromDate(parseDateInputToLocal(dados.previsaoEntrega) ?? new Date(dados.previsaoEntrega))
            : null
        }
        : {}),
      ...(dados.status !== undefined ? { status: dados.status } : {}),
      ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes } : {}),
      ...(dados.retrabalho !== undefined ? { retrabalho: dados.retrabalho } : {}),
      ...(dados.colaboradorAtual !== undefined ? { colaboradorAtual: dados.colaboradorAtual ?? '' } : {}),
      ...(dados.motivoAtraso !== undefined ? { motivoAtraso: dados.motivoAtraso ?? '' } : {}),
      ...(dados.setorAtraso !== undefined ? { setorAtraso: dados.setorAtraso ?? '' } : {}),
      updatedAt: serverTimestamp()
    });
    
    return osAtualizada;
  }, [ordens]);

  // Excluir OS
  const excluirOS = useCallback(async (id: string) => {
    const ref = doc(db, 'ordens_servico', id);
    await deleteDoc(ref);
    
    const novoHistorico = historico.filter(h => h.osId !== id);
    salvarHistorico(novoHistorico);
  }, [historico, salvarHistorico]);

  // Buscar OS por ID
  const buscarOS = useCallback((id: string) => {
    return ordens.find(o => o.id === id) || null;
  }, [ordens]);

  // Buscar histórico da OS
  const buscarHistoricoOS = useCallback((osId: string) => {
    return historico
      .filter(h => h.osId === osId)
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
  }, [historico]);

  // Contar OS por status
  const contarPorStatus = useCallback(() => {
    const contagem: Partial<Record<OSStatus, number>> = {};
    
    ordens.forEach(os => {
      contagem[os.status] = (contagem[os.status] || 0) + 1;
    });
    
    return contagem;
  }, [ordens]);

  // Contar OS por atividade principal
  const contarPorAtividade = useCallback(() => {
    const contagem: Record<AtividadePrincipal, number> = {
      rebobinar: 0,
      rejuvenescer: 0,
      manutencao_mecanica: 0,
      balanceamento: 0
    };
    
    ordens.forEach(os => {
      if (os.atividadePrincipal) {
        contagem[os.atividadePrincipal]++;
      }
    });
    
    return contagem;
  }, [ordens]);

  // Calcular tempo parcial de uma OS específica
  // REGRA: Soma todos os tempoNoStatus já salvos. Se existir status atual sem tempo salvo, calcula em tempo real.
  const calcularTempoParcialOS = useCallback((osId: string): number => {
    const historicoOS = historico.filter(h => h.osId === osId);
    const os = ordens.find(o => o.id === osId);
    if (!os) return 0;
    
    let tempoParcial = 0;
    
    // Obter fluxo de status
    const fluxoStatus = STATUS_POR_ATIVIDADE[os.atividadePrincipal] || [];
    const indexStatusAtual = fluxoStatus.indexOf(os.status);
    
    // Soma todos os status até o atual
    for (let i = 0; i <= indexStatusAtual && i < fluxoStatus.length; i++) {
      const status = fluxoStatus[i];
      const registroStatus = historicoOS
        .filter(h => h.statusNovo === status)
        .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())[0];
      
      if (registroStatus) {
        if (status === os.status && os.status !== 'concluido') {
          // Status atual em andamento: calcular em tempo real (não salvo ainda)
          const inicio = new Date(registroStatus.dataHora);
          const fim = new Date();
          tempoParcial += calcularTempoUtil(inicio, fim);
        } else if (registroStatus.tempoNoStatus !== null && registroStatus.tempoNoStatus !== undefined) {
          // Status passado: usar tempo salvo (nunca recalcular)
          tempoParcial += registroStatus.tempoNoStatus;
        }
        // Se status passado mas tempoNoStatus é null, não soma (não foi salvo ainda)
      }
    }
    
    return tempoParcial;
  }, [ordens, historico]);

  // Calcular tempo total quando concluído
  const calcularTempoTotalConcluido = useCallback((osId: string): number => {
    const historicoOS = historico.filter(h => h.osId === osId);
    let tempoTotal = 0;
    
    historicoOS.forEach(h => {
      if (h.tempoNoStatus) {
        tempoTotal += h.tempoNoStatus;
      }
    });
    
    return tempoTotal;
  }, [historico]);

  // Calcular tempo total de todos os equipamentos em produção
  const tempoTotalEmProducao = useCallback(() => {
    let tempoTotal = 0;
    
    ordens.forEach(os => {
      tempoTotal += calcularTempoParcialOS(os.id);
    });
    
    return tempoTotal;
  }, [ordens, calcularTempoParcialOS]);

  // Listar OS com retrabalho
  const listarRetrabalho = useCallback(() => {
    return ordens.filter(os => os.retrabalho && os.retrabalho.trim() !== '');
  }, [ordens]);

  // Relatório de conclusão no prazo com detalhes
  const relatorioPrazos = useCallback(() => {
    const concluidas = ordens.filter(os => os.status === 'concluido');
    
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
        noPrazo++; // Sem prazo definido conta como no prazo
        return;
      }
      
      const previsao = new Date(os.previsaoEntrega);
      const conclusao = new Date(os.updatedAt);
      
      // Normalizar datas para comparação (apenas data, sem horário)
      const previsaoNorm = new Date(previsao.getFullYear(), previsao.getMonth(), previsao.getDate(), 23, 59, 59);
      const conclusaoNorm = new Date(conclusao.getFullYear(), conclusao.getMonth(), conclusao.getDate());
      
      if (conclusaoNorm <= previsaoNorm) {
        noPrazo++;
      } else {
        foraDoPrazo++;
        
        // Encontrar setor onde ocorreu maior atraso
        const historicoOS = historico.filter(h => h.osId === os.id);
        let maiorTempo = 0;
        let setorMaiorTempo = 'Não identificado';
        
        historicoOS.forEach(h => {
          if (h.tempoNoStatus && h.tempoNoStatus > maiorTempo) {
            maiorTempo = h.tempoNoStatus;
            setorMaiorTempo = h.statusNovo;
          }
        });
        
        // Calcular dias de atraso (diferença de dias)
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
  }, [ordens, historico]);

  // Obter fluxo de status para uma OS
  const getFluxoStatus = useCallback((os: OrdemServico): OSStatus[] => {
    return STATUS_POR_ATIVIDADE[os.atividadePrincipal] || STATUS_POR_ATIVIDADE.rebobinar;
  }, []);

  // Próximo status válido para uma OS
  const getProximoStatus = useCallback((os: OrdemServico): OSStatus | null => {
    const fluxo = getFluxoStatus(os);
    const indexAtual = fluxo.indexOf(os.status);
    
    if (indexAtual === -1 || indexAtual >= fluxo.length - 1) {
      return null;
    }
    
    return fluxo[indexAtual + 1];
  }, [getFluxoStatus]);

  return {
    ordens,
    historico,
    loading,
    criarOS,
    atualizarStatus,
    registrarColaboradorNoStatus,
    editarOS,
    excluirOS,
    buscarOS,
    buscarHistoricoOS,
    contarPorStatus,
    contarPorAtividade,
    calcularTempoParcialOS,
    calcularTempoTotalConcluido,
    tempoTotalEmProducao,
    listarRetrabalho,
    relatorioPrazos,
    getFluxoStatus,
    getProximoStatus
  };
}
