import { TODOS_FERIADOS } from '@/tipos';
import { getConfiguracaoExpediente } from '@/ganchos/useConfiguracaoExpediente';

/**
 * Calcula o tempo útil (em minutos) entre duas datas,
 * considerando apenas horários de expediente, excluindo finais de semana e feriados.
 * 
 * @param inicio - Data/hora de início
 * @param fim - Data/hora de fim
 * @returns Tempo útil em minutos
 */
export function calcularTempoUtil(inicio: Date, fim: Date): number {
  if (fim <= inicio) {
    return 0;
  }

  const config = getConfiguracaoExpediente();
  
  // Converter horários para minutos do dia
  const toMinutos = (hora: string): number => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const inicioManha = toMinutos(config.inicioManha);
  const fimManha = toMinutos(config.fimManha);
  const inicioTarde = toMinutos(config.inicioTarde);
  const fimTarde = toMinutos(config.fimTarde);

  // Minutos úteis por dia
  const minutosUteisPorDia = (fimManha - inicioManha) + (fimTarde - inicioTarde);

  // Verificar se uma data é feriado
  const isFeriado = (data: Date): boolean => {
    const dataStr = data.toISOString().split('T')[0];
    return TODOS_FERIADOS.includes(dataStr);
  };

  // Verificar se é dia útil (não é sábado, domingo ou feriado)
  const isDiaUtil = (data: Date): boolean => {
    const diaSemana = data.getDay();
    return diaSemana !== 0 && diaSemana !== 6 && !isFeriado(data);
  };

  // Obter minutos do dia de uma data
  const getMinutosDoDia = (data: Date): number => {
    return data.getHours() * 60 + data.getMinutes();
  };

  // Calcular minutos úteis em um dia específico
  const calcularMinutosNoDia = (data: Date, inicioMinutos: number, fimMinutos: number): number => {
    const minutosDoDia = getMinutosDoDia(data);
    
    // Se está fora do horário de expediente, retornar 0
    if (minutosDoDia < inicioManha || (minutosDoDia >= fimManha && minutosDoDia < inicioTarde) || minutosDoDia >= fimTarde) {
      return 0;
    }

    let minutosUteis = 0;

    // Período da manhã
    if (inicioMinutos < fimManha && fimMinutos > inicioManha) {
      const inicioPeriodo = Math.max(inicioMinutos, inicioManha);
      const fimPeriodo = Math.min(fimMinutos, fimManha);
      if (fimPeriodo > inicioPeriodo) {
        minutosUteis += fimPeriodo - inicioPeriodo;
      }
    }

    // Período da tarde
    if (inicioMinutos < fimTarde && fimMinutos > inicioTarde) {
      const inicioPeriodo = Math.max(inicioMinutos, inicioTarde);
      const fimPeriodo = Math.min(fimMinutos, fimTarde);
      if (fimPeriodo > inicioPeriodo) {
        minutosUteis += fimPeriodo - inicioPeriodo;
      }
    }

    return minutosUteis;
  };

  // Normalizar datas para início do dia
  const inicioNormalizado = new Date(inicio);
  inicioNormalizado.setHours(0, 0, 0, 0);
  const fimNormalizado = new Date(fim);
  fimNormalizado.setHours(0, 0, 0, 0);

  let totalMinutos = 0;
  const dataAtual = new Date(inicioNormalizado);

  // Se início e fim são no mesmo dia
  if (inicioNormalizado.getTime() === fimNormalizado.getTime()) {
    if (isDiaUtil(dataAtual)) {
      const inicioMinutos = getMinutosDoDia(inicio);
      const fimMinutos = getMinutosDoDia(fim);
      return calcularMinutosNoDia(dataAtual, inicioMinutos, fimMinutos);
    }
    return 0;
  }

  // Primeiro dia (parcial)
  if (isDiaUtil(dataAtual)) {
    const inicioMinutos = getMinutosDoDia(inicio);
    totalMinutos += calcularMinutosNoDia(dataAtual, inicioMinutos, fimTarde);
  }

  // Avançar para o próximo dia
  dataAtual.setDate(dataAtual.getDate() + 1);

  // Dias completos
  while (dataAtual < fimNormalizado) {
    if (isDiaUtil(dataAtual)) {
      totalMinutos += minutosUteisPorDia;
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  // Último dia (parcial)
  if (dataAtual.getTime() === fimNormalizado.getTime() && isDiaUtil(dataAtual)) {
    const fimMinutos = getMinutosDoDia(fim);
    totalMinutos += calcularMinutosNoDia(dataAtual, inicioManha, fimMinutos);
  }

  return totalMinutos;
}

/**
 * Formata um tempo em minutos para uma string legível.
 * 
 * @param minutos - Tempo em minutos
 * @returns String formatada (ex: "5h 30min", "45min", "0min")
 */
export function formatarTempoUtil(minutos: number): string {
  if (minutos < 0) {
    return '0min';
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (horas === 0) {
    return `${minutosRestantes}min`;
  }

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutosRestantes}min`;
}
