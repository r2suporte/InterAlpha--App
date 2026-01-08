'use client';

import { useEffect, useState, useCallback } from 'react';

import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Download,
  Edit,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  TrendingDown,
} from 'lucide-react';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResponsiveContainer,
  ResponsiveStack,
  ResponsiveText,
  ShowHide,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/components/ui/toast-system';

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  status: 'pago' | 'pendente' | 'vencido';
  fornecedor?: string;
  fornecedorId?: string;
  fornecedorNome?: string;
  data_vencimento?: string;
  observacoes?: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

const categorias = [
  'Todas',
  'Fixas',
  'Variáveis',
  'Estoque',
  'Utilidades',
  'Pessoal',
  'Marketing',
  'Outros',
];
const statusOptions = ['Todos', 'Pago', 'Pendente', 'Vencido'];

export default function DespesasPage() {
  const { isMobile } = useBreakpoint();
  const { success, error } = useToast();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    fornecedor: '',
    fornecedor_id: '',
    data_vencimento: '',
    observacoes: '',
    status: 'pendente' as 'pago' | 'pendente' | 'vencido',
  });

  const fetchDespesas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroCategoria !== 'Todas') params.append('categoria', filtroCategoria);
      if (filtroStatus !== 'Todos') params.append('status', filtroStatus);
      if (busca) params.append('search', busca);

      const response = await fetch(`/api/financeiro/despesas?${params.toString()}`);
      if (!response.ok) throw new Error('Falha ao carregar despesas');

      const data = await response.json();
      setDespesas(data);
    } catch (err) {
      console.error(err);
      error('Erro', 'Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria, filtroStatus, busca, error]);

  const fetchFornecedores = useCallback(async () => {
    try {
      const response = await fetch('/api/estoque/fornecedores');
      if (response.ok) {
        const data = await response.json();
        setFornecedores(data);
      }
    } catch (err) {
      console.error('Erro ao buscar fornecedores:', err);
    }
  }, []);

  useEffect(() => {
    fetchDespesas();
    fetchFornecedores();
  }, [fetchDespesas, fetchFornecedores]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSalvarDespesa = async () => {
    if (!novaDespesa.descricao || !novaDespesa.valor || !novaDespesa.categoria) {
      error('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const url = editingId
        ? `/api/financeiro/despesas/${editingId}`
        : '/api/financeiro/despesas';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaDespesa),
      });

      if (!response.ok) throw new Error('Falha ao salvar despesa');

      success('Sucesso', `Despesa ${editingId ? 'atualizada' : 'criada'} com sucesso!`);

      setDialogAberto(false);
      resetForm();
      fetchDespesas();
    } catch (err) {
      console.error(err);
      error('Erro', 'Erro ao salvar despesa.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

    try {
      const response = await fetch(`/api/financeiro/despesas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Falha ao excluir despesa');

      success('Sucesso', 'Despesa excluída com sucesso.');
      fetchDespesas();
    } catch (err) {
      console.error(err);
      error('Erro', 'Erro ao excluir despesa.');
    }
  };

  const handleEdit = (despesa: Despesa) => {
    setEditingId(despesa.id);
    setNovaDespesa({
      descricao: despesa.descricao,
      valor: despesa.valor.toString(),
      categoria: despesa.categoria,
      fornecedor: despesa.fornecedor || '',
      fornecedor_id: despesa.fornecedorId || '',
      data_vencimento: despesa.data_vencimento ? new Date(despesa.data_vencimento).toISOString().split('T')[0] : '',
      observacoes: despesa.observacoes || '',
      status: despesa.status,
    });
    setDialogAberto(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNovaDespesa({
      descricao: '',
      valor: '',
      categoria: '',
      fornecedor: '',
      fornecedor_id: '',
      data_vencimento: '',
      observacoes: '',
      status: 'pendente',
    });
  };

  const handleExportarDespesas = () => {
    const dados = despesas.map(d => ({
      descricao: d.descricao,
      valor: d.valor,
      data: d.data,
      categoria: d.categoria,
      status: d.status,
      fornecedor: d.fornecedor || '',
      data_vencimento: d.data_vencimento || '',
    }));

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `despesas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalDespesas = despesas.reduce((acc, despesa) => acc + Number(despesa.valor), 0);
  const despesasPagas = despesas
    .filter(d => d.status === 'pago')
    .reduce((acc, despesa) => acc + Number(despesa.valor), 0);
  const despesasPendentes = despesas
    .filter(d => d.status === 'pendente')
    .reduce((acc, despesa) => acc + Number(despesa.valor), 0);
  const despesasVencidas = despesas
    .filter(d => d.status === 'vencido')
    .reduce((acc, despesa) => acc + Number(despesa.valor), 0);

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <div className="flex w-full flex-1 flex-col bg-background">
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <BackButton href="/dashboard/financeiro" />
            <div>
              <ResponsiveText
                size={isMobile ? '2xl' : '3xl'}
                className="font-bold tracking-tight"
              >
                Despesas
              </ResponsiveText>
              <ResponsiveText size="sm" className="text-muted-foreground">
                Gerencie todas as despesas da empresa
              </ResponsiveText>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatarMoeda(totalDespesas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {despesas.length} despesas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagas</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatarMoeda(despesasPagas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valores quitados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatarMoeda(despesasPendentes)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando pagamento
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatarMoeda(despesasVencidas)}
                </div>
                <p className="text-xs text-muted-foreground">Requer atenção</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Ações */}
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <CardTitle>Lista de Despesas</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todas as despesas
                  </CardDescription>
                </div>
                <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                  <button
                    onClick={() => {
                      resetForm();
                      setDialogAberto(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    type="button"
                    style={{ pointerEvents: 'auto', zIndex: 9999, position: 'relative' }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Despesa
                  </button>

                  <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
                        <DialogDescription>
                          {editingId ? 'Edite os detalhes da despesa' : 'Adicione uma nova despesa ao sistema'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="descricao">Descrição *</Label>
                          <Input
                            id="descricao"
                            placeholder="Descrição da despesa"
                            value={novaDespesa.descricao}
                            onChange={e =>
                              setNovaDespesa({
                                ...novaDespesa,
                                descricao: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="valor">Valor *</Label>
                          <Input
                            id="valor"
                            type="number"
                            placeholder="0,00"
                            value={novaDespesa.valor}
                            onChange={e =>
                              setNovaDespesa({
                                ...novaDespesa,
                                valor: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="categoria">Categoria *</Label>
                          <Select
                            value={novaDespesa.categoria}
                            onValueChange={value =>
                              setNovaDespesa({
                                ...novaDespesa,
                                categoria: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categorias.slice(1).map(categoria => (
                                <SelectItem key={categoria} value={categoria}>
                                  {categoria}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={novaDespesa.status}
                            onValueChange={value =>
                              setNovaDespesa({
                                ...novaDespesa,
                                status: value as any,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="pago">Pago</SelectItem>
                              <SelectItem value="vencido">Vencido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="fornecedor">Fornecedor</Label>
                          <Select
                            value={novaDespesa.fornecedor_id}
                            onValueChange={value => {
                              const fornecedorSelecionado = fornecedores.find(f => f.id === value);
                              setNovaDespesa({
                                ...novaDespesa,
                                fornecedor_id: value,
                                fornecedor: fornecedorSelecionado ? fornecedorSelecionado.nome : novaDespesa.fornecedor
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um fornecedor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Outro / Não cadastrado</SelectItem>
                              {fornecedores.map(f => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {(!novaDespesa.fornecedor_id || novaDespesa.fornecedor_id === 'none') && (
                            <Input
                              id="fornecedor_manual"
                              placeholder="Nome do fornecedor (se não cadastrado)"
                              value={novaDespesa.fornecedor}
                              onChange={e =>
                                setNovaDespesa({
                                  ...novaDespesa,
                                  fornecedor: e.target.value,
                                  fornecedor_id: ''
                                })
                              }
                              className="mt-2"
                            />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="vencimento">Data de Vencimento</Label>
                          <Input
                            id="vencimento"
                            type="date"
                            value={novaDespesa.data_vencimento}
                            onChange={e =>
                              setNovaDespesa({
                                ...novaDespesa,
                                data_vencimento: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="observacoes">Observações</Label>
                          <Input
                            id="observacoes"
                            placeholder="Observações adicionais"
                            value={novaDespesa.observacoes}
                            onChange={e =>
                              setNovaDespesa({
                                ...novaDespesa,
                                observacoes: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setDialogAberto(false)}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleSalvarDespesa}>
                            Salvar Despesa
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button
                    onClick={() => {
                      handleExportarDespesas();
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    type="button"
                    style={{ pointerEvents: 'auto', zIndex: 9999, position: 'relative' }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar despesas..."
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select
                  value={filtroCategoria}
                  onValueChange={setFiltroCategoria}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de Despesas */}
              <div className="space-y-4">
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando despesas...</div>
                ) : (
                  despesas.map(despesa => (
                    <div
                      key={despesa.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <h3 className="font-medium">{despesa.descricao}</h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>{formatarData(despesa.data)}</span>
                              <span>•</span>
                              <span>{despesa.categoria}</span>
                              {despesa.fornecedor && (
                                <>
                                  <span>•</span>
                                  <span>{despesa.fornecedorNome || despesa.fornecedor}</span>
                                </>
                              )}
                              {despesa.data_vencimento && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Venc: {formatarData(despesa.data_vencimento)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              -{formatarMoeda(despesa.valor)}
                            </div>
                            <Badge className={getStatusColor(despesa.status)}>
                              {despesa.status.charAt(0).toUpperCase() +
                                despesa.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(despesa)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {despesa.status !== 'pago' && (
                            <DropdownMenuItem onClick={() => {
                              setEditingId(despesa.id);
                              setNovaDespesa(prev => ({ ...prev, status: 'pago' }));
                              handleSalvarDespesa();
                            }}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(despesa.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </div>

              {!loading && despesas.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma despesa encontrada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </ResponsiveContainer>
      </div>
    </SidebarProvider>
  );
}
