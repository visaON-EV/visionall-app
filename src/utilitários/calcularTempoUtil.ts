import { TODOS_FERIADOS } from '@/tipos';
import { getConfiguracaoExpediente } from '@/ganchos/useConfiguracaoExpediente';

/**
 * Calcula o tempo útil de trabalho em minutos entre duas datas
 * Considerando:
 * - Segunda a sexta apenas
 * - Horários configuráveis de expediente
 * - Exclui sábados, domingos e feriados
 */

function getHorariosExpediente() {
  const config = getConfiguracaoExpediente();
  
  const toMinutos = (hora: string) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const INICIO_MANHA = toMinutos(config.inicioManha);
  const FIM_MANHA = toMinutos(config.fimManha);
  const INICIO_TARDE = toMinutos(config.inicioTarde);
  const FIM_TARDE = toMinutos(config.fimTarde);
  const MINUTOS_POR_DIA = (FIM_MANHA - INICIO_MANHA) + (FIM_TARDE - INICIO_TARDE);

  return { INICIO_MANHA, FIM_MANHA, INICIO_TARDE, FIM_TARDE, MINUTOS_POR_DIA };
}

function formatarDataParaString(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function ehFeriado(data: Date): boolean {
  const dataString = formatarDataParaString(data);
  return TODOS_FERIADOS.includes(dataString);
}

function ehDiaUtil(data: Date): boolean {
  const diaSemana = data.getDay();
  // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) return false;
  if (ehFeriado(data)) return false;
  return true;
}

function minutosDodia(data: Date): number {
  return data.getHours() * 60 + data.getMinutes();
}

function minutosUteisnoDia(minutoInicio: number, minutoFim: number): number {
  const { INICIO_MANHA, FIM_MANHA, INICIO_TARDE, FIM_TARDE } = getHorariosExpediente();
  let minutos = 0;
  
  // Período da manhã
  const inicioManha = Math.max(minutoInicio, INICIO_MANHA);
  const fimManha = Math.min(minutoFim, FIM_MANHA);
  if (fimManha > inicioManha) {
    minutos += fimManha - inicioManha;
  }
  
  // Período da tarde
  const inicioTarde = Math.max(minutoInicio, INICIO_TARDE);
  const fimTarde = Math.min(minutoFim, FIM_TARDE);
  if (fimTarde > inicioTarde) {
    minutos += fimTarde - inicioTarde;
  }
  
  return minutos;
}

export function calcularTempoUtil(dataInicio: Date | string, dataFim: Date | string): number {
  const { INICIO_MANHA, FIM_TARDE, MINUTOS_POR_DIA } = getHorariosExpediente();
  
  const inicio = typeof dataInicio === 'string' ? new Date(dataInicio) : dataInicio;
  const fim = typeof dataFim === 'string' ? new Date(dataFim) : dataFim;
  
  if (fim <= inicio) return 0;
  
  let totalMinutos = 0;
  const dataAtual = new Date(inicio);
  
  // Se mesmo dia
  if (formatarDataParaString(inicio) === formatarDataParaString(fim)) {
    if (!ehDiaUtil(inicio)) return 0;
    return minutosUteisnoDia(minutosDodia(inicio), minutosDodia(fim));
  }
  
  // Primeiro dia (parcial)
  if (ehDiaUtil(inicio)) {
    totalMinutos += minutosUteisnoDia(minutosDodia(inicio), FIM_TARDE);
  }
  
  // Avançar para o próximo dia
  dataAtual.setDate(dataAtual.getDate() + 1);
  dataAtual.setHours(0, 0, 0, 0);
  
  // Dias completos no meio
  while (formatarDataParaString(dataAtual) < formatarDataParaString(fim)) {
    if (ehDiaUtil(dataAtual)) {
      totalMinutos += MINUTOS_POR_DIA;
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  // Último dia (parcial)
  if (formatarDataParaString(dataAtual) === formatarDataParaString(fim)) {
    if (ehDiaUtil(fim)) {
      totalMinutos += minutosUteisnoDia(INICIO_MANHA, minutosDodia(fim));
    }
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

  if (minutos < 60) return `${minutos} min`;
  
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
}
