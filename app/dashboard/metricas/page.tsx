'use client';

import React, { useEffect, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

export default function MetricasPage() {
  const [periodo, setPeriodo] = useState('mes');
  const [categoria, setCategoria] = useState('todas');
  const { isMobile } = useBreakpoint();

  const calcularProgresso = (atual: number, meta: number) => {
    return Math.min((atual / meta) * 100, 100);
  };

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
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <SiteHeader />

          <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
            {/* Cabeçalho */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <BackButton href="/dashboard" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                    Métricas de Performance
                  </h1>
                  <p className="mt-1 text-gray-600">
                    Acompanhe indicadores de performance e KPIs do negócio
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="w-full sm:w-[140px]">
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

                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="negocio">Negócio</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Métricas de Performance */}
            {(categoria === 'todas' || categoria === 'performance') && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Activity className="h-5 w-5" />
                  Performance do Sistema
                </h2>

                <ResponsiveContainer>
                  <ResponsiveStack>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Tempo de Resposta
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metricas.performance.tempoMedioResposta}s
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            value={calcularProgresso(
                              metas.tempoMedioResposta,
                              metricas.performance.tempoMedioResposta
                            )}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600">
                            Meta: {metas.tempoMedioResposta}s
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Disponibilidade
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarPorcentagem(
                            metricas.performance.disponibilidade
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            value={calcularProgresso(
                              metricas.performance.disponibilidade,
                              metas.disponibilidade
                            )}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600">
                            Meta: {formatarPorcentagem(metas.disponibilidade)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Throughput
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metricas.performance.throughput}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          requisições/min
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Taxa de Erro
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarPorcentagem(metricas.performance.errorRate)}
                        </div>
                        <Badge
                          variant={
                            metricas.performance.errorRate < 1
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {metricas.performance.errorRate < 1
                            ? 'Excelente'
                            : 'Atenção'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </ResponsiveStack>
                </ResponsiveContainer>
              </div>
            )}

            {/* Métricas de Negócio */}
            {(categoria === 'todas' || categoria === 'negocio') && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Target className="h-5 w-5" />
                  Indicadores de Negócio
                </h2>

                <ResponsiveContainer>
                  <ResponsiveStack>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total de Clientes
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metricas.negocio.totalClientes}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            +
                            {formatarPorcentagem(
                              metricas.negocio.crescimentoMensal
                            )}
                          </span>
                          <span className="text-sm text-gray-600">
                            este mês
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Faturamento Mensal
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarMoeda(metricas.negocio.faturamentoMes)}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            value={calcularProgresso(
                              metricas.negocio.faturamentoMes,
                              metas.faturamentoMensal
                            )}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600">
                            Meta: {formatarMoeda(metas.faturamentoMensal)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Ticket Médio
                        </CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarMoeda(metricas.negocio.ticketMedio)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          por ordem de serviço
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Satisfação do Cliente
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metricas.negocio.satisfacaoCliente}/5.0
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            value={calcularProgresso(
                              metricas.negocio.satisfacaoCliente,
                              metas.satisfacaoCliente
                            )}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600">
                            Meta: {metas.satisfacaoCliente}/5.0
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </ResponsiveStack>
                </ResponsiveContainer>
              </div>
            )}

            {/* Métricas Operacionais */}
            {(categoria === 'todas' || categoria === 'operacional') && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Package className="h-5 w-5" />
                  Indicadores Operacionais
                </h2>

                <ResponsiveContainer>
                  <ResponsiveStack>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Peças em Estoque
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metricas.operacional.pecasEstoque}
                        </div>
                        <Badge
                          variant={
                            metricas.operacional.pecasBaixoEstoque > 10
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {metricas.operacional.pecasBaixoEstoque} baixo estoque
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Ordens Abertas
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metricas.negocio.ordensAbertas}
                        </div>
                        <Badge
                          variant={
                            metricas.operacional.ordensVencidas > 0
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {metricas.operacional.ordensVencidas} vencidas
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Técnicos Ativos
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metricas.operacional.tecnicosAtivos}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          em atividade hoje
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Utilização da Capacidade
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarPorcentagem(
                            metricas.operacional.utilizacaoCapacidade
                          )}
                        </div>
                        <Progress
                          value={metricas.operacional.utilizacaoCapacidade}
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>
                  </ResponsiveStack>
                </ResponsiveContainer>
              </div>
            )}

            {/* Métricas Financeiras */}
            {(categoria === 'todas' || categoria === 'financeiro') && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <DollarSign className="h-5 w-5" />
                  Indicadores Financeiros
                </h2>

                <ResponsiveContainer>
                  <ResponsiveStack>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Receita Total
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarMoeda(metricas.financeiro.receitaTotal)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          este mês
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Margem de Lucro
                        </CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarPorcentagem(metricas.financeiro.margemLucro)}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            value={calcularProgresso(
                              metricas.financeiro.margemLucro,
                              metas.margemLucro
                            )}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600">
                            Meta: {formatarPorcentagem(metas.margemLucro)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Contas a Receber
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarMoeda(metricas.financeiro.contasReceber)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          pendentes
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Fluxo de Caixa
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarMoeda(
                            metricas.financeiro.receitaTotal -
                              metricas.financeiro.despesaTotal
                          )}
                        </div>
                        <Badge
                          variant={
                            metricas.financeiro.fluxoCaixaPositivo
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {metricas.financeiro.fluxoCaixaPositivo
                            ? 'Positivo'
                            : 'Negativo'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </ResponsiveStack>
                </ResponsiveContainer>
              </div>
            )}

            {/* Resumo de Metas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Progresso das Metas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Faturamento Mensal</span>
                      <span>
                        {formatarMoeda(metricas.negocio.faturamentoMes)} /{' '}
                        {formatarMoeda(metas.faturamentoMensal)}
                      </span>
                    </div>
                    <Progress
                      value={calcularProgresso(
                        metricas.negocio.faturamentoMes,
                        metas.faturamentoMensal
                      )}
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Satisfação do Cliente</span>
                      <span>
                        {metricas.negocio.satisfacaoCliente} /{' '}
                        {metas.satisfacaoCliente}
                      </span>
                    </div>
                    <Progress
                      value={calcularProgresso(
                        metricas.negocio.satisfacaoCliente,
                        metas.satisfacaoCliente
                      )}
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Margem de Lucro</span>
                      <span>
                        {formatarPorcentagem(metricas.financeiro.margemLucro)} /{' '}
                        {formatarPorcentagem(metas.margemLucro)}
                      </span>
                    </div>
                    <Progress
                      value={calcularProgresso(
                        metricas.financeiro.margemLucro,
                        metas.margemLucro
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
