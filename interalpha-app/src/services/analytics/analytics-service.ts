import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface KPIData {
  revenue: number;
  activeOrders: number;
  completedOrders: number;
  conversionRate: number;
  customerSatisfaction: number;
  averageTicket: number;
  totalClients: number;
  newClients: number;
  pendingPayments: number;
  overduePayments: number;
}

export interface TrendData {
  labels: string[];
  values: number[];
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

export interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  clientId?: string;
  serviceType?: string;
  status?: string;
  paymentMethod?: string;
}

export class AnalyticsService {
  
  // Calcular KPIs principais
  async calculateKPIs(filters: AnalyticsFilters): Promise<KPIData> {
    const { dateRange } = filters;
    
    // Buscar dados em paralelo para melhor performance
    const [
      paymentsData,
      ordersData,
      clientsData,
      overdueData
    ] = await Promise.all([
      this.getPaymentsData(filters),
      this.getOrdersData(filters),
      this.getClientsData(filters),
      this.getOverduePayments(filters)
    ]);

    const revenue = paymentsData.reduce((sum, p) => sum + p.valor, 0);
    const totalPayments = paymentsData.length;
    const averageTicket = totalPayments > 0 ? revenue / totalPayments : 0;
    
    const activeOrders = ordersData.filter(o => 
      ['PENDENTE', 'EM_ANDAMENTO', 'AGUARDANDO_APROVACAO'].includes(o.status)
    ).length;
    
    const completedOrders = ordersData.filter(o => o.status === 'CONCLUIDA').length;
    const totalOrders = ordersData.length;
    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      revenue,
      activeOrders,
      completedOrders,
      conversionRate,
      customerSatisfaction: 85, // Placeholder - implementar sistema de avaliação
      averageTicket,
      totalClients: clientsData.total,
      newClients: clientsData.new,
      pendingPayments: overdueData.pending,
      overduePayments: overdueData.overdue,
    };
  }

  // Gerar dados de tendência
  async generateTrends(
    metric: 'revenue' | 'orders' | 'clients' | 'payments',
    period: 'daily' | 'weekly' | 'monthly',
    filters: AnalyticsFilters
  ): Promise<TrendData> {
    const periods = this.generatePeriods(period, filters.dateRange);
    const values: number[] = [];
    
    for (const periodRange of periods) {
      const periodFilters = { ...filters, dateRange: periodRange };
      let value = 0;
      
      switch (metric) {
        case 'revenue':
          const payments = await this.getPaymentsData(periodFilters);
          value = payments.reduce((sum, p) => sum + p.valor, 0);
          break;
        case 'orders':
          const orders = await this.getOrdersData(periodFilters);
          value = orders.length;
          break;
        case 'clients':
          const clients = await this.getClientsData(periodFilters);
          value = clients.new;
          break;
        case 'payments':
          const paymentsCount = await this.getPaymentsData(periodFilters);
          value = paymentsCount.length;
          break;
      }
      
      values.push(value);
    }

    const labels = periods.map(p => 
      format(p.start, period === 'daily' ? 'dd/MM' : 'MMM', { locale: ptBR })
    );

    // Calcular tendência
    const trend = this.calculateTrend(values);
    
    return {
      labels,
      values,
      trend: trend.direction,
      percentage: trend.percentage,
    };
  }

  // Gerar dados para gráficos de pizza/barras
  async generateChartData(
    type: 'payment-methods' | 'order-status' | 'service-types' | 'monthly-revenue',
    filters: AnalyticsFilters
  ): Promise<ChartData[]> {
    switch (type) {
      case 'payment-methods':
        return this.getPaymentMethodsChart(filters);
      case 'order-status':
        return this.getOrderStatusChart(filters);
      case 'service-types':
        return this.getServiceTypesChart(filters);
      case 'monthly-revenue':
        return this.getMonthlyRevenueChart(filters);
      default:
        return [];
    }
  }

  // Métodos auxiliares privados
  private async getPaymentsData(filters: AnalyticsFilters) {
    return await prisma.pagamento.findMany({
      where: {
        createdAt: {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end,
        },
        ...(filters.paymentMethod && { metodo: filters.paymentMethod }),
      },
      include: {
        ordemServico: {
          include: {
            cliente: true,
          },
        },
      },
    });
  }

  private async getOrdersData(filters: AnalyticsFilters) {
    return await prisma.ordemServico.findMany({
      where: {
        createdAt: {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end,
        },
        ...(filters.clientId && { clienteId: filters.clientId }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        cliente: true,
        pagamentos: true,
      },
    });
  }

  private async getClientsData(filters: AnalyticsFilters) {
    const [total, newClients] = await Promise.all([
      prisma.cliente.count(),
      prisma.cliente.count({
        where: {
          createdAt: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end,
          },
        },
      }),
    ]);

    return { total, new: newClients };
  }

  private async getOverduePayments(filters: AnalyticsFilters) {
    const now = new Date();
    
    const [pending, overdue] = await Promise.all([
      prisma.ordemServico.count({
        where: {
          status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
          pagamentos: { none: {} },
        },
      }),
      prisma.ordemServico.count({
        where: {
          status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
          createdAt: { lt: subDays(now, 30) },
          pagamentos: { none: {} },
        },
      }),
    ]);

    return { pending, overdue };
  }

  private async getPaymentMethodsChart(filters: AnalyticsFilters): Promise<ChartData[]> {
    const payments = await this.getPaymentsData(filters);
    const methodCounts = payments.reduce((acc, payment) => {
      acc[payment.metodo] = (acc[payment.metodo] || 0) + payment.valor;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(methodCounts).reduce((sum, value) => sum + value, 0);
    
    const methodNames = {
      DINHEIRO: 'Dinheiro',
      PIX: 'PIX',
      CARTAO_CREDITO: 'Cartão de Crédito',
      CARTAO_DEBITO: 'Cartão de Débito',
      TRANSFERENCIA: 'Transferência',
      BOLETO: 'Boleto',
    };

    const colors = {
      DINHEIRO: '#10B981',
      PIX: '#8B5CF6',
      CARTAO_CREDITO: '#F59E0B',
      CARTAO_DEBITO: '#EF4444',
      TRANSFERENCIA: '#3B82F6',
      BOLETO: '#6B7280',
    };

    return Object.entries(methodCounts).map(([method, value]) => ({
      name: methodNames[method as keyof typeof methodNames] || method,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: colors[method as keyof typeof colors] || '#6B7280',
    }));
  }

  private async getOrderStatusChart(filters: AnalyticsFilters): Promise<ChartData[]> {
    const orders = await this.getOrdersData(filters);
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusNames = {
      PENDENTE: 'Pendente',
      EM_ANDAMENTO: 'Em Andamento',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada',
      AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
    };

    const colors = {
      PENDENTE: '#F59E0B',
      EM_ANDAMENTO: '#3B82F6',
      CONCLUIDA: '#10B981',
      CANCELADA: '#EF4444',
      AGUARDANDO_APROVACAO: '#8B5CF6',
    };

    const total = Object.values(statusCounts).reduce((sum, value) => sum + value, 0);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusNames[status as keyof typeof statusNames] || status,
      value: count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      color: colors[status as keyof typeof colors] || '#6B7280',
    }));
  }

  private async getServiceTypesChart(filters: AnalyticsFilters): Promise<ChartData[]> {
    const orders = await this.getOrdersData(filters);
    const serviceCounts = orders.reduce((acc, order) => {
      const serviceType = order.titulo.split(' ')[0]; // Primeira palavra como tipo
      acc[serviceType] = (acc[serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(serviceCounts).reduce((sum, value) => sum + value, 0);

    return Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 tipos de serviço
      .map(([service, count], index) => ({
        name: service,
        value: count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: `hsl(${(index * 36) % 360}, 70%, 50%)`,
      }));
  }

  private async getMonthlyRevenueChart(filters: AnalyticsFilters): Promise<ChartData[]> {
    const months = this.generateMonthlyPeriods(filters.dateRange);
    const data: ChartData[] = [];

    for (const month of months) {
      const monthFilters = { ...filters, dateRange: month };
      const payments = await this.getPaymentsData(monthFilters);
      const revenue = payments.reduce((sum, p) => sum + p.valor, 0);

      data.push({
        name: format(month.start, 'MMM yyyy', { locale: ptBR }),
        value: revenue,
      });
    }

    return data;
  }

  private generatePeriods(period: 'daily' | 'weekly' | 'monthly', range: DateRange): DateRange[] {
    const periods: DateRange[] = [];
    const { start, end } = range;

    switch (period) {
      case 'daily':
        let currentDay = startOfDay(start);
        while (currentDay <= end) {
          periods.push({
            start: currentDay,
            end: endOfDay(currentDay),
          });
          currentDay = new Date(currentDay.getTime() + 24 * 60 * 60 * 1000);
        }
        break;

      case 'monthly':
        let currentMonth = startOfMonth(start);
        while (currentMonth <= end) {
          periods.push({
            start: currentMonth,
            end: endOfMonth(currentMonth),
          });
          currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }
        break;
    }

    return periods;
  }

  private generateMonthlyPeriods(range: DateRange): DateRange[] {
    const periods: DateRange[] = [];
    let current = startOfMonth(range.start);
    const end = endOfMonth(range.end);

    while (current <= end) {
      periods.push({
        start: current,
        end: endOfMonth(current),
      });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return periods;
  }

  private calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; percentage: number } {
    if (values.length < 2) return { direction: 'stable', percentage: 0 };

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    if (firstAvg === 0) return { direction: 'stable', percentage: 0 };

    const percentage = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(percentage) < 5) return { direction: 'stable', percentage: 0 };
    
    return {
      direction: percentage > 0 ? 'up' : 'down',
      percentage: Math.abs(percentage),
    };
  }

  // Comparar períodos
  async comparePeriods(
    currentFilters: AnalyticsFilters,
    previousFilters: AnalyticsFilters
  ): Promise<{
    current: KPIData;
    previous: KPIData;
    changes: Record<keyof KPIData, { value: number; percentage: number; trend: 'up' | 'down' | 'stable' }>;
  }> {
    const [current, previous] = await Promise.all([
      this.calculateKPIs(currentFilters),
      this.calculateKPIs(previousFilters),
    ]);

    const changes = {} as any;

    Object.keys(current).forEach(key => {
      const currentValue = current[key as keyof KPIData];
      const previousValue = previous[key as keyof KPIData];
      const difference = currentValue - previousValue;
      const percentage = previousValue !== 0 ? (difference / previousValue) * 100 : 0;

      changes[key] = {
        value: difference,
        percentage: Math.abs(percentage),
        trend: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable',
      };
    });

    return { current, previous, changes };
  }
}

// Singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
}