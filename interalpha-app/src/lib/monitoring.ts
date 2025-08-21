/**
 * Sistema de Monitoramento e APM para InterAlpha
 */

'use client'

// Tipos para métricas
export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  unit?: string
}

export interface ErrorEvent {
  id: string
  message: string
  stack?: string
  timestamp: number
  userId?: string
  url: string
  userAgent: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
}

export interface BusinessMetric {
  name: string
  value: number
  timestamp: number
  dimensions?: Record<string, string>
}

// Collector de métricas
class MetricsCollector {
  private metrics: PerformanceMetric[] = []
  private errors: ErrorEvent[] = []
  private businessMetrics: BusinessMetric[] = []
  private maxStoredMetrics = 1000

  // Coletar métricas de performance
  recordMetric(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit
    }

    this.metrics.push(metric)
    
    // Manter apenas as últimas métricas
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics)
    }

    // Enviar para serviço de monitoramento (se configurado)
    this.sendToMonitoringService(metric)
  }

  // Coletar erros
  recordError(error: Error | string, context?: Record<string, any>, severity: ErrorEvent['severity'] = 'medium'): void {
    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      severity,
      context
    }

    this.errors.push(errorEvent)
    
    // Manter apenas os últimos erros
    if (this.errors.length > this.maxStoredMetrics) {
      this.errors = this.errors.slice(-this.maxStoredMetrics)
    }

    // Log crítico no console
    if (severity === 'critical') {
      console.error('CRITICAL ERROR:', errorEvent)
    }

    // Enviar para serviço de monitoramento
    this.sendErrorToMonitoringService(errorEvent)
  }

  // Coletar métricas de negócio
  recordBusinessMetric(name: string, value: number, dimensions?: Record<string, string>): void {
    const metric: BusinessMetric = {
      name,
      value,
      timestamp: Date.now(),
      dimensions
    }

    this.businessMetrics.push(metric)
    
    if (this.businessMetrics.length > this.maxStoredMetrics) {
      this.businessMetrics = this.businessMetrics.slice(-this.maxStoredMetrics)
    }

    this.sendBusinessMetricToService(metric)
  }

  // Obter métricas
  getMetrics(name?: string, timeRange?: { start: number; end: number }): PerformanceMetric[] {
    let filtered = this.metrics

    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }

    if (timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    return filtered
  }

  getErrors(severity?: ErrorEvent['severity'], timeRange?: { start: number; end: number }): ErrorEvent[] {
    let filtered = this.errors

    if (severity) {
      filtered = filtered.filter(e => e.severity === severity)
    }

    if (timeRange) {
      filtered = filtered.filter(e => 
        e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
      )
    }

    return filtered
  }

  // Estatísticas agregadas
  getAggregatedMetrics(name: string, timeRange?: { start: number; end: number }) {
    const metrics = this.getMetrics(name, timeRange)
    
    if (metrics.length === 0) {
      return null
    }

    const values = metrics.map(m => m.value)
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
    }
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index] || 0
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private async sendToMonitoringService(metric: PerformanceMetric): Promise<void> {
    // Implementar envio para serviço de monitoramento (Datadog, New Relic, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.log('Metric:', metric)
    }
  }

  private async sendErrorToMonitoringService(error: ErrorEvent): Promise<void> {
    // Implementar envio para serviço de erro (Sentry, Bugsnag, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.log('Error:', error)
    }
  }

  private async sendBusinessMetricToService(metric: BusinessMetric): Promise<void> {
    // Implementar envio para analytics (Mixpanel, Amplitude, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.log('Business Metric:', metric)
    }
  }
}

// Monitor de performance de APIs
export class APIMonitor {
  private collector: MetricsCollector

  constructor(collector: MetricsCollector) {
    this.collector = collector
  }

  // Wrapper para monitorar chamadas de API
  async monitorAPICall<T>(
    name: string,
    apiCall: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - startTime
      
      this.collector.recordMetric(`api.${name}.duration`, duration, {
        status: 'success',
        ...context
      }, 'ms')
      
      this.collector.recordMetric(`api.${name}.calls`, 1, {
        status: 'success',
        ...context
      }, 'count')

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.collector.recordMetric(`api.${name}.duration`, duration, {
        status: 'error',
        ...context
      }, 'ms')
      
      this.collector.recordMetric(`api.${name}.calls`, 1, {
        status: 'error',
        ...context
      }, 'count')

      this.collector.recordError(error as Error, {
        api: name,
        ...context
      }, 'high')

      throw error
    }
  }
}

// Monitor de performance de componentes React
export class ComponentMonitor {
  private collector: MetricsCollector

  constructor(collector: MetricsCollector) {
    this.collector = collector
  }

