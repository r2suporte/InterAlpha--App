'use client';

import React, { useState } from 'react';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Package,
  PieChart,
  Settings,
  Share2,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { MetricCard } from '@/components/dashboard/MetricCard';

// Dados simulados para métricas
const metricas = {
  performance: {
    tempoMedioResposta: 1.2,
    disponibilidade: 99.8,
    throughput: 1250,
    errorRate: 0.2,
  },
  negocio: {
    totalClientes: 1247,
    ordensAbertas: 23,
    faturamentoMes: 125000,
    ticketMedio: 850,
    crescimentoMensal: 12.5,
    satisfacaoCliente: 4.7,
  },
  operacional: {
    pecasEstoque: 2340,
    pecasBaixoEstoque: 15,
    ordensVencidas: 3,
    tecnicosAtivos: 8,
    utilizacaoCapacidade: 78,
  },
  financeiro: {
    receitaTotal: 125000,
    despesaTotal: 78000,
    margemLucro: 37.6,
    fluxoCaixaPositivo: true,
    contasReceber: 45000,
    contasPagar: 23000,
  },
};

const metas = {
  faturamentoMensal: 150000,
  satisfacaoCliente: 4.8,
  tempoMedioResposta: 1.0,
  disponibilidade: 99.9,
  margemLucro: 40,
};

// Dados de sparkline simulados
const generateSparklineData = (base: number, variance: number = 10) => {
  return Array.from({ length: 12 }, () => base + (Math.random() - 0.5) * variance);
};

