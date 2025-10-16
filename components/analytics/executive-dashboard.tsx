'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  LineChart,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

// 📊 Interfaces para métricas executivas
interface ExecutiveMetric {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  change: number;
  changeType: 'increase' | 'decrease';
  format: 'currency' | 'percentage' | 'number';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  target?: number;
  description: string;
}

interface PerformanceData {
  period: string;
  revenue: number;
  customers: number;
  conversion: number;
  satisfaction: number;
}

interface MarketData {
  segment: string;
  value: number;
  growth: number;
  color: string;
}

interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  deadline: string;
  status: 'on_track' | 'at_risk' | 'behind';
  owner: string;
}

// 🎨 Configurações de cores
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// 🔧 Funções utilitárias
const formatValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(value);
    default:
      return value.toString();
  }
};

const generateExecutiveMetrics = (): ExecutiveMetric[] => {
  return [
    {
      id: 'revenue',
      title: 'Receita Total',
      value: 2450000,
      previousValue: 2200000,
      change: 11.4,
      changeType: 'increase',
      format: 'currency',
      icon: DollarSign,
      color: COLORS.success,
      target: 2500000,
      description: 'Receita total do trimestre',
    },
    {
      id: 'customers',
      title: 'Clientes Ativos',
      value: 15420,
      previousValue: 14800,
      change: 4.2,
      changeType: 'increase',
      format: 'number',
      icon: Users,
      color: COLORS.primary,
      target: 16000,
      description: 'Base de clientes ativos',
    },
    {
      id: 'conversion',
      title: 'Taxa de Conversão',
      value: 3.8,
      previousValue: 3.2,
      change: 18.8,
      changeType: 'increase',
      format: 'percentage',
      icon: TrendingUp,
      color: COLORS.info,
      target: 4.0,
      description: 'Conversão de leads em clientes',
    },
    {
      id: 'satisfaction',
      title: 'Satisfação do Cliente',
      value: 4.6,
      previousValue: 4.4,
      change: 4.5,
      changeType: 'increase',
      format: 'number',
      icon: Zap,
      color: COLORS.warning,
      target: 4.8,
      description: 'NPS médio dos clientes',
    },
  ];
};

const generatePerformanceData = (): PerformanceData[] => {
  return [
    { period: 'Jan', revenue: 1800000, customers: 12000, conversion: 2.8, satisfaction: 4.2 },
    { period: 'Fev', revenue: 1950000, customers: 12800, conversion: 3.1, satisfaction: 4.3 },
    { period: 'Mar', revenue: 2100000, customers: 13500, conversion: 3.3, satisfaction: 4.4 },
    { period: 'Abr', revenue: 2200000, customers: 14000, conversion: 3.2, satisfaction: 4.4 },
    { period: 'Mai', revenue: 2350000, customers: 14800, conversion: 3.5, satisfaction: 4.5 },
    { period: 'Jun', revenue: 2450000, customers: 15420, conversion: 3.8, satisfaction: 4.6 },
  ];
};

const generateMarketData = (): MarketData[] => {
  return [
    { segment: 'Enterprise', value: 45, growth: 12.5, color: PIE_COLORS[0] },
    { segment: 'SMB', value: 30, growth: 8.2, color: PIE_COLORS[1] },
    { segment: 'Startup', value: 15, growth: 25.1, color: PIE_COLORS[2] },
    { segment: 'Governo', value: 10, growth: 5.8, color: PIE_COLORS[3] },
  ];
};

const generateStrategicGoals = (): StrategicGoal[] => {
  return [
    {
      id: '1',
      title: 'Expansão Internacional',
      description: 'Lançar operações em 3 novos países',
      progress: 65,
      target: 100,
      deadline: '2024-12-31',
      status: 'on_track',
      owner: 'Equipe Global',
    },
    {
      id: '2',
      title: 'Transformação Digital',
      description: 'Migrar 80% dos processos para digital',
      progress: 45,
      target: 80,
      deadline: '2024-09-30',
      status: 'at_risk',
      owner: 'TI',
    },
    {
      id: '3',
      title: 'Sustentabilidade',
      description: 'Reduzir emissões de carbono em 30%',
      progress: 25,
      target: 30,
      deadline: '2024-12-31',
      status: 'behind',
      owner: 'Operações',
    },
  ];
};

