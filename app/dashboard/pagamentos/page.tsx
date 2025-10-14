'use client';

import { useState } from 'react';

import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  XCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PagamentosPage() {
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [busca, setBusca] = useState('');
  const [dialogNovoPagamento, setDialogNovoPagamento] = useState(false);
  const [novoPagamento, setNovoPagamento] = useState({
    cliente: '',
    valor: '',
    metodo: '',
    ordemServico: '',
  });
  const { isMobile } = useBreakpoint();

  // Função para salvar novo pagamento
  const handleSalvarPagamento = () => {
    if (
      !novoPagamento.cliente ||
      !novoPagamento.valor ||
      !novoPagamento.metodo ||
      !novoPagamento.ordemServico
    ) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Aqui você pode adicionar a lógica para salvar no banco de dados
    console.log('Novo pagamento:', novoPagamento);

    // Limpar formulário e fechar dialog
    setNovoPagamento({
      cliente: '',
      valor: '',
      metodo: '',
      ordemServico: '',
    });
    setDialogNovoPagamento(false);

    // Mostrar mensagem de sucesso
    alert('Pagamento adicionado com sucesso!');
  };

  const pagamentos = [
    {
      id: 'PAG-001',
      cliente: 'João Silva',
      valor: 1250.0,
      metodo: 'Cartão de Crédito',
      status: 'Aprovado',
      data: '15/01/2025',
      ordemServico: 'OS-001',
    },
    {
      id: 'PAG-002',
      cliente: 'Maria Santos',
      valor: 850.0,
      metodo: 'PIX',
      status: 'Pendente',
      data: '14/01/2025',
      ordemServico: 'OS-002',
    },
    {
      id: 'PAG-003',
      cliente: 'Carlos Oliveira',
      valor: 2100.0,
      metodo: 'Boleto',
      status: 'Processando',
      data: '13/01/2025',
      ordemServico: 'OS-003',
    },
    {
      id: 'PAG-004',
      cliente: 'Ana Costa',
      valor: 450.0,
      metodo: 'Débito',
      status: 'Rejeitado',
      data: '12/01/2025',
      ordemServico: 'OS-004',
    },
    {
      id: 'PAG-005',
      cliente: 'Pedro Lima',
      valor: 1800.0,
      metodo: 'Transferência',
      status: 'Aprovado',
      data: '11/01/2025',
      ordemServico: 'OS-005',
    },
  ];

  const estatisticas = {
    totalRecebido: 15750.0,
    totalPendente: 3200.0,
    totalMes: 18950.0,
    transacoes: 45,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-green-100 text-green-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processando':
        return 'bg-blue-100 text-blue-800';
      case 'Rejeitado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Processando':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Rejeitado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const pagamentosFiltrados = pagamentos.filter(pagamento => {
    const matchStatus =
      !filtroStatus ||
      filtroStatus === 'todos' ||
      pagamento.status === filtroStatus;
    const matchMetodo =
      !filtroMetodo ||
      filtroMetodo === 'todos' ||
      pagamento.metodo === filtroMetodo;
    const matchBusca =
      !busca ||
      pagamento.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      pagamento.id.toLowerCase().includes(busca.toLowerCase());

    return matchStatus && matchMetodo && matchBusca;
  });

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
          <BackButton href="/dashboard" />
          {/* Header */}
          <ResponsiveStack
            direction="responsive"
            align="center"
            className="justify-between"
          >
            <div className="space-y-2">
              <ResponsiveText
                size={isMobile ? '2xl' : '3xl'}
                className="font-bold tracking-tight"
              >
                Pagamentos
              </ResponsiveText>
              <ResponsiveText
                size={isMobile ? 'sm' : 'base'}
                className="text-muted-foreground"
              >
                Gerencie e monitore todos os pagamentos da sua empresa
              </ResponsiveText>
            </div>

            <ShowHide hide={['sm']}>
              <Dialog
                open={dialogNovoPagamento}
                onOpenChange={(open) => {
                  console.log('Dialog Novo Pagamento:', open);
                  setDialogNovoPagamento(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => console.log('Trigger Novo Pagamento clicado')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Pagamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Novo Pagamento</DialogTitle>
                    <DialogDescription>
                      Adicione um novo pagamento ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cliente">Cliente *</Label>
                      <Input
                        id="cliente"
                        value={novoPagamento.cliente}
                        onChange={e =>
                          setNovoPagamento({
                            ...novoPagamento,
                            cliente: e.target.value,
                          })
                        }
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valor">Valor *</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={novoPagamento.valor}
                        onChange={e =>
                          setNovoPagamento({
                            ...novoPagamento,
                            valor: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="metodo">Método de Pagamento *</Label>
                      <Select
                        value={novoPagamento.metodo}
                        onValueChange={value =>
                          setNovoPagamento({ ...novoPagamento, metodo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cartão de Crédito">
                            Cartão de Crédito
                          </SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="Boleto">Boleto</SelectItem>
                          <SelectItem value="Débito">Débito</SelectItem>
                          <SelectItem value="Transferência">
                            Transferência
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ordemServico">Ordem de Serviço *</Label>
                      <Input
                        id="ordemServico"
                        value={novoPagamento.ordemServico}
                        onChange={e =>
                          setNovoPagamento({
                            ...novoPagamento,
                            ordemServico: e.target.value,
                          })
                        }
                        placeholder="OS-001"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogNovoPagamento(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSalvarPagamento}>
                      Salvar Pagamento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </ShowHide>

            <ShowHide on={['sm']}>
              <Dialog
                open={dialogNovoPagamento}
                onOpenChange={setDialogNovoPagamento}
              >
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Novo Pagamento</DialogTitle>
                    <DialogDescription>
                      Adicione um novo pagamento ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cliente-mobile">Cliente *</Label>
                      <Input
                        id="cliente-mobile"
                        value={novoPagamento.cliente}
                        onChange={e =>
                          setNovoPagamento({
                            ...novoPagamento,
                            cliente: e.target.value,
                          })
                        }
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valor-mobile">Valor *</Label>
                      <Input
                        id="valor-mobile"
                        type="number"
                        step="0.01"
                        value={novoPagamento.valor}
                        onChange={e =>
                          setNovoPagamento({
                            ...novoPagamento,
                            valor: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="metodo-mobile">
                        Método de Pagamento *
                      </Label>
                      <Select
                        value={novoPagamento.metodo}
                        onValueChange={value =>
                          setNovoPagamento({ ...novoPagamento, metodo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cartão de Crédito">
                            Cartão de Crédito
                          </SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="Boleto">Boleto</SelectItem>
                          <SelectItem value="Débito">Débito</SelectItem>
                          <SelectItem value="Transferência">
                            Transferência
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ordemServico-mobile">
                        Ordem de Serviço *
                      </Label>
                      <Input
                        id="ordemServico-mobile"
                        value={novoPagamento.ordemServico}
                        onChange={e =>
                          setNovoPagamento({
                            ...novoPagamento,
                            ordemServico: e.target.value,
                          })
                        }
                        placeholder="OS-001"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogNovoPagamento(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSalvarPagamento}>
                      Salvar Pagamento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </ShowHide>
          </ResponsiveStack>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Recebido
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R${' '}
                  {estatisticas.totalRecebido.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  R${' '}
                  {estatisticas.totalPendente.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total do Mês
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R${' '}
                  {estatisticas.totalMes.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Janeiro 2025</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transações
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticas.transacoes}
                </div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="busca">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="busca"
                      placeholder="Cliente ou ID..."
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Processando">Processando</SelectItem>
                      <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodo">Método</Label>
                  <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os métodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Cartão de Crédito">
                        Cartão de Crédito
                      </SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Débito">Débito</SelectItem>
                      <SelectItem value="Transferência">
                        Transferência
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ações</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagamentosFiltrados.map(pagamento => (
                  <div
                    key={pagamento.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(pagamento.status)}
                        <div>
                          <p className="font-medium">{pagamento.cliente}</p>
                          <p className="text-sm text-muted-foreground">
                            {pagamento.id} • {pagamento.ordemServico}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">
                          R${' '}
                          {pagamento.valor.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pagamento.metodo}
                        </p>
                      </div>

                      <div className="text-right">
                        <Badge className={getStatusColor(pagamento.status)}>
                          {pagamento.status}
                        </Badge>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {pagamento.data}
                        </p>
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {pagamentosFiltrados.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhum pagamento encontrado com os filtros aplicados.
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
