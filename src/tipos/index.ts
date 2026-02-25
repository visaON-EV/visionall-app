// Atividade Principal
export const ATIVIDADES_PRINCIPAIS = [
  'rebobinar',
  'rejuvenescer',
  'manutencao_mecanica',
  'balanceamento'
] as const;

export type AtividadePrincipal = typeof ATIVIDADES_PRINCIPAIS[number];

export const ATIVIDADE_LABELS: Record<AtividadePrincipal, string> = {
  rebobinar: 'Rebobinar',
  rejuvenescer: 'Rejuvenescer',
  manutencao_mecanica: 'Manutenção Mecânica',
  balanceamento: 'Balanceamento'
};

// Prioridades
export const PRIORIDADES = ['normal', 'alta', 'emergencia'] as const;
export type Prioridade = typeof PRIORIDADES[number];

export const PRIORIDADE_LABELS: Record<Prioridade, string> = {
  normal: 'Normal',
  alta: 'Alta',
  emergencia: 'Emergência'
};

export const PRIORIDADE_COLORS: Record<Prioridade, string> = {
  normal: 'bg-green-500',
  alta: 'bg-yellow-500',
  emergencia: 'bg-red-500'
};

// Status das Ordens de Serviço (todos os possíveis)
export const ALL_STATUS = [
  'peritagem',
  'corte',
  'lavagem',
  'tratamento_carcaca',
  'rebobinar',
  'estufa',
  'impregnacao_estufa',
  'desmontagem',
  'montagem',
  'teste',
  'balanceamento',
  'pintura',
  'acabamento',
  'concluido',
  'aguardando_material'
] as const;

export type OSStatus = typeof ALL_STATUS[number];

export const STATUS_LABELS: Record<OSStatus, string> = {
  peritagem: 'Peritagem',
  corte: 'Corte',
  lavagem: 'Lavagem',
  tratamento_carcaca: 'Tratamento de Carcaça',
  rebobinar: 'Rebobinar',
  estufa: 'Estufa',
  impregnacao_estufa: 'Impregnação e Estufa',
  desmontagem: 'Desmontagem',
  montagem: 'Montagem',
  teste: 'Teste',
  balanceamento: 'Balanceamento',
  pintura: 'Pintura',
  acabamento: 'Acabamento',
  concluido: 'Concluído',
  aguardando_material: 'Aguardando Material Externo'
};

export const STATUS_COLORS: Record<OSStatus, string> = {
  peritagem: 'bg-blue-500',
  corte: 'bg-orange-500',
  lavagem: 'bg-cyan-500',
  tratamento_carcaca: 'bg-amber-600',
  rebobinar: 'bg-purple-500',
  estufa: 'bg-red-400',
  impregnacao_estufa: 'bg-red-500',
  desmontagem: 'bg-indigo-400',
  montagem: 'bg-indigo-500',
  teste: 'bg-yellow-500',
  balanceamento: 'bg-violet-500',
  pintura: 'bg-pink-500',
  acabamento: 'bg-teal-500',
  concluido: 'bg-green-500',
  aguardando_material: 'bg-gray-500'
};

// Fluxo de status por atividade principal (sem peritagem)
export const STATUS_POR_ATIVIDADE: Record<AtividadePrincipal, OSStatus[]> = {
  rebobinar: ['corte', 'lavagem', 'tratamento_carcaca', 'rebobinar', 'impregnacao_estufa', 'montagem', 'teste', 'pintura', 'acabamento', 'concluido'],
  rejuvenescer: ['lavagem', 'estufa', 'impregnacao_estufa', 'montagem', 'teste', 'pintura', 'acabamento', 'concluido'],
  manutencao_mecanica: ['desmontagem', 'montagem', 'teste', 'pintura', 'acabamento', 'concluido'],
  balanceamento: ['lavagem', 'balanceamento', 'pintura', 'acabamento', 'concluido']
};

// Legado para compatibilidade
export const OS_STATUS = ALL_STATUS;

// Ordem de Serviço
export interface OrdemServico {
  id: string;
  numero: string;
  cliente: string;
  tipoMotor: string;
  atividadePrincipal: AtividadePrincipal;
  atividadeSecundaria: string;
  prioridade: Prioridade;
  dataEntrada: string;
  dataAutorizacao: string;
  previsaoEntrega: string;
  status: OSStatus;
  observacoes: string;
  retrabalho: string;
  colaboradorAtual?: string;
  motivoAtraso?: string; // Campo editável para motivo do atraso
  setorAtraso?: string; // Campo editável para setor do atraso
  createdAt: string;
  updatedAt: string;
}

// Histórico de Status
export interface HistoricoStatus {
  id: string;
  osId: string;
  statusAnterior: OSStatus | null;
  statusNovo: OSStatus;
  colaboradorId: string;
  colaboradorNome: string;
  dataHora: string;
  tempoNoStatus?: number; // em minutos úteis
}

// Colaborador
export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  setor: string;
  ativo: boolean;
  createdAt: string;
}

// Usuário do sistema
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: 'colaborador' | 'visitante';
  colaboradorId?: string;
}

// Tempo por Setor
export interface TempoSetor {
  setor: OSStatus;
  tempoTotal: number; // em minutos
  quantidade: number;
}

// Tempo por Colaborador
export interface TempoColaborador {
  colaboradorId: string;
  colaboradorNome: string;
  tempoTotal: number; // em minutos
  osAtendidas: number;
}

// Feriados brasileiros (pode ser expandido)
export const FERIADOS_2024 = [
  '2024-01-01', // Confraternização Universal
  '2024-02-12', // Carnaval
  '2024-02-13', // Carnaval
  '2024-03-29', // Sexta-feira Santa
  '2024-04-21', // Tiradentes
  '2024-05-01', // Dia do Trabalhador
  '2024-05-30', // Corpus Christi
  '2024-09-07', // Independência
  '2024-10-12', // Nossa Senhora Aparecida
  '2024-11-02', // Finados
  '2024-11-15', // Proclamação da República
  '2024-12-25', // Natal
];

export const FERIADOS_2025 = [
  '2025-01-01',
  '2025-03-03',
  '2025-03-04',
  '2025-04-18',
  '2025-04-21',
  '2025-05-01',
  '2025-06-19',
  '2025-09-07',
  '2025-10-12',
  '2025-11-02',
  '2025-11-15',
  '2025-12-25',
];

export const FERIADOS_2026 = [
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-04-03',
  '2026-04-21',
  '2026-05-01',
  '2026-06-04',
  '2026-09-07',
  '2026-10-12',
  '2026-11-02',
  '2026-11-15',
  '2026-12-25',
];

export const TODOS_FERIADOS = [...FERIADOS_2024, ...FERIADOS_2025, ...FERIADOS_2026];

export const RESPONSAVEIS_SETOR = [
  'Italo',
  'Sebastião',
  'Darthan',
  'Jaconias',
  'Rodrigues',
  'José Barros',
  'Antônio Barros',
  'Rodrigo',
  'Rosieth',
  'Leandro',
  'Mônica',
  'Gabriel Leite',
  'Rafael',
  'Edmilson',
  'Stênio',
  'Igor',
  'Wannayara'
] as const;