// 📈 Componente de métrica executiva
const ExecutiveMetricCard: React.FC<{ metric: ExecutiveMetric }> = ({ metric }) => {
  const Icon = metric.icon;
  const TrendIcon = metric.changeType === 'increase' ? ArrowUp : ArrowDown;
  const progressPercentage = metric.target ? (metric.value / metric.target) * 100 : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
              <div className="h-6 w-6" style={{ color: metric.color }}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </p>
              <p className="text-2xl font-bold">
                {formatValue(metric.value, metric.format)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <TrendIcon
                className={cn(
                  'h-4 w-4',
                  metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {metric.change.toFixed(1)}%
              </span>
            </div>
            {metric.target && (
              <div className="mt-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(progressPercentage, 100)}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Meta: {formatValue(metric.target, metric.format)}
                </p>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">{metric.description}</p>
      </CardContent>
    </Card>
  );
};

// 🎯 Componente de objetivos estratégicos
const StrategicGoalsCard: React.FC<{ goals: StrategicGoal[] }> = ({ goals }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'No prazo';
      case 'at_risk':
        return 'Em risco';
      case 'behind':
        return 'Atrasado';
      default:
        return 'Indefinido';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Objetivos Estratégicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{goal.title}</h4>
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              </div>
              <Badge className={getStatusColor(goal.status)}>
                {getStatusText(goal.status)}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{goal.progress}% de {goal.target}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Responsável: {goal.owner}</span>
                <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// 📊 Componente principal do dashboard executivo
export const ExecutiveDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ExecutiveMetric[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [strategicGoals, setStrategicGoals] = useState<StrategicGoal[]>([]);
  const [timeRange, setTimeRange] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      try {
        setMetrics(generateExecutiveMetrics());
        setPerformanceData(generatePerformanceData());
        setMarketData(generateMarketData());
        setStrategicGoals(generateStrategicGoals());
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setMetrics(generateExecutiveMetrics());
      setPerformanceData(generatePerformanceData());
      setMarketData(generateMarketData());
      setStrategicGoals(generateStrategicGoals());
      setLastUpdate(new Date());
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    const data = {
      metrics,
      performanceData,
      marketData,
      strategicGoals,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Executivo</h2>
          <p className="text-muted-foreground">
            Visão estratégica e métricas de alto nível
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 mês</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Última atualização */}
      <div className="text-sm text-muted-foreground">
        Última atualização: {lastUpdate.toLocaleString('pt-BR')}
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map(metric => (
          <ExecutiveMetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Tabs de análises */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="market">Mercado</TabsTrigger>
          <TabsTrigger value="goals">Objetivos</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de receita */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Evolução da Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        formatValue(value, 'currency'),
                        'Receita',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={COLORS.primary}
                      fill={`${COLORS.primary}20`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Base de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={performanceData}>
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        formatValue(value, 'number'),
                        'Clientes',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="customers"
                      stroke={COLORS.success}
                      strokeWidth={3}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de conversão e satisfação */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Taxa de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performanceData}>
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        formatValue(value, 'percentage'),
                        'Conversão',
                      ]}
                    />
                    <Bar dataKey="conversion" fill={COLORS.info} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Satisfação do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={performanceData}>
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toFixed(1),
                        'Satisfação',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="satisfaction"
                      stroke={COLORS.warning}
                      fill={`${COLORS.warning}20`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por segmento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Segmento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={marketData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ segment, value }) => `${segment}: ${value}%`}
                    >
                      {marketData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Crescimento por segmento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Crescimento por Segmento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={marketData}>
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toFixed(1)}%`,
                        'Crescimento',
                      ]}
                    />
                    <Bar dataKey="growth" fill={COLORS.purple} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <StrategicGoalsCard goals={strategicGoals} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveDashboard;