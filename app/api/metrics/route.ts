import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { metricsService } from '@/lib/services/metrics-service';
import { withMetricsCache } from '@/lib/middleware/cache-middleware';
import { CACHE_TTL } from '@/lib/services/cache-service';
import { withMetricsLogging, withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware'
import { withMetricsApiMetrics, withAuthenticatedApiMetrics } from '@/lib/middleware/metrics-middleware';

// 📊 Interface para resposta da API
interface MetricsResponse {
  services: Array<{
    service: string;
    totalOperations: number;
    successRate: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    errorCount: number;
    lastHour: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  health: Array<{
    service: string;
    status: 'healthy' | 'warning' | 'critical';
    lastCheck: string;
    uptime: number;
    issues: string[];
  }>;
  anomalies: Array<{
    service: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
    timestamp: string;
  }>;
}

// 🎯 Calcular tendência baseada em dados históricos
function calculateTrend(currentHour: number, previousHour: number): 'up' | 'down' | 'stable' {
  const change = ((currentHour - previousHour) / previousHour) * 100;
  
  if (change > 10) return 'up';
  if (change < -10) return 'down';
  return 'stable';
}

// 🏥 Determinar status de saúde baseado em métricas
function determineHealthStatus(
  successRate: number, 
  averageResponseTime: number, 
  errorCount: number
): { status: 'healthy' | 'warning' | 'critical'; issues: string[] } {
  const issues: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  // Verificar taxa de sucesso
  if (successRate < 95) {
    issues.push(`Taxa de sucesso baixa: ${successRate.toFixed(1)}%`);
    status = successRate < 90 ? 'critical' : 'warning';
  }

  // Verificar tempo de resposta
  if (averageResponseTime > 2000) {
    issues.push(`Tempo de resposta elevado: ${averageResponseTime}ms`);
    status = averageResponseTime > 5000 ? 'critical' : 'warning';
  }

  // Verificar contagem de erros
  if (errorCount > 50) {
    issues.push(`Muitos erros recentes: ${errorCount} erros`);
    status = errorCount > 100 ? 'critical' : 'warning';
  }

  return { status, issues };
}

// 🚨 Detectar anomalias nas métricas
function detectAnomalies(services: any[]): Array<{
  service: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: string;
}> {
  const anomalies: any[] = [];
  const now = new Date().toISOString();

  services.forEach(service => {
    // Anomalia: Taxa de erro alta
    const errorRate = ((service.errorCount / service.totalOperations) * 100);
    if (errorRate > 2) {
      anomalies.push({
        service: service.service,
        metric: 'errorRate',
        value: parseFloat(errorRate.toFixed(2)),
        threshold: 2.0,
        severity: errorRate > 5 ? 'critical' : 'warning',
        timestamp: now
      });
    }

    // Anomalia: Tempo de resposta alto
    if (service.averageResponseTime > 3000) {
      anomalies.push({
        service: service.service,
        metric: 'responseTime',
        value: service.averageResponseTime,
        threshold: 3000,
        severity: service.averageResponseTime > 5000 ? 'critical' : 'warning',
        timestamp: now
      });
    }

    // Anomalia: Taxa de sucesso baixa
    if (service.successRate < 95) {
      anomalies.push({
        service: service.service,
        metric: 'successRate',
        value: service.successRate,
        threshold: 95.0,
        severity: service.successRate < 90 ? 'critical' : 'warning',
        timestamp: now
      });
    }
  });

  return anomalies;
}

// 📈 GET - Obter métricas de performance
async function getMetrics(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calcular período de tempo
    const now = new Date();
    const hoursBack = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
    const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

    // Obter estatísticas de cada serviço
    const services = ['email', 'sms', 'whatsapp', 'communication'];
    const serviceMetrics = await Promise.all(
      services.map(async (service) => {
        const stats = await metricsService.getPerformanceStats(service, timeRange as '1h' | '24h' | '7d');
        
        // Agregar estatísticas por serviço
        const serviceStats = stats.reduce((acc, stat) => {
          acc.totalRequests += stat.totalRequests;
          acc.errorCount += stat.errorCount;
          acc.lastHour.requests += stat.lastHour.requests;
          acc.lastDay.requests += stat.lastDay.requests;
          
          // Calcular médias ponderadas
          const totalOps = acc.totalRequests || 1;
          acc.averageResponseTime = ((acc.averageResponseTime * (totalOps - stat.totalRequests)) + 
                                   (stat.averageResponseTime * stat.totalRequests)) / totalOps;
          acc.p95ResponseTime = Math.max(acc.p95ResponseTime, stat.p95ResponseTime);
          
          return acc;
        }, {
          totalRequests: 0,
          errorCount: 0,
          averageResponseTime: 0,
          p95ResponseTime: 0,
          successRate: 0,
          lastHour: { requests: 0, errors: 0, avgResponseTime: 0 },
          lastDay: { requests: 0, errors: 0, avgResponseTime: 0 }
        });

        // Calcular taxa de sucesso
        serviceStats.successRate = serviceStats.totalRequests > 0 
          ? ((serviceStats.totalRequests - serviceStats.errorCount) / serviceStats.totalRequests) * 100 
          : 100;

        // Calcular tendência baseada na última hora vs dia anterior
        const trend = calculateTrend(serviceStats.lastHour.requests, serviceStats.lastDay.requests / 24);
        
        return {
          service,
          totalOperations: serviceStats.totalRequests,
          successRate: parseFloat(serviceStats.successRate.toFixed(1)),
          averageResponseTime: Math.round(serviceStats.averageResponseTime),
          p95ResponseTime: Math.round(serviceStats.p95ResponseTime),
          errorCount: serviceStats.errorCount,
          lastHour: serviceStats.lastHour.requests,
          trend
        };
      })
    );

    // Calcular saúde dos serviços
    const healthData = serviceMetrics.map(service => {
      const health = determineHealthStatus(
        service.successRate,
        service.averageResponseTime,
        service.errorCount
      );

      // Calcular uptime (simulado baseado na taxa de sucesso)
      const uptime = Math.min(99.9, service.successRate + Math.random() * 2);

      return {
        service: service.service,
        status: health.status,
        lastCheck: now.toISOString(),
        uptime: parseFloat(uptime.toFixed(1)),
        issues: health.issues
      };
    });

    // Detectar anomalias
    const anomalies = detectAnomalies(serviceMetrics);

    const response: MetricsResponse = {
      services: serviceMetrics,
      health: healthData,
      anomalies
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// 🧹 DELETE - Limpar métricas antigas
async function deleteOldMetrics(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Usar cliente Supabase diretamente para limpeza
    const supabase = await createClient();
    const { error } = await supabase
      .from('communication_metrics')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `Métricas anteriores a ${cutoffDate.toISOString()} foram removidas` 
    });

  } catch (error) {
    console.error('Erro ao limpar métricas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// 📊 POST - Registrar métrica manual
async function recordMetric(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, operation, duration, success, error, metadata } = body;

    // Validar dados obrigatórios
    if (!service || !operation || duration === undefined || success === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: service, operation, duration, success' },
        { status: 400 }
      );
    }

    // Registrar métrica
    await metricsService.recordMetric({
      service,
      operation,
      duration,
      success,
      error,
      metadata
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Métrica registrada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao registrar métrica:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportações com cache, logging e métricas aplicados
export const GET = withMetricsCache(CACHE_TTL.SHORT)(getMetrics)
export const DELETE = withAuthenticatedApiMetrics(withAuthenticatedApiLogging(deleteOldMetrics))
export const POST = withMetricsApiMetrics(withMetricsLogging(recordMetric))