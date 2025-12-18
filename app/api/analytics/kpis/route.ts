import { NextRequest, NextResponse } from 'next/server';

// 📊 Interfaces
interface KPIMetric {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  target?: number;
  unit: 'currency' | 'percentage' | 'number' | 'time';
  format?: 'compact' | 'full';
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



// 📈 Função para calcular tendência
function calculateTrend(current: number, previous: number): {
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
} {
  if (previous === 0) {
    return { trend: 'stable', changePercentage: 0 };
  }

  const changePercentage = ((current - previous) / previous) * 100;

  if (Math.abs(changePercentage) < 1) {
    return { trend: 'stable', changePercentage };
  }

  return {
    trend: changePercentage > 0 ? 'up' : 'down',
    changePercentage,
  };
}

// 💰 Métricas Financeiras
async function getFinancialMetrics(): Promise<KPIMetric[]> {
  try {
    // Simular consultas ao banco de dados
    // const currentMonth = new Date().getMonth();
    // const currentYear = new Date().getFullYear();

    // Receita atual vs anterior
    const currentRevenue = Math.random() * 200000 + 100000; // 100k-300k
    const previousRevenue = currentRevenue * (0.85 + Math.random() * 0.3); // ±15%

    const revenueTrend = calculateTrend(currentRevenue, previousRevenue);

    // Margem de lucro
    const currentMargin = 15 + Math.random() * 10; // 15-25%
    const previousMargin = currentMargin * (0.9 + Math.random() * 0.2);
    const marginTrend = calculateTrend(currentMargin, previousMargin);

    return [
      {
        id: 'revenue',
        title: 'Receita Mensal',
        value: currentRevenue,
        previousValue: previousRevenue,
        target: 250000,
        unit: 'currency',
        format: 'compact',
        category: 'financial',
        description: 'Receita total do mês atual',
        trend: revenueTrend.trend,
        changePercentage: revenueTrend.changePercentage,
        isGoodTrend: revenueTrend.trend === 'up',
        lastUpdated: new Date(),
      },
      {
        id: 'profit_margin',
        title: 'Margem de Lucro',
        value: currentMargin,
        previousValue: previousMargin,
        target: 20,
        unit: 'percentage',
        category: 'financial',
        description: 'Margem de lucro líquido',
        trend: marginTrend.trend,
        changePercentage: marginTrend.changePercentage,
        isGoodTrend: marginTrend.trend === 'up',
        lastUpdated: new Date(),
      },
    ];
  } catch (error) {
    console.error('Erro ao buscar métricas financeiras:', error);
    return [];
  }
}

// 🔧 Métricas Operacionais
async function getOperationalMetrics(): Promise<KPIMetric[]> {
  try {
    // Ordens de serviço
    const currentOrders = Math.floor(Math.random() * 100) + 120; // 120-220
    const previousOrders = Math.floor(currentOrders * (0.8 + Math.random() * 0.4));
    const ordersTrend = calculateTrend(currentOrders, previousOrders);

    // Eficiência operacional
    const currentEfficiency = 70 + Math.random() * 25; // 70-95%
    const previousEfficiency = currentEfficiency * (0.9 + Math.random() * 0.2);
    const efficiencyTrend = calculateTrend(currentEfficiency, previousEfficiency);

    // Taxa de resolução
    const currentResolution = 85 + Math.random() * 10; // 85-95%
    const previousResolution = currentResolution * (0.9 + Math.random() * 0.2);
    const resolutionTrend = calculateTrend(currentResolution, previousResolution);

    return [
      {
        id: 'orders',
        title: 'Ordens de Serviço',
        value: currentOrders,
        previousValue: previousOrders,
        target: 200,
        unit: 'number',
        category: 'operational',
        description: 'Total de OS abertas este mês',
        trend: ordersTrend.trend,
        changePercentage: ordersTrend.changePercentage,
        isGoodTrend: ordersTrend.trend === 'up',
        lastUpdated: new Date(),
      },
      {
        id: 'efficiency',
        title: 'Eficiência Operacional',
        value: currentEfficiency,
        previousValue: previousEfficiency,
        target: 90,
        unit: 'percentage',
        category: 'operational',
        description: 'Taxa de utilização da capacidade',
        trend: efficiencyTrend.trend,
        changePercentage: efficiencyTrend.changePercentage,
        isGoodTrend: efficiencyTrend.trend === 'up',
        lastUpdated: new Date(),
      },
      {
        id: 'resolution_rate',
        title: 'Taxa de Resolução',
        value: currentResolution,
        previousValue: previousResolution,
        target: 95,
        unit: 'percentage',
        category: 'operational',
        description: 'Percentual de OS resolvidas no prazo',
        trend: resolutionTrend.trend,
        changePercentage: resolutionTrend.changePercentage,
        isGoodTrend: resolutionTrend.trend === 'up',
        lastUpdated: new Date(),
      },
    ];
  } catch (error) {
    console.error('Erro ao buscar métricas operacionais:', error);
    return [];
  }
}

// 👥 Métricas de Cliente
async function getCustomerMetrics(): Promise<KPIMetric[]> {
  try {
    // Clientes ativos
    const currentCustomers = Math.floor(Math.random() * 500) + 1000; // 1000-1500
    const previousCustomers = Math.floor(currentCustomers * (0.9 + Math.random() * 0.2));
    const customersTrend = calculateTrend(currentCustomers, previousCustomers);

    // Satisfação do cliente
    const currentSatisfaction = 85 + Math.random() * 10; // 85-95%
    const previousSatisfaction = currentSatisfaction * (0.95 + Math.random() * 0.1);
    const satisfactionTrend = calculateTrend(currentSatisfaction, previousSatisfaction);

    // Taxa de retenção
    const currentRetention = 80 + Math.random() * 15; // 80-95%
    const previousRetention = currentRetention * (0.9 + Math.random() * 0.2);
    const retentionTrend = calculateTrend(currentRetention, previousRetention);

    return [
      {
        id: 'customers',
        title: 'Clientes Ativos',
        value: currentCustomers,
        previousValue: previousCustomers,
        unit: 'number',
        category: 'customer',
        description: 'Clientes com atividade nos últimos 30 dias',
        trend: customersTrend.trend,
        changePercentage: customersTrend.changePercentage,
        isGoodTrend: customersTrend.trend === 'up',
        lastUpdated: new Date(),
      },
      {
        id: 'satisfaction',
        title: 'Satisfação do Cliente',
        value: currentSatisfaction,
        previousValue: previousSatisfaction,
        target: 90,
        unit: 'percentage',
        category: 'customer',
        description: 'Avaliação média dos clientes',
        trend: satisfactionTrend.trend,
        changePercentage: satisfactionTrend.changePercentage,
        isGoodTrend: satisfactionTrend.trend === 'up',
        lastUpdated: new Date(),
      },
      {
        id: 'retention',
        title: 'Taxa de Retenção',
        value: currentRetention,
        previousValue: previousRetention,
        target: 90,
        unit: 'percentage',
        category: 'customer',
        description: 'Clientes que renovaram o contrato',
        trend: retentionTrend.trend,
        changePercentage: retentionTrend.changePercentage,
        isGoodTrend: retentionTrend.trend === 'up',
        lastUpdated: new Date(),
      },
    ];
  } catch (error) {
    console.error('Erro ao buscar métricas de cliente:', error);
    return [];
  }
}

// ⚡ Métricas de Performance
async function getPerformanceMetrics(): Promise<KPIMetric[]> {
  try {
    // Tempo de resposta
    const currentResponseTime = 0.5 + Math.random() * 2; // 0.5-2.5s
    const previousResponseTime = currentResponseTime * (0.8 + Math.random() * 0.4);
    const responseTrend = calculateTrend(currentResponseTime, previousResponseTime);

    // Uptime
    const currentUptime = 98 + Math.random() * 2; // 98-100%
    const previousUptime = currentUptime * (0.98 + Math.random() * 0.02);
    const uptimeTrend = calculateTrend(currentUptime, previousUptime);

    // Taxa de erro
    const currentErrorRate = Math.random() * 2; // 0-2%
    const previousErrorRate = currentErrorRate * (0.5 + Math.random() * 1.5);
    const errorTrend = calculateTrend(currentErrorRate, previousErrorRate);

    return [
      {
        id: 'response_time',
        title: 'Tempo de Resposta',
        value: currentResponseTime,
        previousValue: previousResponseTime,
        target: 1.0,
        unit: 'time',
        category: 'performance',
        description: 'Tempo médio de resposta da API',
        trend: responseTrend.trend,
        changePercentage: responseTrend.changePercentage,
        isGoodTrend: responseTrend.trend === 'down', // Menor é melhor
        lastUpdated: new Date(),
      },
      {
        id: 'uptime',
        title: 'Disponibilidade',
        value: currentUptime,
        previousValue: previousUptime,
        target: 99.9,
        unit: 'percentage',
        category: 'performance',
        description: 'Tempo de atividade do sistema',
        trend: uptimeTrend.trend,
        changePercentage: uptimeTrend.changePercentage,
        isGoodTrend: uptimeTrend.trend === 'up',
        lastUpdated: new Date(),
      },
      {
        id: 'error_rate',
        title: 'Taxa de Erro',
        value: currentErrorRate,
        previousValue: previousErrorRate,
        target: 0.5,
        unit: 'percentage',
        category: 'performance',
        description: 'Percentual de requisições com erro',
        trend: errorTrend.trend,
        changePercentage: errorTrend.changePercentage,
        isGoodTrend: errorTrend.trend === 'down', // Menor é melhor
        lastUpdated: new Date(),
      },
    ];
  } catch (error) {
    console.error('Erro ao buscar métricas de performance:', error);
    return [];
  }
}

// 🚨 Gerar alertas baseados nas métricas
function generateAlerts(metrics: KPIMetric[]): Array<{
  id: string;
  metric: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}> {
  const alerts: Array<{
    id: string;
    metric: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }> = [];

  for (const metric of metrics) {
    // Alerta para métricas que estão muito abaixo da meta
    if (metric.target && metric.value < metric.target * 0.8) {
      alerts.push({
        id: `alert-${metric.id}-target`,
        metric: metric.title,
        message: `${metric.title} está 20% abaixo da meta`,
        severity: 'high',
        timestamp: new Date(),
      });
    }

    // Alerta para tendências negativas significativas
    if (!metric.isGoodTrend && Math.abs(metric.changePercentage) > 10) {
      alerts.push({
        id: `alert-${metric.id}-trend`,
        metric: metric.title,
        message: `${metric.title} apresenta tendência negativa de ${Math.abs(metric.changePercentage).toFixed(1)}%`,
        severity: Math.abs(metric.changePercentage) > 20 ? 'critical' : 'medium',
        timestamp: new Date(),
      });
    }

    // Alertas específicos por categoria
    if (metric.category === 'performance') {
      if (metric.id === 'response_time' && metric.value > 2) {
        alerts.push({
          id: `alert-${metric.id}-slow`,
          metric: metric.title,
          message: 'Tempo de resposta acima de 2 segundos',
          severity: 'medium',
          timestamp: new Date(),
        });
      }

      if (metric.id === 'error_rate' && metric.value > 1) {
        alerts.push({
          id: `alert-${metric.id}-errors`,
          metric: metric.title,
          message: 'Taxa de erro acima de 1%',
          severity: 'high',
          timestamp: new Date(),
        });
      }
    }
  }

  return alerts;
}

// 📊 Handler principal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categories = searchParams.get('categories')?.split(',') || [
      'financial',
      'operational',
      'customer',
      'performance',
    ];

    // Buscar métricas por categoria
    const allMetrics: KPIMetric[] = [];

    if (categories.includes('financial')) {
      allMetrics.push(...(await getFinancialMetrics()));
    }

    if (categories.includes('operational')) {
      allMetrics.push(...(await getOperationalMetrics()));
    }

    if (categories.includes('customer')) {
      allMetrics.push(...(await getCustomerMetrics()));
    }

    if (categories.includes('performance')) {
      allMetrics.push(...(await getPerformanceMetrics()));
    }

    // Calcular resumo
    const summary = {
      totalRevenue: allMetrics.find(m => m.id === 'revenue')?.value || 0,
      totalOrders: allMetrics.find(m => m.id === 'orders')?.value || 0,
      activeCustomers: allMetrics.find(m => m.id === 'customers')?.value || 0,
      systemHealth: allMetrics.find(m => m.id === 'uptime')?.value || 99,
    };

    // Gerar alertas
    const alerts = generateAlerts(allMetrics);

    const kpiData: KPIData = {
      metrics: allMetrics,
      summary,
      alerts,
    };

    return NextResponse.json(kpiData);
  } catch (error) {
    console.error('Erro na API de KPIs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// 📝 Endpoint para métricas específicas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricIds } = body;

    if (!metricIds || !Array.isArray(metricIds)) {
      return NextResponse.json(
        { error: 'metricIds deve ser um array' },
        { status: 400 }
      );
    }

    // Buscar todas as métricas e filtrar pelos IDs solicitados
    const allMetrics = [
      ...(await getFinancialMetrics()),
      ...(await getOperationalMetrics()),
      ...(await getCustomerMetrics()),
      ...(await getPerformanceMetrics()),
    ];

    const filteredMetrics = allMetrics.filter(metric =>
      metricIds.includes(metric.id)
    );

    return NextResponse.json({ metrics: filteredMetrics });
  } catch (error) {
    console.error('Erro ao buscar métricas específicas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}