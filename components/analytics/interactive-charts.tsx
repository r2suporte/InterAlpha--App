'use client';

import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
  Brush,
  ComposedChart,
} from 'recharts';

import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Settings,
  TrendingUp,
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
import { cn } from '@/lib/utils';

// 📊 Interfaces para dados dos gráficos
interface ChartDataPoint {
  date: string;
  timestamp: number;
  revenue: number;
  orders: number;
  customers: number;
  responseTime: number;
  errorRate: number;
  satisfaction: number;
  efficiency: number;
  costs: number;
  profit: number;
  activeUsers: number;
}

interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'area' | 'bar' | 'pie' | 'composed';
  dataKeys: string[];
  colors: string[];
  yAxisLabel?: string;
  format?: 'currency' | 'percentage' | 'number' | 'time';
  showBrush?: boolean;
  showReference?: boolean;
  referenceValue?: number;
  category: 'financial' | 'operational' | 'customer' | 'performance';
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

// 🎨 Configurações de cores
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#06b6d4',
  success: '#22c55e',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
};

const COLOR_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.danger,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.indigo,
];

// ⏰ Opções de período
const TIME_RANGES: TimeRange[] = [
  { label: 'Últimos 7 dias', value: '7d', days: 7 },
  { label: 'Últimos 30 dias', value: '30d', days: 30 },
  { label: 'Últimos 90 dias', value: '90d', days: 90 },
  { label: 'Últimos 6 meses', value: '6m', days: 180 },
  { label: 'Último ano', value: '1y', days: 365 },
];

// 📈 Configurações dos gráficos
const CHART_CONFIGS: ChartConfig[] = [
  {
    id: 'revenue-trend',
    title: 'Tendência de Receita',
    type: 'area',
    dataKeys: ['revenue', 'costs', 'profit'],
    colors: [CHART_COLORS.success, CHART_COLORS.danger, CHART_COLORS.primary],
    yAxisLabel: 'Valor (R$)',
    format: 'currency',
    showBrush: true,
    category: 'financial',
  },
  {
    id: 'orders-customers',
    title: 'Ordens vs Clientes',
    type: 'composed',
    dataKeys: ['orders', 'customers'],
    colors: [CHART_COLORS.primary, CHART_COLORS.secondary],
    yAxisLabel: 'Quantidade',
    format: 'number',
    category: 'operational',
  },
  {
    id: 'performance-metrics',
    title: 'Métricas de Performance',
    type: 'line',
    dataKeys: ['responseTime', 'errorRate'],
    colors: [CHART_COLORS.warning, CHART_COLORS.danger],
    yAxisLabel: 'Tempo (s) / Taxa (%)',
    showReference: true,
    referenceValue: 2,
    category: 'performance',
  },
  {
    id: 'satisfaction-efficiency',
    title: 'Satisfação vs Eficiência',
    type: 'bar',
    dataKeys: ['satisfaction', 'efficiency'],
    colors: [CHART_COLORS.success, CHART_COLORS.info],
    yAxisLabel: 'Percentual (%)',
    format: 'percentage',
    category: 'customer',
  },
  {
    id: 'user-distribution',
    title: 'Distribuição de Usuários',
    type: 'pie',
    dataKeys: ['activeUsers'],
    colors: COLOR_PALETTE,
    category: 'customer',
  },
];

// 🔧 Funções utilitárias
const formatValue = (value: number, format?: string): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'time':
      return `${value.toFixed(2)}s`;
    case 'number':
    default:
      return new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value);
  }
};

const generateMockData = (days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Simular dados com tendências realistas
    const baseRevenue = 50000 + Math.sin(i / 7) * 10000; // Variação semanal
    const seasonality = 1 + Math.sin((i / 365) * 2 * Math.PI) * 0.2; // Sazonalidade anual
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      revenue: Math.max(0, baseRevenue * seasonality + (Math.random() - 0.5) * 5000),
      orders: Math.floor(50 + Math.random() * 100 + Math.sin(i / 7) * 20),
      customers: Math.floor(800 + Math.random() * 400 + Math.sin(i / 30) * 100),
      responseTime: Math.max(0.1, 1 + Math.random() * 2 + Math.sin(i / 3) * 0.5),
      errorRate: Math.max(0, 0.5 + Math.random() * 2),
      satisfaction: Math.max(70, 85 + Math.random() * 10 + Math.sin(i / 14) * 5),
      efficiency: Math.max(60, 75 + Math.random() * 15 + Math.sin(i / 21) * 8),
      costs: Math.max(0, baseRevenue * 0.7 * seasonality + (Math.random() - 0.5) * 3000),
      profit: 0, // Será calculado
      activeUsers: Math.floor(200 + Math.random() * 300 + Math.sin(i / 7) * 50),
    });
  }

  // Calcular lucro
  data.forEach(point => {
    point.profit = point.revenue - point.costs;
  });

  return data;
};

