// 📊 Application Metrics Service - Monitoramento Abrangente da Aplicação
// Coleta métricas de performance, uso, erros e recursos do sistema
import { createClient } from '@/lib/supabase/client';

// 📈 Tipos de Métricas
export interface ApplicationMetric {
  id?: string;
  category: 'performance' | 'usage' | 'error' | 'business' | 'system';
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'percentage' | 'bytes' | 'rate';
  tags: Record<string, string>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetric extends ApplicationMetric {
  category: 'performance';
  name:
    | 'page_load_time'
    | 'api_response_time'
    | 'database_query_time'
    | 'render_time'
    | 'bundle_size';
}

export interface UsageMetric extends ApplicationMetric {
  category: 'usage';
  name:
    | 'page_views'
    | 'user_sessions'
    | 'feature_usage'
    | 'api_calls'
    | 'concurrent_users';
}

export interface ErrorMetric extends ApplicationMetric {
  category: 'error';
  name: 'error_rate' | 'exception_count' | 'failed_requests' | 'timeout_errors';
}

export interface BusinessMetric extends ApplicationMetric {
  category: 'business';
  name: 'orders_created' | 'clients_registered' | 'revenue' | 'conversion_rate';
}

export interface SystemMetric extends ApplicationMetric {
  category: 'system';
  name: 'memory_usage' | 'cpu_usage' | 'disk_usage' | 'network_latency';
}

// 📊 Agregações de Métricas
export interface MetricAggregation {
  name: string;
  category: string;
  timeRange: '5m' | '1h' | '24h' | '7d' | '30d';
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'p95' | 'p99';
  value: number;
  unit: string;
  timestamp: Date;
}

// 🎯 Alertas de Métricas
export interface MetricAlert {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
  description: string;
}

export class ApplicationMetricsService {
  private supabase = createClient();
  private metricsBuffer: ApplicationMetric[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 segundos
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startBufferFlush();
  }

  // 📊 Registrar Métrica
  async recordMetric(
    metric: Omit<ApplicationMetric, 'timestamp'>
  ): Promise<void> {
    const fullMetric: ApplicationMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metricsBuffer.push(fullMetric);

    // Flush imediato se buffer estiver cheio
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      await this.flushMetrics();
    }
  }

  // ⚡ Métricas de Performance
  async recordPerformanceMetric(
    name: PerformanceMetric['name'],
    value: number,
    tags: Record<string, string> = {},
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.recordMetric({
      category: 'performance',
      name,
      value,
      unit: name.includes('time')
        ? 'ms'
        : name === 'bundle_size'
          ? 'bytes'
          : 'count',
      tags,
      metadata,
    });
  }

  // 👥 Métricas de Uso
  async recordUsageMetric(
    name: UsageMetric['name'],
    value: number = 1,
    tags: Record<string, string> = {},
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.recordMetric({
      category: 'usage',
      name,
      value,
      unit: 'count',
      tags,
      metadata,
    });
  }

  // ❌ Métricas de Erro
  async recordErrorMetric(
    name: ErrorMetric['name'],
    value: number = 1,
    tags: Record<string, string> = {},
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.recordMetric({
      category: 'error',
      name,
      value,
      unit: name === 'error_rate' ? 'percentage' : 'count',
      tags,
      metadata,
    });
  }

  // 💼 Métricas de Negócio
  async recordBusinessMetric(
    name: BusinessMetric['name'],
    value: number,
    tags: Record<string, string> = {},
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.recordMetric({
      category: 'business',
      name,
      value,
      unit:
        name === 'conversion_rate'
          ? 'percentage'
          : name === 'revenue'
            ? 'count'
            : 'count',
      tags,
      metadata,
    });
  }

  // 🖥️ Métricas de Sistema
  async recordSystemMetric(
    name: SystemMetric['name'],
    value: number,
    tags: Record<string, string> = {},
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.recordMetric({
      category: 'system',
      name,
      value,
      unit: name.includes('usage')
        ? 'percentage'
        : name === 'network_latency'
          ? 'ms'
          : 'bytes',
      tags,
      metadata,
    });
  }

