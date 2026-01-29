import { useState, useEffect } from 'react';
import { ConfiguracaoExpediente, CONFIGURACAO_PADRAO } from '@/tipos/configuracao';

const STORAGE_KEY = 'visionall_config_expediente';

export function useConfiguracaoExpediente() {
  const [configuracao, setConfiguracaoState] = useState<ConfiguracaoExpediente>(CONFIGURACAO_PADRAO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setConfiguracaoState(JSON.parse(stored));
      } catch {
        setConfiguracaoState(CONFIGURACAO_PADRAO);
      }
    }
    setLoading(false);
  }, []);

  const salvarConfiguracao = (novaConfig: ConfiguracaoExpediente) => {
    setConfiguracaoState(novaConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaConfig));
  };

  const resetarConfiguracao = () => {
    setConfiguracaoState(CONFIGURACAO_PADRAO);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CONFIGURACAO_PADRAO));
  };

  return {
    configuracao,
    loading,
    salvarConfiguracao,
    resetarConfiguracao
  };
}

// Função utilitária para obter configuração atual (uso em funções não-React)
export function getConfiguracaoExpediente(): ConfiguracaoExpediente {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return CONFIGURACAO_PADRAO;
    }
  }
  return CONFIGURACAO_PADRAO;
}
