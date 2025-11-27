'use client';

import { useEffect, useState } from 'react';

import {
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
  TrendingUp,
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

interface Receita {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  status: 'recebido' | 'pendente' | 'atrasado';
  cliente?: string;
  ordem_servico?: string;
  observacoes?: string;
}

const mockReceitas: Receita[] = [
  {
    id: '1',
    descricao: 'Reparo MacBook Pro 13"',
    valor: 850.0,
    data: '2024-01-15',
    categoria: 'Serviços',
    status: 'recebido',
    cliente: 'João Silva',
    ordem_servico: 'OS-001',
  },
  {
    id: '2',
    descricao: 'Troca de tela iPhone 14',
    valor: 450.0,
    data: '2024-01-14',
    categoria: 'Serviços',
    status: 'pendente',
    cliente: 'Maria Santos',
    ordem_servico: 'OS-002',
  },
  {
    id: '3',
    descricao: 'Venda de cabo USB-C',
    valor: 89.9,
    data: '2024-01-13',
    categoria: 'Produtos',
    status: 'recebido',
    cliente: 'Pedro Costa',
  },
];

const categorias = ['Todas', 'Serviços', 'Produtos', 'Consultoria', 'Outros'];
const statusOptions = ['Todos', 'Recebido', 'Pendente', 'Atrasado'];

export default function ReceitasPage() {
  const { isMobile } = useBreakpoint();
  const [receitas, setReceitas] = useState<Receita[]>(mockReceitas);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novaReceita, setNovaReceita] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    status: 'pendente',
    cliente: '',
    ordem_servico: '',
    observacoes: '',
  });

  const handleSalvarReceita = () => {
    // Validação básica
    if (
      !novaReceita.descricao ||
      !novaReceita.valor ||
      !novaReceita.categoria
    ) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Criar nova receita
    const receita: Receita = {
      id: Date.now().toString(),
      descricao: novaReceita.descricao,
      valor: parseFloat(novaReceita.valor),
      data: new Date().toISOString().split('T')[0],
      categoria: novaReceita.categoria,
      status: novaReceita.status as 'recebido' | 'pendente' | 'atrasado',
      cliente: novaReceita.cliente || undefined,
      ordem_servico: novaReceita.ordem_servico || undefined,
      observacoes: novaReceita.observacoes || undefined,
    };

    // Adicionar à lista
    setReceitas(prev => [receita, ...prev]);

    // Limpar formulário
    setNovaReceita({
      descricao: '',
      valor: '',
      categoria: '',
      status: 'pendente',
      cliente: '',
      ordem_servico: '',
      observacoes: '',
    });

    // Fechar diálogo
    setDialogAberto(false);

    // Simular salvamento no console
    console.log('Nova receita salva:', receita);
    alert('Receita adicionada com sucesso!');
  };

  const handleExportarReceitas = () => {
    console.log('🔵 Exportando receitas...');
    const dados = receitas.map(r => ({
      descricao: r.descricao,
      valor: r.valor,
      data: r.data,
      categoria: r.categoria,
      status: r.status,
      cliente: r.cliente || '',
      ordem_servico: r.ordem_servico || '',
    }));

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receitas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Receitas exportadas');
  };

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
      case 'recebido':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'atrasado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const receitasFiltradas = receitas.filter(receita => {
    const matchCategoria =
      filtroCategoria === 'Todas' || receita.categoria === filtroCategoria;
    const matchStatus =
      filtroStatus === 'Todos' || receita.status === filtroStatus.toLowerCase();
    const matchBusca =
      receita.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      receita.cliente?.toLowerCase().includes(busca.toLowerCase()) ||
      receita.ordem_servico?.toLowerCase().includes(busca.toLowerCase());

    return matchCategoria && matchStatus && matchBusca;
  });

  const totalReceitas = receitasFiltradas.reduce(
    (acc, receita) => acc + receita.valor,
    0
  );
  const receitasRecebidas = receitasFiltradas
    .filter(r => r.status === 'recebido')
    .reduce((acc, receita) => acc + receita.valor, 0);
  const receitasPendentes = receitasFiltradas
    .filter(r => r.status === 'pendente')
    .reduce((acc, receita) => acc + receita.valor, 0);

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
                Receitas
              </ResponsiveText>
              <ResponsiveText size="sm" className="text-muted-foreground">
                Gerencie todas as receitas da empresa
              </ResponsiveText>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatarMoeda(totalReceitas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {receitasFiltradas.length} receitas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recebidas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatarMoeda(receitasRecebidas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valores confirmados
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
                  {formatarMoeda(receitasPendentes)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando recebimento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Ações */}
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <CardTitle>Lista de Receitas</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todas as receitas
                  </CardDescription>
                </div>
                <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                  <button
                    onClick={() => {
                      console.log('🔵 Clique em Nova Receita');
                      setDialogAberto(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    type="button"
                    style={{ pointerEvents: 'auto', zIndex: 9999, position: 'relative' }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Receita
                  </button>

                  <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Receita</DialogTitle>
                        <DialogDescription>
                          Adicione uma nova receita ao sistema
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="descricao">Descrição *</Label>
                          <Input
                            id="descricao"
                            value={novaReceita.descricao}
                            onChange={e =>
                              setNovaReceita({
                                ...novaReceita,
                                descricao: e.target.value,
                              })
                            }
                            placeholder="Descrição da receita"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="valor">Valor *</Label>
                          <Input
                            id="valor"
                            type="number"
                            step="0.01"
                            value={novaReceita.valor}
                            onChange={e =>
                              setNovaReceita({
                                ...novaReceita,
                                valor: e.target.value,
                              })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="categoria">Categoria *</Label>
                          <Select
                            value={novaReceita.categoria}
                            onValueChange={value =>
                              setNovaReceita({
                                ...novaReceita,
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
                        <div className="grid gap-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={novaReceita.status}
                            onValueChange={value =>
                              setNovaReceita({ ...novaReceita, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="recebido">Recebido</SelectItem>
                              <SelectItem value="atrasado">Atrasado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="cliente">Cliente</Label>
                          <Input
                            id="cliente"
                            value={novaReceita.cliente}
                            onChange={e =>
                              setNovaReceita({
                                ...novaReceita,
                                cliente: e.target.value,
                              })
                            }
                            placeholder="Nome do cliente"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="ordem_servico">
                            Ordem de Serviço
                          </Label>
                          <Input
                            id="ordem_servico"
                            value={novaReceita.ordem_servico}
                            onChange={e =>
                              setNovaReceita({
                                ...novaReceita,
                                ordem_servico: e.target.value,
                              })
                            }
                            placeholder="OS-001"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="observacoes">Observações</Label>
                          <Input
                            id="observacoes"
                            value={novaReceita.observacoes}
                            onChange={e =>
                              setNovaReceita({
                                ...novaReceita,
                                observacoes: e.target.value,
                              })
                            }
                            placeholder="Observações adicionais"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDialogAberto(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSalvarReceita}>
                          Salvar Receita
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button
                    onClick={() => {
                      console.log('🔵 Clique em Exportar Receitas');
                      handleExportarReceitas();
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
                      placeholder="Buscar receitas..."
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

              {/* Lista de Receitas */}
              <div className="space-y-4">
                {receitasFiltradas.map(receita => (
                  <div
                    key={receita.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h3 className="font-medium">{receita.descricao}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{formatarData(receita.data)}</span>
                            <span>•</span>
                            <span>{receita.categoria}</span>
                            {receita.cliente && (
                              <>
                                <span>•</span>
                                <span>{receita.cliente}</span>
                              </>
                            )}
                            {receita.ordem_servico && (
                              <>
                                <span>•</span>
                                <span>{receita.ordem_servico}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatarMoeda(receita.valor)}
                          </div>
                          <Badge className={getStatusColor(receita.status)}>
                            {receita.status.charAt(0).toUpperCase() +
                              receita.status.slice(1)}
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
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>

              {receitasFiltradas.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma receita encontrada
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
