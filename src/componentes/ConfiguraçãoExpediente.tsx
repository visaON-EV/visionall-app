import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/interfaces do usuario/cartão';
import { Button } from '@/componentes/interfaces do usuario/botão';
import { Input } from '@/componentes/interfaces do usuario/input';
import { Label } from '@/componentes/interfaces do usuario/label';
import { useConfiguracaoExpediente } from '@/ganchos/useConfiguracaoExpediente';
import { ConfiguracaoExpediente as ConfigType, CONFIGURACAO_PADRAO } from '@/tipos/configuracao';
import { toast } from 'sonner';
import { Clock, RotateCcw, Save } from 'lucide-react';

export function ConfiguracaoExpediente() {
  const { configuracao, salvarConfiguracao, resetarConfiguracao } = useConfiguracaoExpediente();
  const [form, setForm] = useState<ConfigType>(configuracao);

  useEffect(() => {
    setForm(configuracao);
  }, [configuracao]);

  const handleChange = (campo: keyof ConfigType, valor: string) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const validarHorarios = (): boolean => {
    const toMinutos = (hora: string) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const inicioManha = toMinutos(form.inicioManha);
    const fimManha = toMinutos(form.fimManha);
    const inicioTarde = toMinutos(form.inicioTarde);
    const fimTarde = toMinutos(form.fimTarde);

    if (inicioManha >= fimManha) {
      toast.error('Início da manhã deve ser antes do fim da manhã');
      return false;
    }
    if (fimManha >= inicioTarde) {
      toast.error('Fim da manhã deve ser antes do início da tarde (intervalo de almoço)');
      return false;
    }
    if (inicioTarde >= fimTarde) {
      toast.error('Início da tarde deve ser antes do fim da tarde');
      return false;
    }

    return true;
  };

  const handleSalvar = () => {
    if (!validarHorarios()) return;
    
    salvarConfiguracao(form);
    toast.success('Horários de expediente salvos com sucesso!');
  };

  const handleResetar = () => {
    resetarConfiguracao();
    setForm(CONFIGURACAO_PADRAO);
    toast.info('Horários resetados para o padrão');
  };

  const calcularHorasUteis = () => {
    const toMinutos = (hora: string) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const minutosManha = toMinutos(form.fimManha) - toMinutos(form.inicioManha);
    const minutosTarde = toMinutos(form.fimTarde) - toMinutos(form.inicioTarde);
    const totalMinutos = minutosManha + minutosTarde;
    
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    
    return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horários de Expediente
        </CardTitle>
        <CardDescription>
          Configure os horários de trabalho para cálculo de tempo útil das O.S.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Período da Manhã */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium text-sm text-muted-foreground">Período da Manhã</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicioManha">Início</Label>
                <Input
                  id="inicioManha"
                  type="time"
                  value={form.inicioManha}
                  onChange={(e) => handleChange('inicioManha', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fimManha">Fim</Label>
                <Input
                  id="fimManha"
                  type="time"
                  value={form.fimManha}
                  onChange={(e) => handleChange('fimManha', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Período da Tarde */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium text-sm text-muted-foreground">Período da Tarde</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicioTarde">Início</Label>
                <Input
                  id="inicioTarde"
                  type="time"
                  value={form.inicioTarde}
                  onChange={(e) => handleChange('inicioTarde', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fimTarde">Fim</Label>
                <Input
                  id="fimTarde"
                  type="time"
                  value={form.fimTarde}
                  onChange={(e) => handleChange('fimTarde', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Total de horas úteis por dia:</span>{' '}
            <span className="text-primary font-bold">{calcularHorasUteis()}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Manhã: {form.inicioManha} às {form.fimManha} | 
            Almoço: {form.fimManha} às {form.inicioTarde} | 
            Tarde: {form.inicioTarde} às {form.fimTarde}
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleResetar}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar Padrão
          </Button>
          <Button onClick={handleSalvar}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