// 📊 Componente de Tooltip customizado
const CustomTooltip = ({ active, payload, label, format }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatValue(entry.value, format)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 📈 Componente de gráfico individual
const ChartRenderer: React.FC<{
  config: ChartConfig;
  data: ChartDataPoint[];
  height?: number;
}> = ({ config, data, height = 300 }) => {
  const commonProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  const renderChart = () => {
    switch (config.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip format={config.format} />} />
            <Legend />
            {config.dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={config.colors[index]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
            {config.showReference && config.referenceValue && (
              <ReferenceLine 
                y={config.referenceValue} 
                stroke={CHART_COLORS.danger} 
                strokeDasharray="5 5"
                label="Meta"
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip format={config.format} />} />
            <Legend />
            {config.dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={index === 0 ? "1" : undefined}
                stroke={config.colors[index]}
                fill={config.colors[index]}
                fillOpacity={0.6}
              />
            ))}
            {config.showBrush && <Brush dataKey="date" height={30} />}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip format={config.format} />} />
            <Legend />
            {config.dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={config.colors[index]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip format={config.format} />} />
            <Legend />
            <Bar dataKey={config.dataKeys[0]} fill={config.colors[0]} radius={[2, 2, 0, 0]} />
            <Line 
              type="monotone" 
              dataKey={config.dataKeys[1]} 
              stroke={config.colors[1]} 
              strokeWidth={2}
            />
          </ComposedChart>
        );

      case 'pie':
        const pieData = data.slice(-7).map((item, index) => ({
          name: `Dia ${index + 1}`,
          value: item[config.dataKeys[0] as keyof ChartDataPoint] as number,
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default:
        return <div>Tipo de gráfico não suportado</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

// 📊 Componente principal
export const InteractiveCharts: React.FC<{
  categories?: Array<'financial' | 'operational' | 'customer' | 'performance'>;
}> = ({ categories = ['financial', 'operational', 'customer', 'performance'] }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtrar configurações por categoria
  const filteredConfigs = CHART_CONFIGS.filter(config => 
    selectedCategory === 'all' || config.category === selectedCategory
  ).filter(config => categories.includes(config.category));

  // Carregar dados quando o período mudar
  useEffect(() => {
    setLoading(true);
    const timeRange = TIME_RANGES.find(range => range.value === selectedTimeRange);
    if (timeRange) {
      // Simular delay de carregamento
      setTimeout(() => {
        setChartData(generateMockData(timeRange.days));
        setLoading(false);
      }, 500);
    }
  }, [selectedTimeRange]);

  // Exportar dados
  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = chartData.map(item => ({
      data: item.date,
      receita: item.revenue,
      ordens: item.orders,
      clientes: item.customers,
      tempoResposta: item.responseTime,
      taxaErro: item.errorRate,
      satisfacao: item.satisfaction,
      eficiencia: item.efficiency,
    }));

    if (format === 'csv') {
      const csv = [
        Object.keys(dataToExport[0]).join(','),
        ...dataToExport.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedTimeRange}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedTimeRange}.json`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Interativo</h2>
          <p className="text-muted-foreground">
            Visualizações avançadas com dados em tempo real
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="operational">Operacional</SelectItem>
              <SelectItem value="customer">Cliente</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>

          <Button variant="outline" onClick={() => exportData('json')}>
            <Download className="mr-2 h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {!loading && chartData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatValue(
                      chartData.reduce((sum, item) => sum + item.revenue, 0),
                      'currency'
                    )}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ordens Totais</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatValue(
                      chartData.reduce((sum, item) => sum + item.orders, 0),
                      'number'
                    )}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Satisfação Média</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(chartData.reduce((sum, item) => sum + item.satisfaction, 0) / chartData.length).toFixed(1)}%
                  </p>
                </div>
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Resp. Médio</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(chartData.reduce((sum, item) => sum + item.responseTime, 0) / chartData.length).toFixed(2)}s
                  </p>
                </div>
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredConfigs.map(config => (
          <Card key={config.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">{config.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {config.category}
                </Badge>
                {config.type === 'line' && <LineChartIcon className="h-4 w-4" />}
                {config.type === 'area' && <BarChart3 className="h-4 w-4" />}
                {config.type === 'bar' && <BarChart3 className="h-4 w-4" />}
                {config.type === 'pie' && <PieChartIcon className="h-4 w-4" />}
                {config.type === 'composed' && <TrendingUp className="h-4 w-4" />}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ChartRenderer config={config} data={chartData} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights automáticos */}
      {!loading && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights Automáticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">Tendências Positivas</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Receita cresceu 12% no período selecionado</li>
                  <li>• Satisfação do cliente mantém-se acima de 85%</li>
                  <li>• Eficiência operacional melhorou 8%</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-orange-600">Pontos de Atenção</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Tempo de resposta oscilando acima da meta</li>
                  <li>• Taxa de erro com picos esporádicos</li>
                  <li>• Custos operacionais em alta</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteractiveCharts;