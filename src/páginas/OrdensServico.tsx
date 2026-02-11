import { useState } from 'react';
import { useAuth } from '@/contextos/AuthContext';
import { useOrdensServico } from '@/ganchos/useOrdensServico';
import { 
  OrdemServico, 
  STATUS_LABELS, 
  STATUS_COLORS, 
  OSStatus,
  ATIVIDADES_PRINCIPAIS,
  ATIVIDADE_LABELS,
  PRIORIDADES,
  PRIORIDADE_LABELS,
  PRIORIDADE_COLORS,
  AtividadePrincipal,
  Prioridade,
  STATUS_POR_ATIVIDADE,
  RESPONSAVEIS_SETOR
} from '@/tipos';
import Layout from '@/componentes/Layout';
import { Button } from '@/componentes/interfaces do usuario/botão';
import { Input } from '@/componentes/interfaces do usuario/input';
import { Label } from '@/componentes/interfaces do usuario/label';
import { Textarea } from '@/componentes/interfaces do usuario/textarea';
import { Badge } from '@/componentes/interfaces do usuario/badge';
import { Checkbox } from '@/componentes/interfaces do usuario/checkbox';
import { Card, CardContent } from '@/componentes/interfaces do usuario/cartão';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/componentes/interfaces do usuario/diálogo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/interfaces do usuario/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/interfaces do usuario/tabela';
import { 
  Plus, 
  Search, 
  Edit, 
  Filter
} from 'lucide-react';
import { useToast } from '@/ganchos/use-toast';
import OSDetalhes from '@/componentes/OSDetalhes';

