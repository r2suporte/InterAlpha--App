// 📊 Metrics Middleware - Coleta Automática de Métricas em APIs
// Intercepta requisições para coletar métricas de performance e uso

import { NextRequest, NextResponse } from 'next/server';
import { applicationMetrics } from '@/lib/services/application-metrics';

// 📈 Configuração de Métricas
interface MetricsConfig {
  trackPerformance: boolean;
  trackUsage: boolean;
  trackErrors: boolean;
  trackBusiness: boolean;
  customTags?: Record<string, string>;
  excludePaths?: string[];
}

// 🎯 Middleware Principal de Métricas
export function withMetrics(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: MetricsConfig = {
    trackPerformance: true,
    trackUsage: true,
    trackErrors: true,
    trackBusiness: false
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Verificar se deve excluir esta rota
    if (config.excludePaths?.some(excludePath => path.includes(excludePath))) {
      return handler(request);
    }

    // Tags base para todas as métricas
    const baseTags = {
      method,
      path,
      ...config.customTags
    };

    try {
      // Registrar início da requisição
      if (config.trackUsage) {
        await applicationMetrics.recordUsageMetric(
          'api_calls',
          1,
          baseTags
        );
      }

      // Executar handler
      const response = await handler(request);
      const duration = performance.now() - startTime;
      const status = response.status;

      // Registrar métricas de performance
      if (config.trackPerformance) {
        await applicationMetrics.recordPerformanceMetric(
          'api_response_time',
          duration,
          { ...baseTags, status: status.toString() }
        );
      }

      // Registrar métricas de erro se status >= 400
      if (config.trackErrors && status >= 400) {
        await applicationMetrics.recordErrorMetric(
          'failed_requests',
          1,
          { ...baseTags, status: status.toString() }
        );
      }

      return response;

    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Registrar métricas de erro
      if (config.trackErrors) {
        await applicationMetrics.recordErrorMetric(
          'exception_count',
          1,
          { ...baseTags, error: errorMessage }
        );

        await applicationMetrics.recordPerformanceMetric(
          'api_response_time',
          duration,
          { ...baseTags, status: 'error' }
        );
      }

      throw error;
    }
  };
}

// 🚀 Middlewares Pré-configurados

// API Pública (sem autenticação)
export function withPublicApiMetrics(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withMetrics(handler, {
    trackPerformance: true,
    trackUsage: true,
    trackErrors: true,
    trackBusiness: false,
    customTags: { api_type: 'public' }
  });
}

// API Autenticada
export function withAuthenticatedApiMetrics(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withMetrics(handler, {
    trackPerformance: true,
    trackUsage: true,
    trackErrors: true,
    trackBusiness: true,
    customTags: { api_type: 'authenticated' }
  });
}

// API de Admin
export function withAdminApiMetrics(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withMetrics(handler, {
    trackPerformance: true,
    trackUsage: true,
    trackErrors: true,
    trackBusiness: true,
    customTags: { api_type: 'admin' }
  });
}

// API de Métricas (com tracking reduzido para evitar loops)
export function withMetricsApiMetrics(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withMetrics(handler, {
    trackPerformance: true,
    trackUsage: false, // Evitar loop infinito
    trackErrors: true,
    trackBusiness: false,
    customTags: { api_type: 'metrics' }
  });
}

// 📊 Middleware para Métricas de Negócio
export function withBusinessMetrics(
  handler: (request: NextRequest) => Promise<NextResponse>,
  businessMetricName: string,
  extractValue?: (request: NextRequest, response: NextResponse) => number
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);

    // Registrar métrica de negócio apenas em caso de sucesso
    if (response.status >= 200 && response.status < 300) {
      const value = extractValue ? extractValue(request, response) : 1;
      
      await applicationMetrics.recordBusinessMetric(
        businessMetricName as any,
        value,
        {
          method: request.method,
          path: new URL(request.url).pathname
        }
      );
    }

    return response;
  };
}

// 🎨 Decorator para Métodos de Classe
export function ApiMetrics(config?: Partial<MetricsConfig>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      const wrappedHandler = withMetrics(
        async (req) => method.apply(this, [req, ...args]),
        {
          trackPerformance: true,
          trackUsage: true,
          trackErrors: true,
          trackBusiness: false,
          ...config
        }
      );

      return wrappedHandler(request);
    };

    return descriptor;
  };
}

// 📈 Utilitários para Métricas Customizadas

export class ApiMetricsCollector {
  // Registrar métrica customizada durante execução da API
  static async recordCustomMetric(
    category: 'performance' | 'usage' | 'error' | 'business' | 'system',
    name: string,
    value: number,
    unit: 'ms' | 'count' | 'percentage' | 'bytes' | 'rate',
    tags: Record<string, string> = {}
  ): Promise<void> {
    await applicationMetrics.recordMetric({
      category,
      name,
      value,
      unit,
      tags
    });
  }

  // Medir tempo de operação específica
  static async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    return applicationMetrics.measureExecutionTime(operationName, operation, tags);
  }

  // Registrar evento de negócio
  static async recordBusinessEvent(
    eventName: string,
    value: number = 1,
    tags: Record<string, string> = {}
  ): Promise<void> {
    await applicationMetrics.recordBusinessMetric(
      eventName as any,
      value,
      tags
    );
  }

  // Registrar erro customizado
  static async recordError(
    errorType: string,
    errorMessage: string,
    tags: Record<string, string> = {}
  ): Promise<void> {
    await applicationMetrics.recordErrorMetric(
      'exception_count',
      1,
      { ...tags, error_type: errorType, error_message: errorMessage }
    );
  }
}

// 🔍 Middleware para Análise de Performance de Queries
export function withDatabaseMetrics(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    
    try {
      const response = await handler(request);
      const duration = performance.now() - startTime;

      // Registrar tempo de query do banco
      await applicationMetrics.recordPerformanceMetric(
        'database_query_time',
        duration,
        {
          method: request.method,
          path: new URL(request.url).pathname,
          status: response.status.toString()
        }
      );

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      await applicationMetrics.recordPerformanceMetric(
        'database_query_time',
        duration,
        {
          method: request.method,
          path: new URL(request.url).pathname,
          status: 'error'
        }
      );

      throw error;
    }
  };
}