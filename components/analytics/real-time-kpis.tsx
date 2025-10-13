'use client';

import React, { useEffect, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Minus,
  Package,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// 📊 Interfaces para KPIs
interface KPIMetric {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  target?: number;
  unit: 'currency' | 'percentage' | 'number' | 'time';
  format?: 'compact' | 'full';
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  category: 'financial' | 'operational' | 'customer' | 'performance';
  description: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  isGoodTrend: boolean;
  lastUpdated: Date;
}

interface KPIData {
  metrics: KPIMetric[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    systemHealth: number;
  };
  alerts: Array<{
    id: string;
    metric: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// 🎨 Configurações de cores por categoria
const colorConfig = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    trend: 'text-green-600 dark:text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    trend: 'text-yellow-600 dark:text-yellow-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    trend: 'text-red-600 dark:text-red-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    trend: 'text-purple-600 dark:text-purple-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-600 dark:text-indigo-400',
    trend: 'text-indigo-600 dark:text-indigo-400',
  },
};

// 🔧 Funções utilitárias
const formatValue = (value: number, unit: string, format?: string): string => {
  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: format === 'compact' ? 'compact' : 'standard',
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'time':
      return `${value.toFixed(1)}s`;
    case 'number':
    default:
      return format === 'compact'
        ? new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)
        : new Intl.NumberFormat('pt-BR').format(value);
  }
};

const getTrendIcon = (trend: string, isGoodTrend: boolean) => {
  if (trend === 'stable') return Minus;
  if (trend === 'up') return isGoodTrend ? TrendingUp : TrendingDown;
  return isGoodTrend ? TrendingDown : TrendingUp;
};

const getTrendColor = (trend: string, isGoodTrend: boolean) => {
  if (trend === 'stable') return 'text-gray-500';
  if (trend === 'up') return isGoodTrend ? 'text-green-600' : 'text-red-600';
  return isGoodTrend ? 'text-red-600' : 'text-green-600';
};

