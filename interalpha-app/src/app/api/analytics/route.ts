import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsService } from '@/services/analytics/analytics-service';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extrair parâmetros de filtro
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const metric = searchParams.get('metric');
    const period = searchParams.get('period');
    const chartType = searchParams.get('chartType');

    // Definir período padrão (últimos 30 dias)
    const defaultEnd = new Date();
    const defaultStart = new Date(defaultEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filters = {
      dateRange: {
        start: startDate ? startOfDay(new Date(startDate)) : defaultStart,
        end: endDate ? endOfDay(new Date(endDate)) : defaultEnd,
      },
      clientId: clientId || undefined,
      status: status || undefined,
      paymentMethod: paymentMethod || undefined,
    };

    const analyticsService = getAnalyticsService();

    // Se for solicitação de KPIs
    if (!metric && !chartType) {
      const kpis = await analyticsService.calculateKPIs(filters);
      return NextResponse.json({ kpis });
    }

    // Se for solicitação de tendência
    if (metric && period) {
      const trends = await analyticsService.generateTrends(
        metric as 'revenue' | 'orders' | 'clients' | 'payments',
        period as 'daily' | 'weekly' | 'monthly',
        filters
      );
      return NextResponse.json({ trends });
    }

    // Se for solicitação de gráfico
    if (chartType) {
      const chartData = await analyticsService.generateChartData(
        chartType as 'payment-methods' | 'order-status' | 'service-types' | 'monthly-revenue',
        filters
      );
      return NextResponse.json({ chartData });
    }

    // Retornar dados completos se nenhum parâmetro específico
    const [kpis, paymentMethodsChart, orderStatusChart, monthlyRevenueChart] = await Promise.all([
      analyticsService.calculateKPIs(filters),
      analyticsService.generateChartData('payment-methods', filters),
      analyticsService.generateChartData('order-status', filters),
      analyticsService.generateChartData('monthly-revenue', filters),
    ]);

    return NextResponse.json({
      kpis,
      charts: {
        paymentMethods: paymentMethodsChart,
        orderStatus: orderStatusChart,
        monthlyRevenue: monthlyRevenueChart,
      },
      filters,
    });

  } catch (error) {
    console.error('Erro na API de analytics:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, filters, metric, period } = body;

    const analyticsService = getAnalyticsService();

    switch (action) {
      case 'compare-periods':
        const { currentFilters, previousFilters } = body;
        const comparison = await analyticsService.comparePeriods(currentFilters, previousFilters);
        return NextResponse.json({ comparison });

      case 'generate-trends':
        if (!metric || !period || !filters) {
          return NextResponse.json(
            { error: 'Parâmetros obrigatórios: metric, period, filters' },
            { status: 400 }
          );
        }
        
        const trends = await analyticsService.generateTrends(metric, period, filters);
        return NextResponse.json({ trends });

      case 'bulk-charts':
        const { chartTypes } = body;
        if (!chartTypes || !Array.isArray(chartTypes)) {
          return NextResponse.json(
            { error: 'chartTypes deve ser um array' },
            { status: 400 }
          );
        }

        const charts: Record<string, any> = {};
        for (const chartType of chartTypes) {
          charts[chartType] = await analyticsService.generateChartData(chartType, filters);
        }

        return NextResponse.json({ charts });

      default:
        return NextResponse.json(
          { error: 'Ação não suportada' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Erro na API de analytics (POST):', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}