export default function OrdensServico() {
  const { isColaborador, usuario } = useAuth();
  const { ordens, criarOS, editarOS, atualizarStatus, getFluxoStatus } = useOrdensServico();
  const { toast } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [modalResponsavel, setModalResponsavel] = useState(false);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);
  const [osParaAtualizar, setOsParaAtualizar] = useState<OrdemServico | null>(null);
  const [statusNovo, setStatusNovo] = useState<OSStatus | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [responsaveisSelecionados, setResponsaveisSelecionados] = useState<string[]>([]);
  const [materialAguardandoInput, setMaterialAguardandoInput] = useState('');
  const [dataEntregaMaterialInput, setDataEntregaMaterialInput] = useState('');
  
  const formInicial = {
    numero: '',
    cliente: '',
    tipoMotor: '',
    semPedido: false,
    atividadePrincipal: 'rebobinar' as AtividadePrincipal,
    atividadeSecundaria: '',
    prioridade: 'normal' as Prioridade,
    dataAutorizacao: '',
    previsaoEntrega: '',
    observacoes: '',
    retrabalho: ''
  };

  const [formData, setFormData] = useState(formInicial);
  const [formEdicao, setFormEdicao] = useState<Partial<OrdemServico>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero.trim()) {
      toast({
        title: 'Erro',
        description: 'O nÃºmero da O.S. Ã© obrigatÃ³rio',
        variant: 'destructive'
      });
      return;
    }

    try {
      await criarOS({
        ...formData,
        dataEntrada: new Date().toISOString(),
        colaboradorAtual: usuario?.colaboradorId
      });

      toast({
        title: 'O.S. criada com sucesso!',
        description: `Ordem de serviÃ§o ${formData.numero} cadastrada`,
      });

      setFormData(formInicial);
      setModalAberto(false);
    } catch (error) {
      toast({
        title: 'Erro ao criar O.S.',
        description: 'NÃ£o foi possÃ­vel salvar no Firestore. Verifique permissÃµes/rede.',
        variant: 'destructive'
      });
      console.error(error);
    }
  };

  const handleEditar = (os: OrdemServico) => {
    setFormEdicao({
      numero: os.numero,
      cliente: os.cliente,
      tipoMotor: os.tipoMotor,
      semPedido: os.semPedido,
      atividadePrincipal: os.atividadePrincipal,
      atividadeSecundaria: os.atividadeSecundaria,
      prioridade: os.prioridade,
      dataAutorizacao: os.dataAutorizacao,
      previsaoEntrega: os.previsaoEntrega,
      observacoes: os.observacoes,
      retrabalho: os.retrabalho
    });
    setOsSelecionada(os);
    setModalEdicao(true);
  };

  const abrirDetalhesOS = (os: OrdemServico) => {
    setOsSelecionada(os);
    setDetalhesAberto(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osSelecionada) return;

    try {
      await editarOS(osSelecionada.id, formEdicao);

      toast({
        title: 'O.S. atualizada!',
        description: 'As alteraÃ§Ãµes foram salvas',
      });

      setModalEdicao(false);
      setOsSelecionada(null);
    } catch (error) {
      toast({
        title: 'Erro ao salvar ediÃ§Ã£o',
        description: 'NÃ£o foi possÃ­vel salvar no Firestore. Verifique permissÃµes/rede.',
        variant: 'destructive'
      });
      console.error(error);
    }
  };

  const abrirModalResponsavel = (os: OrdemServico, novoStatus: OSStatus) => {
    setOsParaAtualizar(os);
    setStatusNovo(novoStatus);
    setResponsaveisSelecionados([]);
    setMaterialAguardandoInput(novoStatus === 'aguardando_material' ? (os.materialAguardando || '') : '');
    setDataEntregaMaterialInput(novoStatus === 'aguardando_material' ? (os.dataEntregaMaterial || '') : '');
    setModalResponsavel(true);
  };

  const handleMudarStatus = async (os: OrdemServico, novoStatus: OSStatus) => {
    abrirModalResponsavel(os, novoStatus);
  };

  const alternarResponsavel = (nome: string, selecionado: boolean) => {
    setResponsaveisSelecionados((anteriores) => {
      if (selecionado) {
        if (anteriores.includes(nome)) return anteriores;
        return [...anteriores, nome];
      }
      return anteriores.filter((responsavel) => responsavel !== nome);
    });
  };

  const handleConfirmarResponsavel = async () => {
    if (!osParaAtualizar || !statusNovo) return;

    try {
      if (statusNovo === 'aguardando_material') {
        if (!materialAguardandoInput.trim() || !dataEntregaMaterialInput) {
          toast({
            title: 'Erro',
            description: 'Informe a peÃ§a/material aguardado e a data de entrega.',
            variant: 'destructive'
          });
          return;
        }

        await atualizarStatus(
          osParaAtualizar.id,
          statusNovo,
          usuario?.colaboradorId || '',
          usuario?.nome || 'Sistema',
          {
            materialAguardando: materialAguardandoInput.trim(),
            dataEntregaMaterial: dataEntregaMaterialInput
          }
        );
      } else {
        if (responsaveisSelecionados.length === 0) {
          toast({
            title: 'Erro',
            description: 'Selecione ao menos um responsÃ¡vel para o novo status.',
            variant: 'destructive'
          });
          return;
        }

        await atualizarStatus(
          osParaAtualizar.id,
          statusNovo,
          usuario?.colaboradorId || '',
          responsaveisSelecionados.join(', ')
        );
      }

      toast({
        title: 'Status atualizado!',
        description: `Alterado para: ${STATUS_LABELS[statusNovo]}`,
      });

      setModalResponsavel(false);
      setOsParaAtualizar(null);
      setStatusNovo(null);
      setResponsaveisSelecionados([]);
      setMaterialAguardandoInput('');
      setDataEntregaMaterialInput('');
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'NÃ£o foi possÃ­vel salvar no Firestore. Verifique permissÃµes/rede.',
        variant: 'destructive'
      });
      console.error(error);
    }
  };

  const ordensFiltradas = ordens.filter(os => {
    const matchStatus = filtroStatus === 'todos' || os.status === filtroStatus;
    const matchBusca = busca === '' || 
      os.numero.toLowerCase().includes(busca.toLowerCase()) ||
      os.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      os.tipoMotor.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  const formatarData = (data: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obter todos os status possÃ­veis para o filtro
  const todosStatus = [...new Set([
    ...Object.values(STATUS_POR_ATIVIDADE).flat(),
    'aguardando_material',
    'aguardando_execucao'
  ])];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Ordens de ServiÃ§o</h1>
            <p className="text-slate-400">Gerencie todas as O.S. do sistema</p>
          </div>
          
          {isColaborador && (
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova O.S.
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Nova Ordem de ServiÃ§o</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">NÃºmero da O.S. *</Label>
                      <Input
                        value={formData.numero}
                        onChange={(e) => setFormData({...formData, numero: e.target.value})}
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Ex: OS2025-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Cliente *</Label>
                      <Input
                        value={formData.cliente}
                        onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Nome do cliente"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tipo/Modelo do Motor *</Label>
                    <Input
                      value={formData.tipoMotor}
                      onChange={(e) => setFormData({...formData, tipoMotor: e.target.value})}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ex: WEG W22 3CV"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Atividade Principal *</Label>
                      <Select 
                        value={formData.atividadePrincipal} 
                        onValueChange={(value) => setFormData({...formData, atividadePrincipal: value as AtividadePrincipal})}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {ATIVIDADES_PRINCIPAIS.map(atividade => (
                            <SelectItem key={atividade} value={atividade} className="text-white">
                              {ATIVIDADE_LABELS[atividade]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Prioridade *</Label>
                      <Select 
                        value={formData.prioridade} 
                        onValueChange={(value) => setFormData({...formData, prioridade: value as Prioridade})}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {PRIORIDADES.map(prioridade => (
                            <SelectItem key={prioridade} value={prioridade} className="text-white">
                              {PRIORIDADE_LABELS[prioridade]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Atividade SecundÃ¡ria</Label>
                    <Textarea
                      value={formData.atividadeSecundaria}
                      onChange={(e) => setFormData({...formData, atividadeSecundaria: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Descreva atividades secundÃ¡rias se houver"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Data de AutorizaÃ§Ã£o</Label>
                      <Input
                        type="date"
                        value={formData.dataAutorizacao}
                        onChange={(e) => setFormData({...formData, dataAutorizacao: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">PrevisÃ£o de Entrega</Label>
                      <Input
                        type="date"
                        value={formData.previsaoEntrega}
                        onChange={(e) => setFormData({...formData, previsaoEntrega: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                    <Checkbox
                      id="sem-pedido"
                      checked={formData.semPedido}
                      onCheckedChange={(checked) => setFormData({ ...formData, semPedido: Boolean(checked) })}
                    />
                    <Label htmlFor="sem-pedido" className="text-amber-200 cursor-pointer">
                      Sem pedido de autorizacao
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Retrabalho</Label>
                    <Textarea
                      value={formData.retrabalho}
                      onChange={(e) => setFormData({...formData, retrabalho: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="InformaÃ§Ãµes sobre retrabalho (se aplicÃ¡vel)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">ObservaÃ§Ãµes</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="ObservaÃ§Ãµes adicionais"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setModalAberto(false)}
                      className="border-slate-600 text-slate-300"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Criar O.S.
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filtros */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Buscar por nÃºmero, cliente ou motor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="sm:w-64">
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="todos" className="text-white">Todos os status</SelectItem>
                    {todosStatus.map(status => (
                      <SelectItem key={status} value={status} className="text-white">
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de O.S. */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">NÃºmero</TableHead>
                    <TableHead className="text-slate-400">Cliente</TableHead>
                    <TableHead className="text-slate-400">Motor</TableHead>
                    <TableHead className="text-slate-400">Atividade</TableHead>
                    <TableHead className="text-slate-400">Prioridade</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right">AÃ§Ãµes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordensFiltradas.length > 0 ? (
                    ordensFiltradas.map(os => {
                      const fluxo = getFluxoStatus(os);
                      
                      return (
                        <TableRow 
                          key={os.id} 
                          className="border-slate-700 hover:bg-slate-700/30 cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => abrirDetalhesOS(os)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              abrirDetalhesOS(os);
                            }
                          }}
                        >
                          <TableCell className="font-mono text-blue-400 font-semibold">
                            <div className="flex items-center gap-2">
                              <span>{os.numero}</span>
                              {os.semPedido && (
                                <Badge className="bg-amber-600 text-white">Sem pedido</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-white">{os.cliente}</TableCell>
                          <TableCell className="text-slate-300">{os.tipoMotor}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {ATIVIDADE_LABELS[os.atividadePrincipal] || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${PRIORIDADE_COLORS[os.prioridade] || 'bg-gray-500'} text-white`}>
                              {PRIORIDADE_LABELS[os.prioridade] || 'Normal'}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {isColaborador && os.status !== 'concluido' ? (
                              <Select 
                                value={os.status} 
                                onValueChange={(value) => handleMudarStatus(os, value as OSStatus)}
                              >
                                <SelectTrigger className={`w-48 ${STATUS_COLORS[os.status]} text-white border-0`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {fluxo.map(status => (
                                  <SelectItem key={status} value={status} className="text-white">
                                      {STATUS_LABELS[status]}
                                  </SelectItem>
                                  ))}
                                  <SelectItem value="aguardando_material" className="text-white">
                                    {STATUS_LABELS.aguardando_material}
                                  </SelectItem>
                                  <SelectItem value="aguardando_execucao" className="text-white">
                                    {STATUS_LABELS.aguardando_execucao}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={`${STATUS_COLORS[os.status]} text-white`}>
                                {STATUS_LABELS[os.status]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {isColaborador && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-slate-400 hover:text-white"
                                  onClick={() => handleEditar(os)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        {ordens.length === 0 
                          ? 'Nenhuma ordem de serviÃ§o cadastrada'
                          : 'Nenhum resultado encontrado para os filtros aplicados'
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes */}
      {osSelecionada && !modalEdicao && (
        <OSDetalhes 
          os={osSelecionada} 
          aberto={detalhesAberto} 
          onFechar={() => {
            setDetalhesAberto(false);
            setOsSelecionada(null);
          }} 
        />
      )}

      {/* Modal de SeleÃ§Ã£o de ResponsÃ¡vel */}
      <Dialog open={modalResponsavel} onOpenChange={(aberto) => {
        setModalResponsavel(aberto);
        if (!aberto) {
          setOsParaAtualizar(null);
          setStatusNovo(null);
          setResponsaveisSelecionados([]);
          setMaterialAguardandoInput('');
          setDataEntregaMaterialInput('');
        }
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {statusNovo === 'aguardando_material' ? 'Informar material aguardado' : 'Selecionar responsÃ¡vel'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              {osParaAtualizar?.numero ? `O.S. ${osParaAtualizar.numero}` : ''}{' '}
              {statusNovo ? `â€¢ ${STATUS_LABELS[statusNovo]}` : ''}
            </div>
            {statusNovo === 'aguardando_material' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-300">PeÃ§a/Material aguardado</Label>
                  <Input
                    value={materialAguardandoInput}
                    onChange={(e) => setMaterialAguardandoInput(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Ex: Rolamento 6205"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Data de entrega do material</Label>
                  <Input
                    type="date"
                    value={dataEntregaMaterialInput}
                    onChange={(e) => setDataEntregaMaterialInput(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label className="text-slate-300">ResponsÃ¡veis do setor</Label>
                <div className="max-h-56 overflow-y-auto space-y-2 rounded-md border border-slate-600 bg-slate-700/40 p-3">
                  {RESPONSAVEIS_SETOR.map((nome) => {
                    const selecionado = responsaveisSelecionados.includes(nome);
                    return (
                      <label key={nome} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <Checkbox
                          checked={selecionado}
                          onCheckedChange={(checked) => alternarResponsavel(nome, Boolean(checked))}
                        />
                        <span>{nome}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400">
                  {responsaveisSelecionados.length > 0
                    ? `${responsaveisSelecionados.length} responsÃ¡vel(eis) selecionado(s)`
                    : 'Nenhum responsÃ¡vel selecionado'}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setModalResponsavel(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmarResponsavel}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de EdiÃ§Ã£o */}
      <Dialog open={modalEdicao} onOpenChange={setModalEdicao}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar O.S. {osSelecionada?.numero}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarEdicao} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">NÃºmero da O.S. *</Label>
                <Input
                  value={formEdicao.numero || ''}
                  onChange={(e) => setFormEdicao({...formEdicao, numero: e.target.value})}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Cliente *</Label>
                <Input
                  value={formEdicao.cliente || ''}
                  onChange={(e) => setFormEdicao({...formEdicao, cliente: e.target.value})}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Tipo/Modelo do Motor *</Label>
              <Input
                value={formEdicao.tipoMotor || ''}
                onChange={(e) => setFormEdicao({...formEdicao, tipoMotor: e.target.value})}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Atividade Principal</Label>
                <Select 
                  value={formEdicao.atividadePrincipal} 
                  onValueChange={(value) => setFormEdicao({...formEdicao, atividadePrincipal: value as AtividadePrincipal})}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ATIVIDADES_PRINCIPAIS.map(atividade => (
                      <SelectItem key={atividade} value={atividade} className="text-white">
                        {ATIVIDADE_LABELS[atividade]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Prioridade</Label>
                <Select 
                  value={formEdicao.prioridade} 
                  onValueChange={(value) => setFormEdicao({...formEdicao, prioridade: value as Prioridade})}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PRIORIDADES.map(prioridade => (
                      <SelectItem key={prioridade} value={prioridade} className="text-white">
                        {PRIORIDADE_LABELS[prioridade]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Atividade SecundÃ¡ria</Label>
              <Textarea
                value={formEdicao.atividadeSecundaria || ''}
                onChange={(e) => setFormEdicao({...formEdicao, atividadeSecundaria: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Data de AutorizaÃ§Ã£o</Label>
                <Input
                  type="date"
                  value={formEdicao.dataAutorizacao || ''}
                  onChange={(e) => setFormEdicao({...formEdicao, dataAutorizacao: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">PrevisÃ£o de Entrega</Label>
                <Input
                  type="date"
                  value={formEdicao.previsaoEntrega || ''}
                  onChange={(e) => setFormEdicao({...formEdicao, previsaoEntrega: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <Checkbox
                id="sem-pedido-edicao"
                checked={Boolean(formEdicao.semPedido)}
                onCheckedChange={(checked) => setFormEdicao({ ...formEdicao, semPedido: Boolean(checked) })}
              />
              <Label htmlFor="sem-pedido-edicao" className="text-amber-200 cursor-pointer">
                Sem pedido de autorizacao
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Retrabalho</Label>
              <Textarea
                value={formEdicao.retrabalho || ''}
                onChange={(e) => setFormEdicao({...formEdicao, retrabalho: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">ObservaÃ§Ãµes</Label>
              <Textarea
                value={formEdicao.observacoes || ''}
                onChange={(e) => setFormEdicao({...formEdicao, observacoes: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setModalEdicao(false);
                  setOsSelecionada(null);
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Salvar AlteraÃ§Ãµes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