// 🎯 Componente de KPI Individual
const KPICard: React.FC<{ metric: KPIMetric; isLoading?: boolean }> = ({
  metric,
  isLoading = false,
}) => {
  const colors = colorConfig[metric.color];
  const TrendIcon = getTrendIcon(metric.trend, metric.isGoodTrend);
  const trendColor = getTrendColor(metric.trend, metric.isGoodTrend);

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-5 rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressValue = metric.target
    ? Math.min((metric.value / metric.target) * 100, 100)
    : 0;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:shadow-md',
        colors.bg,
        colors.border
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.title}
        </CardTitle>
        <metric.icon className={cn('h-5 w-5', colors.icon)} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Valor Principal */}
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">
              {formatValue(metric.value, metric.unit, metric.format)}
            </div>
            <div className={cn('flex items-center text-sm', trendColor)}>
              <TrendIcon className="mr-1 h-3 w-3" />
              {Math.abs(metric.changePercentage).toFixed(1)}%
            </div>
          </div>

          {/* Descrição */}
          <p className="text-xs text-muted-foreground">{metric.description}</p>

          {/* Progresso (se houver meta) */}
          {metric.target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Meta: {formatValue(metric.target, metric.unit)}</span>
                <span>{progressValue.toFixed(0)}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          )}

          {/* Última atualização */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Atualizado há{' '}
              {Math.round(
                (Date.now() - metric.lastUpdated.getTime()) / 1000 / 60
              )}
              min
            </span>
            {metric.trend !== 'stable' && (
              <Badge
                variant={metric.isGoodTrend ? 'default' : 'destructive'}
                className="text-xs"
              >
                {metric.trend === 'up' ? '↗' : '↘'}{' '}
                {Math.abs(metric.changePercentage).toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {/* Indicador de atualização em tempo real */}
      <div className="absolute right-2 top-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
      </div>
    </Card>
  );
};

// 📊 Componente Principal
export const RealTimeKPIs: React.FC<{
  refreshInterval?: number;
  categories?: Array<'financial' | 'operational' | 'customer' | 'performance'>;
}> = ({ refreshInterval = 30000, categories = ['financial', 'operational', 'customer', 'performance'] }) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 🔄 Carregar dados dos KPIs
  const loadKPIData = async () => {
    try {
      const response = await fetch('/api/analytics/kpis');
      if (!response.ok) throw new Error('Erro ao carregar KPIs');

      const data: KPIData = await response.json();
      setKpiData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
      
      // Dados simulados para fallback
      const mockData: KPIData = {
        metrics: [
          {
            id: 'revenue',
            title: 'Receita Mensal',
            value: 125000,
            previousValue: 118000,
            target: 150000,
            unit: 'currency',
            format: 'compact',
            icon: DollarSign,
            color: 'green',
            category: 'financial',
            description: 'Receita total do mês atual',
            trend: 'up',
            changePercentage: 5.9,
            isGoodTrend: true,
            lastUpdated: new Date(),
          },
          {
            id: 'orders',
            title: 'Ordens de Serviço',
            value: 147,
            previousValue: 132,
            target: 200,
            unit: 'number',
            icon: Package,
            color: 'blue',
            category: 'operational',
            description: 'Total de OS abertas este mês',
            trend: 'up',
            changePercentage: 11.4,
            isGoodTrend: true,
            lastUpdated: new Date(),
          },
          {
            id: 'customers',
            title: 'Clientes Ativos',
            value: 1247,
            previousValue: 1198,
            unit: 'number',
            icon: Users,
            color: 'purple',
            category: 'customer',
            description: 'Clientes com atividade nos últimos 30 dias',
            trend: 'up',
            changePercentage: 4.1,
            isGoodTrend: true,
            lastUpdated: new Date(),
          },
          {
            id: 'response_time',
            title: 'Tempo de Resposta',
            value: 1.2,
            previousValue: 1.8,
            target: 1.0,
            unit: 'time',
            icon: Zap,
            color: 'yellow',
            category: 'performance',
            description: 'Tempo médio de resposta da API',
            trend: 'down',
            changePercentage: -33.3,
            isGoodTrend: true,
            lastUpdated: new Date(),
          },
          {
            id: 'satisfaction',
            title: 'Satisfação do Cliente',
            value: 94.5,
            previousValue: 92.1,
            target: 95.0,
            unit: 'percentage',
            icon: CheckCircle,
            color: 'green',
            category: 'customer',
            description: 'Avaliação média dos clientes',
            trend: 'up',
            changePercentage: 2.6,
            isGoodTrend: true,
            lastUpdated: new Date(),
          },
          {
            id: 'efficiency',
            title: 'Eficiência Operacional',
            value: 78.3,
            previousValue: 75.9,
            target: 85.0,
            unit: 'percentage',
            icon: Activity,
            color: 'indigo',
            category: 'operational',
            description: 'Taxa de utilização da capacidade',
            trend: 'up',
            changePercentage: 3.2,
            isGoodTrend: true,
            lastUpdated: new Date(),
          },
        ],
        summary: {
          totalRevenue: 125000,
          totalOrders: 147,
          activeCustomers: 1247,
          systemHealth: 98.5,
        },
        alerts: [
          {
            id: 'alert-1',
            metric: 'Tempo de Resposta',
            message: 'Tempo de resposta acima do normal em alguns endpoints',
            severity: 'medium',
            timestamp: new Date(),
          },
        ],
      };

      setKpiData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Auto-refresh
  useEffect(() => {
    loadKPIData();

    if (autoRefresh) {
      const interval = setInterval(loadKPIData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Filtrar métricas por categoria
  const filteredMetrics = kpiData?.metrics.filter(metric =>
    categories.includes(metric.category)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">KPIs em Tempo Real</h2>
          <p className="text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={cn('mr-2 h-4 w-4', autoRefresh && 'animate-pulse')} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadKPIData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {kpiData?.alerts && kpiData.alerts.length > 0 && (
        <div className="space-y-2">
          {kpiData.alerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3',
                alert.severity === 'critical' && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
                alert.severity === 'high' && 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
                alert.severity === 'medium' && 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
                alert.severity === 'low' && 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
              )}
            >
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.metric}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {alert.severity}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Grid de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <KPICard key={i} metric={{} as KPIMetric} isLoading />
            ))
          : filteredMetrics.map(metric => (
              <KPICard key={metric.id} metric={metric} />
            ))}
      </div>

      {/* Resumo */}
      {kpiData?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatValue(kpiData.summary.totalRevenue, 'currency', 'compact')}
                </div>
                <div className="text-sm text-muted-foreground">Receita Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {kpiData.summary.totalOrders}
                </div>
                <div className="text-sm text-muted-foreground">Ordens Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatValue(kpiData.summary.activeCustomers, 'number', 'compact')}
                </div>
                <div className="text-sm text-muted-foreground">Clientes Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {kpiData.summary.systemHealth.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Saúde do Sistema</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeKPIs;