// 📊 Metrics Service - Sistema de Monitoramento de Performance
// Coleta e analisa métricas dos serviços de comunicação

import { createClient } from '@/lib/supabase/client';

interface MetricData {
  service: 'email' | 'sms' | 'whatsapp' | 'communication';
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface PerformanceStats {
  service: string;
  operation: string;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorCount: number;
  lastHour: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
  lastDay: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
}

export class MetricsService {
  private supabase = createClient();
  private metrics: MetricData[] = [];
  private readonly MAX_MEMORY_METRICS = 1000;

  constructor() {
    // Limpar métricas antigas da memória a cada 5 minutos
    setInterval(() => {
      this.cleanupMemoryMetrics();
    }, 5 * 60 * 1000);
  }

  // 📈 Registrar Métrica
  async recordMetric(data: Omit<MetricData, 'timestamp'>): Promise<void> {
    const metric: MetricData = {
      ...data,
      timestamp: new Date()
    };

    // Adicionar à memória para análise rápida
    this.metrics.push(metric);

    // Persistir no banco de dados
    try {
      await this.supabase
        .from('communication_metrics')
        .insert({
          service: metric.service,
          operation: metric.operation,
          duration_ms: metric.duration,
          success: metric.success,
          error_message: metric.error,
          metadata: metric.metadata,
          created_at: metric.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar métrica:', error);
    }

    // Limpar memória se necessário
    if (this.metrics.length > this.MAX_MEMORY_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_MEMORY_METRICS);
    }
  }

  // ⏱️ Wrapper para medir tempo de execução
  async measureOperation<T>(
    service: MetricData['service'],
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      const result = await fn();
      success = true;
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      await this.recordMetric({
        service,
        operation,
        duration,
        success,
        error,
        metadata
      });
    }
  }