  // ⏱️ Wrapper para medir tempo de execução
  async measureExecutionTime<T>(
    operation: string,
    fn: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      await this.recordPerformanceMetric('api_response_time', duration, {
        ...tags,
        operation,
        status: 'success',
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      await this.recordPerformanceMetric('api_response_time', duration, {
        ...tags,
        operation,
        status: 'error',
      });

      await this.recordErrorMetric('exception_count', 1, {
        ...tags,
        operation,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  // 📈 Obter Agregações de Métricas
  async getMetricAggregations(
    category?: string,
    timeRange: '5m' | '1h' | '24h' | '7d' | '30d' = '24h',
    names?: string[]
  ): Promise<MetricAggregation[]> {
    try {
      let query = this.supabase.from('application_metrics').select('*');

      if (category) {
        query = query.eq('category', category);
      }

      if (names && names.length > 0) {
        query = query.in('name', names);
      }

      // Filtro de tempo
      const now = new Date();
      const timeRangeMs = {
        '5m': 5 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };

      const startTime = new Date(now.getTime() - timeRangeMs[timeRange]);
      query = query.gte('timestamp', startTime.toISOString());

      const { data, error } = await query;

      if (error) throw error;

      // Agregar dados por nome e categoria (parse rows safely)
      const aggregations: Record<string, MetricAggregation> = {};

      type Row = Partial<Record<string, unknown>> & { name?: string; category?: string; value?: number; unit?: string };

      const rows: Row[] = (data || []) as Row[];

      rows.forEach((metric) => {
        const name = String(metric.name || 'unknown');
        const category = String(metric.category || 'usage');
        const key = `${category}_${name}`;

        if (!aggregations[key]) {
          aggregations[key] = {
            name,
            category,
            timeRange,
            aggregation: 'avg',
            value: 0,
            unit: String(metric.unit || 'count'),
            timestamp: new Date(),
          };
        }

        const val = typeof metric.value === 'number' ? metric.value : Number(metric.value || 0);
        // Calcular média simples (pode ser expandido para outras agregações)
        aggregations[key].value = (aggregations[key].value + val) / 2;
      });

      return Object.values(aggregations);
    } catch (error) {
      console.error('Erro ao obter agregações de métricas:', error);
      return [];
    }
  }

  // 🚨 Verificar Alertas
  async checkAlerts(): Promise<MetricAlert[]> {
    // Implementação básica - pode ser expandida
    const triggeredAlerts: MetricAlert[] = [];

    try {
      // Buscar alertas ativos
      const { data: alerts } = await this.supabase
        .from('metric_alerts')
        .select('*')
        .eq('enabled', true);

      if (!alerts) return [];

      // Verificar cada alerta
      for (const alert of alerts) {
        const recentMetrics = await this.getMetricAggregations(
          undefined,
          '5m',
          [alert.metric]
        );

        const metric = recentMetrics.find(m => m.name === alert.metric);

        if (metric && this.shouldTriggerAlert(metric.value, alert)) {
          triggeredAlerts.push({
            ...alert,
            lastTriggered: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
    }

    return triggeredAlerts;
  }

  // 🔄 Flush do Buffer de Métricas
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = [];

      const { error } = await this.supabase.from('application_metrics').insert(
        metricsToFlush.map(metric => ({
          category: metric.category,
          name: metric.name,
          value: metric.value,
          unit: metric.unit,
          tags: metric.tags,
          metadata: metric.metadata,
          timestamp: metric.timestamp.toISOString(),
        }))
      );

      if (error) {
        console.error('Erro ao salvar métricas:', error);
        // Recolocar métricas no buffer em caso de erro
        this.metricsBuffer.unshift(...metricsToFlush);
      }
    } catch (error) {
      console.error('Erro no flush de métricas:', error);
    }
  }

  // ⏰ Iniciar Flush Automático
  private startBufferFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.FLUSH_INTERVAL);
  }

  // 🎯 Verificar se Alerta Deve Ser Disparado
  private shouldTriggerAlert(value: number, alert: MetricAlert): boolean {
    switch (alert.condition) {
      case 'greater_than':
        return value > alert.threshold;
      case 'less_than':
        return value < alert.threshold;
      case 'equals':
        return value === alert.threshold;
      case 'not_equals':
        return value !== alert.threshold;
      default:
        return false;
    }
  }

  // 🧹 Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushMetrics(); // Flush final
  }
}

// 🌟 Instância Global
export const applicationMetrics = new ApplicationMetricsService();

// 🎨 Decorators para Métricas Automáticas
export function MeasurePerformance(
  metricName: string,
  tags: Record<string, string> = {}
) {
  return function (
    target: unknown,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: any, ...args: unknown[]) {
      return await applicationMetrics.measureExecutionTime(
        metricName,
        () => method.apply(this, args) as Promise<unknown>,
        tags
      );
    } as any;

    return descriptor;
  };
}

export function TrackUsage(
  metricName: string,
  tags: Record<string, string> = {}
) {
  return function (
    target: unknown,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = async function (this: any, ...args: unknown[]) {
      await applicationMetrics.recordUsageMetric(metricName as any, 1, tags);
      return method.apply(this, args as any);
    } as any;

    return descriptor;
  };
}