  // HOC para monitorar performance de componentes
  withPerformanceMonitoring<P extends Record<string, any>>(
    WrappedComponent: React.ComponentType<P>,
    componentName: string
  ) {
    return React.memo((props: P) => {
      const renderStartTime = React.useRef<number>(0)

      React.useLayoutEffect(() => {
        renderStartTime.current = performance.now()
      })

      React.useEffect(() => {
        const renderTime = performance.now() - renderStartTime.current
        
        this.collector.recordMetric(
          `component.${componentName}.render_time`,
          renderTime,
          { component: componentName },
          'ms'
        )
      })

      return React.createElement(WrappedComponent, props)
    })
  }
}

// Monitor de métricas de negócio
export class BusinessMetricsMonitor {
  private collector: MetricsCollector

  constructor(collector: MetricsCollector) {
    this.collector = collector
  }

  // Rastrear ações do usuário
  trackUserAction(action: string, userId?: string, properties?: Record<string, any>): void {
    this.collector.recordBusinessMetric(`user.action.${action}`, 1, {
      userId,
      ...properties
    })
  }

  // Rastrear conversões
  trackConversion(event: string, value?: number, properties?: Record<string, any>): void {
    this.collector.recordBusinessMetric(`conversion.${event}`, value || 1, properties)
  }

  // Rastrear performance de features
  trackFeatureUsage(feature: string, userId?: string, duration?: number): void {
    this.collector.recordBusinessMetric(`feature.${feature}.usage`, 1, { userId })
    
    if (duration) {
      this.collector.recordBusinessMetric(`feature.${feature}.duration`, duration, { userId })
    }
  }
}

// Sistema de alertas
export class AlertSystem {
  private collector: MetricsCollector
  private thresholds: Map<string, { value: number; condition: 'gt' | 'lt' }> = new Map()
  private alertCallbacks: Map<string, (metric: PerformanceMetric) => void> = new Map()

  constructor(collector: MetricsCollector) {
    this.collector = collector
    this.startMonitoring()
  }

  // Configurar threshold para alerta
  setThreshold(
    metricName: string,
    value: number,
    condition: 'gt' | 'lt',
    callback: (metric: PerformanceMetric) => void
  ): void {
    this.thresholds.set(metricName, { value, condition })
    this.alertCallbacks.set(metricName, callback)
  }

  private startMonitoring(): void {
    // Verificar thresholds a cada 30 segundos
    setInterval(() => {
      this.checkThresholds()
    }, 30000)
  }

  private checkThresholds(): void {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000

    for (const [metricName, threshold] of this.thresholds) {
      const recentMetrics = this.collector.getMetrics(metricName, {
        start: fiveMinutesAgo,
        end: now
      })

      if (recentMetrics.length === 0) continue

      const latestMetric = recentMetrics[recentMetrics.length - 1]
      const shouldAlert = threshold.condition === 'gt' 
        ? latestMetric.value > threshold.value
        : latestMetric.value < threshold.value

      if (shouldAlert) {
        const callback = this.alertCallbacks.get(metricName)
        if (callback) {
          callback(latestMetric)
        }
      }
    }
  }
}

// Instância global do sistema de monitoramento
export const metricsCollector = new MetricsCollector()
export const apiMonitor = new APIMonitor(metricsCollector)
export const componentMonitor = new ComponentMonitor(metricsCollector)
export const businessMetrics = new BusinessMetricsMonitor(metricsCollector)
export const alertSystem = new AlertSystem(metricsCollector)

// Hooks para usar em componentes React
export function usePerformanceTracking(componentName: string) {
  const startTime = React.useRef<number>(0)

  React.useLayoutEffect(() => {
    startTime.current = performance.now()
  })

  React.useEffect(() => {
    const renderTime = performance.now() - startTime.current
    metricsCollector.recordMetric(
      `component.${componentName}.render_time`,
      renderTime,
      { component: componentName },
      'ms'
    )
  })

  const trackAction = React.useCallback((action: string, properties?: Record<string, any>) => {
    businessMetrics.trackUserAction(`${componentName}.${action}`, undefined, properties)
  }, [componentName])

  return { trackAction }
}

export function useErrorBoundary() {
  return React.useCallback((error: Error, errorInfo: any) => {
    metricsCollector.recordError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    }, 'high')
  }, [])
}

// Configurar alertas padrão
alertSystem.setThreshold('api.response_time', 2000, 'gt', (metric) => {
  console.warn(`API response time too high: ${metric.value}ms`)
})

alertSystem.setThreshold('error_rate', 0.05, 'gt', (metric) => {
  console.error(`Error rate too high: ${metric.value}`)
})