  // 📊 Obter Estatísticas de Performance
  async getPerformanceStats(
    service?: string,
    timeRange: '1h' | '24h' | '7d' = '24h'
  ): Promise<PerformanceStats[]> {
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const since = new Date(now.getTime() - timeRangeMs[timeRange]);

    try {
      let query = this.supabase
        .from('communication_metrics')
        .select('*')
        .gte('created_at', since.toISOString());

      if (service) {
        query = query.eq('service', service);
      }

      const { data: metrics, error } = await query;

      if (error) throw error;

      // Agrupar por serviço e operação
      const grouped = metrics?.reduce((acc, metric) => {
        const key = `${metric.service}-${metric.operation}`;
        if (!acc[key]) {
          acc[key] = {
            service: metric.service,
            operation: metric.operation,
            metrics: []
          };
        }
        acc[key].metrics.push(metric);
        return acc;
      }, {} as Record<string, any>) || {};

      // Calcular estatísticas
      return Object.values(grouped).map((group: any) => {
        const metrics = group.metrics;
        const totalRequests = metrics.length;
        const successCount = metrics.filter((m: any) => m.success).length;
        const durations = metrics.map((m: any) => m.duration_ms).sort((a: number, b: number) => a - b);
        
        // Métricas da última hora
        const lastHourMetrics = metrics.filter((m: any) => 
          new Date(m.created_at) > new Date(now.getTime() - 60 * 60 * 1000)
        );
        
        // Métricas do último dia
        const lastDayMetrics = metrics.filter((m: any) => 
          new Date(m.created_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
        );

        return {
          service: group.service,
          operation: group.operation,
          totalRequests,
          successRate: (successCount / totalRequests) * 100,
          averageResponseTime: durations.reduce((a: number, b: number) => a + b, 0) / durations.length,
          p95ResponseTime: durations[Math.floor(durations.length * 0.95)] || 0,
          errorCount: totalRequests - successCount,
          lastHour: {
            requests: lastHourMetrics.length,
            errors: lastHourMetrics.filter((m: any) => !m.success).length,
            avgResponseTime: lastHourMetrics.reduce((sum: number, m: any) => sum + m.duration_ms, 0) / lastHourMetrics.length || 0
          },
          lastDay: {
            requests: lastDayMetrics.length,
            errors: lastDayMetrics.filter((m: any) => !m.success).length,
            avgResponseTime: lastDayMetrics.reduce((sum: number, m: any) => sum + m.duration_ms, 0) / lastDayMetrics.length || 0
          }
        };
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return [];
    }
  }

  // 🏥 Verificar Saúde dos Serviços
  async getServiceHealth(): Promise<ServiceHealth[]> {
    const services = ['email', 'sms', 'whatsapp', 'communication'];
    const healthChecks: ServiceHealth[] = [];

    for (const service of services) {
      const stats = await this.getPerformanceStats(service, '1h');
      const serviceStats = stats[0];

      if (!serviceStats) {
        healthChecks.push({
          service,
          status: 'down',
          uptime: 0,
          lastCheck: new Date(),
          responseTime: 0,
          errorRate: 100
        });
        continue;
      }

      const errorRate = (serviceStats.errorCount / serviceStats.totalRequests) * 100;
      const avgResponseTime = serviceStats.averageResponseTime;

      let status: ServiceHealth['status'] = 'healthy';
      if (errorRate > 10 || avgResponseTime > 5000) {
        status = 'degraded';
      }
      if (errorRate > 50 || avgResponseTime > 30000) {
        status = 'down';
      }

      healthChecks.push({
        service,
        status,
        uptime: serviceStats.successRate,
        lastCheck: new Date(),
        responseTime: avgResponseTime,
        errorRate
      });
    }

    return healthChecks;
  }

  // 🚨 Detectar Anomalias
  async detectAnomalies(): Promise<Array<{
    service: string;
    operation: string;
    type: 'high_error_rate' | 'slow_response' | 'volume_spike';
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: Date;
  }>> {
    const anomalies = [];
    const stats = await this.getPerformanceStats(undefined, '1h');

    for (const stat of stats) {
      // Alta taxa de erro
      if (stat.lastHour.errors / stat.lastHour.requests > 0.1) {
        anomalies.push({
          service: stat.service,
          operation: stat.operation,
          type: 'high_error_rate' as const,
          severity: stat.lastHour.errors / stat.lastHour.requests > 0.3 ? 'high' as const : 'medium' as const,
          description: `Taxa de erro de ${((stat.lastHour.errors / stat.lastHour.requests) * 100).toFixed(1)}% na última hora`,
          timestamp: new Date()
        });
      }

      // Resposta lenta
      if (stat.lastHour.avgResponseTime > 5000) {
        anomalies.push({
          service: stat.service,
          operation: stat.operation,
          type: 'slow_response' as const,
          severity: stat.lastHour.avgResponseTime > 15000 ? 'high' as const : 'medium' as const,
          description: `Tempo de resposta médio de ${stat.lastHour.avgResponseTime.toFixed(0)}ms na última hora`,
          timestamp: new Date()
        });
      }

      // Pico de volume
      const hourlyAvg = stat.lastDay.requests / 24;
      if (stat.lastHour.requests > hourlyAvg * 3) {
        anomalies.push({
          service: stat.service,
          operation: stat.operation,
          type: 'volume_spike' as const,
          severity: stat.lastHour.requests > hourlyAvg * 5 ? 'high' as const : 'low' as const,
          description: `Pico de ${stat.lastHour.requests} requisições na última hora (média: ${hourlyAvg.toFixed(0)})`,
          timestamp: new Date()
        });
      }
    }

    return anomalies;
  }

  // 🧹 Limpar métricas antigas da memória
  private cleanupMemoryMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.metrics = this.metrics.filter(metric => metric.timestamp > oneHourAgo);
  }

  // 📈 Obter métricas em tempo real (últimos 5 minutos)
  getRealTimeMetrics(): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    errorCount: number;
    byService: Record<string, {
      requests: number;
      errors: number;
      avgResponseTime: number;
    }>;
  } {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > fiveMinutesAgo);

    const totalRequests = recentMetrics.length;
    const successCount = recentMetrics.filter(m => m.success).length;
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);

    const byService = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.service]) {
        acc[metric.service] = { requests: 0, errors: 0, totalDuration: 0 };
      }
      acc[metric.service].requests++;
      if (!metric.success) acc[metric.service].errors++;
      acc[metric.service].totalDuration += metric.duration;
      return acc;
    }, {} as Record<string, any>);

    // Calcular médias por serviço
    Object.keys(byService).forEach(service => {
      const serviceData = byService[service];
      serviceData.avgResponseTime = serviceData.totalDuration / serviceData.requests;
      delete serviceData.totalDuration;
    });

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      averageResponseTime: totalRequests > 0 ? totalDuration / totalRequests : 0,
      errorCount: totalRequests - successCount,
      byService
    };
  }
}

// 🚀 Instância Singleton
export const metricsService = new MetricsService();