export default function MetricasPage() {
  const [periodo, setPeriodo] = useState('mes');
  const [categoria, setCategoria] = useState('todas');

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarPorcentagem = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <EnhancedSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <SiteHeader />

          <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6 lg:p-8">
            {/* Header Aprimorado */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <BackButton href="/dashboard" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                      Métricas de Performance
                    </h1>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe indicadores de performance e KPIs do negócio em tempo real
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dia">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="trimestre">Trimestre</SelectItem>
                    <SelectItem value="ano">Este Ano</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Tabs para Categorias */}
            <Tabs value={categoria} onValueChange={setCategoria} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="negocio">Negócio</TabsTrigger>
                <TabsTrigger value="operacional">Operacional</TabsTrigger>
                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              </TabsList>

              {/* Tab: Todas as Métricas */}
              <TabsContent value="todas" className="space-y-6">
                {/* Performance do Sistema */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold">Performance do Sistema</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="Tempo de Resposta"
                      value={`${metricas.performance.tempoMedioResposta}s`}
                      change={-8.5}
                      target={metas.tempoMedioResposta}
                      icon={<Clock className="h-4 w-4" />}
                      trend="down"
                      status="success"
                      sparklineData={generateSparklineData(1.2, 0.3)}
                      description="Tempo médio de resposta do sistema. Meta: < 1.0s"
                    />
                    <MetricCard
                      title="Disponibilidade"
                      value={formatarPorcentagem(metricas.performance.disponibilidade)}
                      change={0.1}
                      target={metas.disponibilidade}
                      icon={<CheckCircle className="h-4 w-4" />}
                      trend="up"
                      status="success"
                      sparklineData={generateSparklineData(99.8, 0.2)}
                      description="Uptime do sistema nas últimas 24 horas"
                    />
                    <MetricCard
                      title="Throughput"
                      value={metricas.performance.throughput}
                      unit="req/min"
                      change={15.2}
                      icon={<BarChart3 className="h-4 w-4" />}
                      trend="up"
                      status="success"
                      sparklineData={generateSparklineData(1250, 150)}
                      description="Requisições processadas por minuto"
                    />
                    <MetricCard
                      title="Taxa de Erro"
                      value={formatarPorcentagem(metricas.performance.errorRate)}
                      change={-12.3}
                      icon={<AlertTriangle className="h-4 w-4" />}
                      trend="down"
                      status="success"
                      sparklineData={generateSparklineData(0.2, 0.1)}
                      description="Percentual de requisições com erro"
                    />
                  </div>
                </div>

                {/* Indicadores de Negócio */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-semibold">Indicadores de Negócio</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="Total de Clientes"
                      value={metricas.negocio.totalClientes}
                      change={metricas.negocio.crescimentoMensal}
                      icon={<Users className="h-4 w-4" />}
                      trend="up"
                      status="success"
                      sparklineData={generateSparklineData(1247, 50)}
                      description="Clientes ativos na plataforma"
                    />
                    <MetricCard
                      title="Faturamento Mensal"
                      value={formatarMoeda(metricas.negocio.faturamentoMes)}
                      change={8.3}
                      target={metas.faturamentoMensal}
                      icon={<DollarSign className="h-4 w-4" />}
                      trend="up"
                      status="warning"
                      sparklineData={generateSparklineData(125000, 10000)}
                      description="Faturamento do mês atual vs meta"
                    />
                    <MetricCard
                      title="Ticket Médio"
                      value={formatarMoeda(metricas.negocio.ticketMedio)}
                      change={5.2}
                      icon={<PieChart className="h-4 w-4" />}
                      trend="up"
                      status="success"
                      sparklineData={generateSparklineData(850, 50)}
                      description="Valor médio por ordem de serviço"
                    />
                    <MetricCard
                      title="Satisfação do Cliente"
                      value={`${metricas.negocio.satisfacaoCliente}/5.0`}
                      change={2.1}
                      target={metas.satisfacaoCliente}
                      icon={<CheckCircle className="h-4 w-4" />}
                      trend="up"
                      status="success"
                      sparklineData={generateSparklineData(4.7, 0.2)}
                      description="Avaliação média dos clientes"
                    />
                  </div>
                </div>

                {/* Indicadores Operacionais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    <h2 className="text-xl font-semibold">Indicadores Operacionais</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="Peças em Estoque"
                      value={metricas.operacional.pecasEstoque}
                      change={-3.2}
                      icon={<Package className="h-4 w-4" />}
                      trend="down"
                      status={metricas.operacional.pecasBaixoEstoque > 10 ? 'warning' : 'success'}
                      sparklineData={generateSparklineData(2340, 100)}
                      description={`${metricas.operacional.pecasBaixoEstoque} itens com baixo estoque`}
                    />
                    <MetricCard
                      title="Ordens Abertas"
                      value={metricas.negocio.ordensAbertas}
                      change={-15.5}
                      icon={<AlertTriangle className="h-4 w-4" />}
                      trend="down"
                      status={metricas.operacional.ordensVencidas > 0 ? 'danger' : 'success'}
                      sparklineData={generateSparklineData(23, 5)}
                      description={`${metricas.operacional.ordensVencidas} ordens vencidas`}
                    />
                    <MetricCard
                      title="Técnicos Ativos"
                      value={metricas.operacional.tecnicosAtivos}
                      change={0}
                      icon={<Users className="h-4 w-4" />}
                      trend="neutral"
                      status="neutral"
                      sparklineData={generateSparklineData(8, 1)}
                      description="Técnicos em atividade hoje"
                    />
                    <MetricCard
                      title="Utilização da Capacidade"
                      value={formatarPorcentagem(metricas.operacional.utilizacaoCapacidade)}
                      change={5.8}
                      icon={<BarChart3 className="h-4 w-4" />}
                      trend="up"
                      status="success"
                      sparklineData={generateSparklineData(78, 5)}
                      description="Percentual de capacidade utilizada"
                    />
                  </div>
                </div>

                {/* Indicadores Financeiros */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-xl font-semibold">Indicadores Financeiros</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="Receita Total"
                      value={formatarMoeda(metricas.financeiro.receitaTotal)}
                      change={12.5}
                      icon={<TrendingUp className="h-4 w-4" />}
                      trend="up"
                      status="success"
                      sparklineData={generateSparklineData(125000, 10000)}
                      description="Receita total do mês"
                    />
                    <MetricCard
                      title="Margem de Lucro"
                      value={formatarPorcentagem(metricas.financeiro.margemLucro)}
                      change={-2.4}
                      target={metas.margemLucro}
                      icon={<PieChart className="h-4 w-4" />}
                      trend="down"
                      status="warning"
                      sparklineData={generateSparklineData(37.6, 2)}
                      description="Margem de lucro líquido"
                    />
                    <MetricCard
                      title="Contas a Receber"
                      value={formatarMoeda(metricas.financeiro.contasReceber)}
                      change={-8.2}
                      icon={<DollarSign className="h-4 w-4" />}
                      trend="down"
                      status="success"
                      sparklineData={generateSparklineData(45000, 5000)}
                      description="Valores pendentes de recebimento"
                    />
                    <MetricCard
                      title="Fluxo de Caixa"
                      value={formatarMoeda(
                        metricas.financeiro.receitaTotal - metricas.financeiro.despesaTotal
                      )}
                      change={18.5}
                      icon={<Activity className="h-4 w-4" />}
                      trend="up"
                      status={metricas.financeiro.fluxoCaixaPositivo ? 'success' : 'danger'}
                      sparklineData={generateSparklineData(47000, 8000)}
                      description="Saldo de caixa do período"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tabs individuais para cada categoria */}
              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Tempo de Resposta"
                    value={`${metricas.performance.tempoMedioResposta}s`}
                    change={-8.5}
                    target={metas.tempoMedioResposta}
                    icon={<Clock className="h-4 w-4" />}
                    trend="down"
                    status="success"
                    sparklineData={generateSparklineData(1.2, 0.3)}
                    description="Tempo médio de resposta do sistema"
                  />
                  <MetricCard
                    title="Disponibilidade"
                    value={formatarPorcentagem(metricas.performance.disponibilidade)}
                    change={0.1}
                    target={metas.disponibilidade}
                    icon={<CheckCircle className="h-4 w-4" />}
                    trend="up"
                    status="success"
                    sparklineData={generateSparklineData(99.8, 0.2)}
                    description="Uptime do sistema"
                  />
                  <MetricCard
                    title="Throughput"
                    value={metricas.performance.throughput}
                    unit="req/min"
                    change={15.2}
                    icon={<BarChart3 className="h-4 w-4" />}
                    trend="up"
                    status="success"
                    sparklineData={generateSparklineData(1250, 150)}
                    description="Requisições por minuto"
                  />
                  <MetricCard
                    title="Taxa de Erro"
                    value={formatarPorcentagem(metricas.performance.errorRate)}
                    change={-12.3}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    trend="down"
                    status="success"
                    sparklineData={generateSparklineData(0.2, 0.1)}
                    description="Percentual de erros"
                  />
                </div>
              </TabsContent>

              <TabsContent value="negocio" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Total de Clientes"
                    value={metricas.negocio.totalClientes}
                    change={metricas.negocio.crescimentoMensal}
                    icon={<Users className="h-4 w-4" />}
                    trend="up"
                    status="success"
                    sparklineData={generateSparklineData(1247, 50)}
                  />
                  <MetricCard
                    title="Faturamento Mensal"
                    value={formatarMoeda(metricas.negocio.faturamentoMes)}
                    change={8.3}
                    target={metas.faturamentoMensal}
                    icon={<DollarSign className="h-4 w-4" />}
                    trend="up"
                    status="warning"
                    sparklineData={generateSparklineData(125000, 10000)}
                  />
                  <MetricCard
                    title="Ticket Médio"
                    value={formatarMoeda(metricas.negocio.ticketMedio)}
                    change={5.2}
                    icon={<PieChart className="h-4 w-4" />}
                    trend="up"
                    status="success"
                    sparklineData={generateSparklineData(850, 50)}
                  />
                  <MetricCard
                    title="Satisfação do Cliente"
                    value={`${metricas.negocio.satisfacaoCliente}/5.0`}
                    change={2.1}
                    target={metas.satisfacaoCliente}
                    icon={<CheckCircle className="h-4 w-4" />}
                    trend="up"
                    status="success"
                    sparklineData={generateSparklineData(4.7, 0.2)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="operacional" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Peças em Estoque"
                    value={metricas.operacional.pecasEstoque}
                    change={-3.2}
                    icon={<Package className="h-4 w-4" />}
                    trend="down"
                    status={metricas.operacional.pecasBaixoEstoque > 10 ? 'warning' : 'success'}
                    sparklineData={generateSparklineData(2340, 100)}
                  />
                  <MetricCard
                    title="Ordens Abertas"
                    value={metricas.negocio.ordensAbertas}
                    change={-15.5}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    trend="down"
                    status={metricas.operacional.ordensVencidas > 0 ? 'danger' : 'success'}
                    sparklineData={generateSparklineData(23, 5)}
                  />
                  <MetricCard
                    title="Técnicos Ativos"
                    value={metricas.operacional.tecnicosAtivos}
                    change={0}
                    icon={<Users className="h-4 w-4" />}
                    trend="neutral"
                    status="neutral"
                    sparklineData={generateSparklineData(8, 1)}
                  />
                  <MetricCard
                    title="Utilização da Capacidade"
                    value={formatarPorcentagem(metricas.operacional.utilizacaoCapacidade)}
                    change={5.8}
                    icon={<BarChart3 className="h-4 w-4" />}
                    trend="up"
                    status="success"
                    sparklineData={generateSparklineData(78, 5)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="financeiro" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Receita Total"
                    value={formatarMoeda(metricas.financeiro.receitaTotal)}
                    change={12.5}
                    icon={<TrendingUp className="h-4 w-4" />}
                    trend="up"
                    status="success"
                    sparklineData={generateSparklineData(125000, 10000)}
                  />
                  <MetricCard
                    title="Margem de Lucro"
                    value={formatarPorcentagem(metricas.financeiro.margemLucro)}
                    change={-2.4}
                    target={metas.margemLucro}
                    icon={<PieChart className="h-4 w-4" />}
                    trend="down"
                    status="warning"
                    sparklineData={generateSparklineData(37.6, 2)}
                  />
                  <MetricCard
                    title="Contas a Receber"
                    value={formatarMoeda(metricas.financeiro.contasReceber)}
                    change={-8.2}
                    icon={<DollarSign className="h-4 w-4" />}
                    trend="down"
                    status="success"
                    sparklineData={generateSparklineData(45000, 5000)}
                  />
                  <MetricCard
                    title="Fluxo de Caixa"
                    value={formatarMoeda(
                      metricas.financeiro.receitaTotal - metricas.financeiro.despesaTotal
                    )}
                    change={18.5}
                    icon={<Activity className="h-4 w-4" />}
                    trend="up"
                    status={metricas.financeiro.fluxoCaixaPositivo ? 'success' : 'danger'}
                    sparklineData={generateSparklineData(47000, 8000)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
