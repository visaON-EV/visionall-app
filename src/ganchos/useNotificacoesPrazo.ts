import { useEffect, useRef, useCallback, useState } from 'react';
import { OrdemServico } from '@/tipos';
import { toast } from 'sonner';

interface OSProximaDoPrazo {
  os: OrdemServico;
  diasRestantes: number;
  tipo: 'urgente' | 'atencao' | 'proximo';
}

function parseDateOnlyLocal(valor: string): Date | null {
  if (!valor) return null;

  const apenasData = valor.includes('T') ? valor.slice(0, 10) : valor;
  const partes = apenasData.split('-').map(Number);

  if (partes.length !== 3 || partes.some((p) => Number.isNaN(p))) {
    const fallback = new Date(valor);
    if (Number.isNaN(fallback.getTime())) return null;
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }

  const [ano, mes, dia] = partes;
  return new Date(ano, mes - 1, dia);
}

export function useNotificacoesPrazo(ordens: OrdemServico[]) {
  const notificacoesExibidasRef = useRef<Set<string>>(new Set());
  const [osProximasDoPrazo, setOsProximasDoPrazo] = useState<OSProximaDoPrazo[]>([]);

  const verificarPrazos = useCallback(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const osEmAndamento = ordens.filter((os) => os.status !== 'concluido' && os.previsaoEntrega);

    const proximas: OSProximaDoPrazo[] = [];

    osEmAndamento.forEach((os) => {
      const previsao = parseDateOnlyLocal(os.previsaoEntrega);
      if (!previsao) return;

      const diffTime = previsao.getTime() - hoje.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Regra: atraso apenas depois do dia de entrega.
      const notificationKey = `${os.id}-${diffDays < 0 ? 'vencido' : diffDays <= 1 ? 'urgente' : diffDays <= 3 ? 'atencao' : 'proximo'}`;

      if (diffDays < 0) {
        proximas.push({ os, diasRestantes: diffDays, tipo: 'urgente' });

        if (!notificacoesExibidasRef.current.has(notificationKey)) {
          toast.error(`PRAZO VENCIDO: O.S. ${os.numero}`, {
            description: `Cliente: ${os.cliente} - Previsao era ${new Date(os.previsaoEntrega).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`,
            duration: 10000,
          });
          notificacoesExibidasRef.current.add(notificationKey);
        }
      } else if (diffDays === 0) {
        proximas.push({ os, diasRestantes: diffDays, tipo: 'urgente' });

        if (!notificacoesExibidasRef.current.has(notificationKey)) {
          toast.warning(`VENCE HOJE: O.S. ${os.numero}`, {
            description: `Cliente: ${os.cliente}`,
            duration: 8000,
          });
          notificacoesExibidasRef.current.add(notificationKey);
        }
      } else if (diffDays === 1) {
        proximas.push({ os, diasRestantes: diffDays, tipo: 'urgente' });

        if (!notificacoesExibidasRef.current.has(notificationKey)) {
          toast.warning(`VENCE AMANHA: O.S. ${os.numero}`, {
            description: `Cliente: ${os.cliente}`,
            duration: 8000,
          });
          notificacoesExibidasRef.current.add(notificationKey);
        }
      } else if (diffDays <= 3) {
        proximas.push({ os, diasRestantes: diffDays, tipo: 'atencao' });

        if (!notificacoesExibidasRef.current.has(notificationKey)) {
          toast.warning(`ATENCAO: O.S. ${os.numero} vence em ${diffDays} dias`, {
            description: `Cliente: ${os.cliente}`,
            duration: 6000,
          });
          notificacoesExibidasRef.current.add(notificationKey);
        }
      } else if (diffDays <= 5) {
        proximas.push({ os, diasRestantes: diffDays, tipo: 'proximo' });
      }
    });

    proximas.sort((a, b) => a.diasRestantes - b.diasRestantes);
    setOsProximasDoPrazo(proximas);

    return proximas;
  }, [ordens]);

  useEffect(() => {
    verificarPrazos();
  }, [verificarPrazos]);

  useEffect(() => {
    const interval = setInterval(() => {
      verificarPrazos();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [verificarPrazos]);

  return {
    osProximasDoPrazo,
    verificarPrazos,
    totalAlertas: osProximasDoPrazo.length,
    alertasUrgentes: osProximasDoPrazo.filter((o) => o.tipo === 'urgente').length,
    alertasAtencao: osProximasDoPrazo.filter((o) => o.tipo === 'atencao').length,
  };
}
