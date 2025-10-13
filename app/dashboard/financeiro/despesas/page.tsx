'use client';

import { useEffect, useState } from 'react';

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
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  status: 'pago' | 'pendente' | 'vencido';
  fornecedor?: string;
  data_vencimento?: string;
  observacoes?: string;
}

const mockDespesas: Despesa[] = [
  {
    id: '1',
    descricao: 'Aluguel da loja',
    valor: 3500.0,
    data: '2024-01-01',
    categoria: 'Fixas',
    status: 'pago',
    fornecedor: 'Imobiliária Central',
    data_vencimento: '2024-01-05',
  },
  {
    id: '2',
    descricao: 'Compra de peças iPhone',
    valor: 1250.0,
    data: '2024-01-10',
    categoria: 'Estoque',
    status: 'pendente',
    fornecedor: 'TechParts Ltda',
    data_vencimento: '2024-01-20',
  },
  {
    id: '3',
    descricao: 'Conta de energia elétrica',
    valor: 450.0,
    data: '2024-01-08',
    categoria: 'Utilidades',
    status: 'vencido',
    fornecedor: 'Companhia Elétrica',
    data_vencimento: '2024-01-15',
  },
  {
    id: '4',
    descricao: 'Salário funcionário',
    valor: 2800.0,
    data: '2024-01-01',
    categoria: 'Pessoal',
    status: 'pago',
    fornecedor: 'João Técnico',
  },
];

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
  const [despesas, setDespesas] = useState<Despesa[]>(mockDespesas);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    fornecedor: '',
    data_vencimento: '',
    observacoes: '',
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string) => {
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

  const handleSalvarDespesa = () => {
    // Validação básica
    if (
      !novaDespesa.descricao ||
      !novaDespesa.valor ||
      !novaDespesa.categoria
    ) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Criar nova despesa
    const despesa: Despesa = {
      id: (despesas.length + 1).toString(),
      descricao: novaDespesa.descricao,
      valor: parseFloat(novaDespesa.valor),
      data: new Date().toISOString().split('T')[0],
      categoria: novaDespesa.categoria,
      status: 'pendente',
      fornecedor: novaDespesa.fornecedor || undefined,
      data_vencimento: novaDespesa.data_vencimento || undefined,
      observacoes: novaDespesa.observacoes || undefined,
    };

    // Adicionar à lista
    setDespesas([...despesas, despesa]);

    // Limpar formulário
    setNovaDespesa({
      descricao: '',
      valor: '',
      categoria: '',
      fornecedor: '',
      data_vencimento: '',
      observacoes: '',
    });

    // Fechar diálogo
    setDialogAberto(false);

    // Simular salvamento
    console.log('Nova despesa salva:', despesa);
    alert('Despesa adicionada com sucesso!');
  };

  const despesasFiltradas = despesas.filter(despesa => {
    const matchCategoria =
      filtroCategoria === 'Todas' || despesa.categoria === filtroCategoria;
    const matchStatus =
      filtroStatus === 'Todos' || despesa.status === filtroStatus.toLowerCase();
    const matchBusca =
      despesa.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      despesa.fornecedor?.toLowerCase().includes(busca.toLowerCase());

    return matchCategoria && matchStatus && matchBusca;
  });

  const totalDespesas = despesasFiltradas.reduce(
    (acc, despesa) => acc + despesa.valor,
    0
  );
  const despesasPagas = despesasFiltradas
    .filter(d => d.status === 'pago')
    .reduce((acc, despesa) => acc + despesa.valor, 0);
  const despesasPendentes = despesasFiltradas
    .filter(d => d.status === 'pendente')
    .reduce((acc, despesa) => acc + despesa.valor, 0);
  const despesasVencidas = despesasFiltradas
    .filter(d => d.status === 'vencido')
    .reduce((acc, despesa) => acc + despesa.valor, 0);

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
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
                  {despesasFiltradas.length} despesas
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
                  <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Despesa
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Despesa</DialogTitle>
                        <DialogDescription>
                          Adicione uma nova despesa ao sistema
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
                          <Label htmlFor="fornecedor">Fornecedor</Label>
                          <Input
                            id="fornecedor"
                            placeholder="Nome do fornecedor"
                            value={novaDespesa.fornecedor}
                            onChange={e =>
                              setNovaDespesa({
                                ...novaDespesa,
                                fornecedor: e.target.value,
                              })
                            }
                          />
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
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
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
                {despesasFiltradas.map(despesa => (
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
                                <span>{despesa.fornecedor}</span>
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Marcar como Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>

              {despesasFiltradas.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma despesa encontrada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
