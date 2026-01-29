export interface ConfiguracaoExpediente {
  inicioManha: string; // formato "HH:mm"
  fimManha: string;
  inicioTarde: string;
  fimTarde: string;
}

export const CONFIGURACAO_PADRAO: ConfiguracaoExpediente = {
  inicioManha: "07:00",
  fimManha: "12:00",
  inicioTarde: "13:00",
  fimTarde: "17:00"
};
