'use client';

import { Suspense, useState } from 'react';

import { Calendar, Download, Filter, MoreVertical, X } from 'lucide-react';

import { GraficosFinanceiros } from '@/components/dashboard/GraficosFinanceiros';
import { MetricasFinanceiras } from '@/components/dashboard/MetricasFinanceiras';
import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';

function DashboardFinanceiroSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="col-span-full h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
        <Skeleton className="col-span-full h-80" />
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  const { isMobile } = useBreakpoint();

  // Estados para controlar os diálogos e filtros
  const [dialogPeriodo, setDialogPeriodo] = useState(false);
  const [dialogFiltros, setDialogFiltros] = useState(false);
  const [periodo, setPeriodo] = useState({
    inicio: '',
    fim: '',
  });
  const [filtros, setFiltros] = useState({
    categoria: 'todas',
    status: 'todos',
    tipo: 'todos',
  });

  // Função para exportar dados
  const handleExportar = () => {
    // Simular exportação
    const dados = {
      periodo,
      filtros,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Função para aplicar período
  const handleAplicarPeriodo = () => {
    console.log('Período aplicado:', periodo);
    setDialogPeriodo(false);
    // Aqui você pode adicionar lógica para filtrar os dados por período
  };

  // Função para aplicar filtros
  const handleAplicarFiltros = () => {
    console.log('Filtros aplicados:', filtros);
    setDialogFiltros(false);
    // Aqui você pode adicionar lógica para filtrar os dados
  };

  const ActionButtons = () => (
    <>
      <ShowHide on={['md', 'lg', 'xl']}>
        <div className="flex items-center space-x-2">
          <Dialog open={dialogPeriodo} onOpenChange={setDialogPeriodo}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Período
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar Período</DialogTitle>
                <DialogDescription>
                  Escolha o período para visualizar os dados financeiros
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="data-inicio">Data de Início</Label>
                  <Input
                    id="data-inicio"
                    type="date"
                    value={periodo.inicio}
                    onChange={e =>
                      setPeriodo(prev => ({ ...prev, inicio: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="data-fim">Data de Fim</Label>
                  <Input
                    id="data-fim"
                    type="date"
                    value={periodo.fim}
                    onChange={e =>
                      setPeriodo(prev => ({ ...prev, fim: e.target.value }))
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogPeriodo(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAplicarPeriodo}>Aplicar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogFiltros} onOpenChange={setDialogFiltros}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filtros Avançados</DialogTitle>
                <DialogDescription>
                  Configure os filtros para personalizar a visualização dos
                  dados
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={filtros.categoria}
                    onValueChange={value =>
                      setFiltros(prev => ({ ...prev, categoria: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Categorias</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="produtos">Produtos</SelectItem>
                      <SelectItem value="consultoria">Consultoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filtros.status}
                    onValueChange={value =>
                      setFiltros(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={filtros.tipo}
                    onValueChange={value =>
                      setFiltros(prev => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Receitas e Despesas</SelectItem>
                      <SelectItem value="receitas">Apenas Receitas</SelectItem>
                      <SelectItem value="despesas">Apenas Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogFiltros(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAplicarFiltros}>
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </ShowHide>

      <ShowHide hide={['md', 'lg', 'xl']}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDialogPeriodo(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Período
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDialogFiltros(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportar}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ShowHide>
    </>
  );

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
          {/* Header */}
          <ResponsiveStack
            direction="responsive"
            align="start"
            className="justify-between"
          >
            <div className="flex items-center gap-4">
              <BackButton href="/dashboard" />
              <div className="space-y-2">
                <ResponsiveText size="3xl" className="font-bold tracking-tight">
                  Dashboard Financeiro
                </ResponsiveText>
                <ResponsiveText size="sm" className="text-muted-foreground">
                  Acompanhe as métricas financeiras e performance do seu negócio
                </ResponsiveText>
              </div>
            </div>
            <ActionButtons />
          </ResponsiveStack>

          {/* Conteúdo Principal */}
          <Suspense fallback={<DashboardFinanceiroSkeleton />}>
            <div className="space-y-6">
              {/* Métricas */}
              <MetricasFinanceiras />

              {/* Gráficos */}
              <GraficosFinanceiros />
            </div>
          </Suspense>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
