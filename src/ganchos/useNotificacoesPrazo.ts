import { useEffect, useRef, useCallback, useState } from 'react';
import { OrdemServico } from '@/tipos';
import { toast } from 'sonner';
import { AlertTriangle, Clock } from 'lucide-react';

interface OSProximaDoPrazo {
  os: OrdemServico;
  diasRestantes: number;
  tipo: 'urgente' | 'atencao' | 'proximo';
}

export function useNotificacoesPrazo(ordens: OrdemServico[]) {
  const notificacoesExibidasRef = useRef<Set<string>>(new Set());
  const [osProximasDoPrazo, setOsProximasDoPrazo] = useState<OSProximaDoPrazo[]>([]);

  const verificarPrazos = useCallback(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const osEmAndamento = ordens.filter(os => 
      os.status !== 'concluido' && 
      os.previsaoEntrega
    );

    const proximas: OSProximaDoPrazo[] = [];

    osEmAndamento.forEach(os => {
      const previsao = new Date(os.previsaoEntrega);
      previsao.setHours(23, 59, 59, 999);
      
      const diffTime = previsao.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Verificar se já foi notificado na sessão atual
      const notificationKey = `${os.id}-${diffDays <= 0 ? 'vencido' : diffDays <= 1 ? 'urgente' : diffDays <= 3 ? 'atencao' : 'proximo'}`;
      
      if (diffDays <= 0) {
        // Prazo vencido ou vencendo hoje
        proximas.push({ os, diasRestantes: diffDays, tipo: 'urgente' });
        
        if (!notificacoesExibidasRef.current.has(notificationKey)) {
          toast.error(`⚠️ PRAZO VENCIDO: O.S. ${os.numero}`, {
            description: `Cliente: ${os.cliente} - Previsão era ${new Date(os.previsaoEntrega).toLocaleDateString('pt-BR')}`,
            duration: 10000,
          });
          notificacoesExibidasRef.current.add(notificationKey);
        }
      } else if (diffDays === 1) {
        // Vence amanhã
        proximas.push({ os, diasRestantes: diffDays, tipo: 'urgente' });
        
        if (!notificacoesExibidasRef.current.has(notificationKey)) {
          toast.warning(`🔴 VENCE AMANHÃ: O.S. ${os.numero}`, {
            description: `Cliente: ${os.cliente}`,
            duration: 8000,
          });
          notificacoesExibidasRef.current.add(notificationKey);
        }
      } else if (diffDays <= 3) {
        // Vence em até 3 dias
        proximas.push({ os, diasRestantes: diffDays, tipo: 'atencao' });
        
        if (!notificacoesExibidasRef.current.has(notificationKey)) {
          toast.warning(`🟡 ATENÇÃO: O.S. ${os.numero} vence em ${diffDays} dias`, {
            description: `Cliente: ${os.cliente}`,
            duration: 6000,
          });
          notificacoesExibidasRef.current.add(notificationKey);
        }
      } else if (diffDays <= 5) {
        // Vence em até 5 dias (apenas lista, sem toast)
        proximas.push({ os, diasRestantes: diffDays, tipo: 'proximo' });
      }
    });

    // Ordenar por dias restantes (mais urgentes primeiro)
    proximas.sort((a, b) => a.diasRestantes - b.diasRestantes);
    setOsProximasDoPrazo(proximas);

    return proximas;
  }, [ordens]);

  // Verificar ao montar e quando ordens mudam
  useEffect(() => {
    verificarPrazos();
  }, [verificarPrazos]);

  // Verificar periodicamente (a cada 5 minutos)
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
    alertasUrgentes: osProximasDoPrazo.filter(o => o.tipo === 'urgente').length,
    alertasAtencao: osProximasDoPrazo.filter(o => o.tipo === 'atencao').length,
  };
}
