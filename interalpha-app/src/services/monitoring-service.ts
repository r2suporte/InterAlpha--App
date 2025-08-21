/**
 * Serviço de monitoramento e métricas de uso
 */

import { prisma } from '@/lib/prisma'
import { cacheService } from './cache-service'
import { CacheKeys, CacheTTL } from '@/lib/redis'

export interface PerformanceMetric {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: Date
  userId?: string
  userAgent?: string
  ip?: string
}

export interface UsageMetric {
  action: string
  resource: string
  resourceId?: string
  userId?: string
  metadata?: any
  timestamp: Date
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  database: {
    connected: boolean
    responseTime: number
    activeConnections: number
  }
  cache: {
    connected: boolean
    hitRate: number
    memoryUsage: string
  }
  apis: {
    [endpoint: string]: {
      averageResponseTime: number
      errorRate: number
      requestsPerMinute: number
    }
  }
}

export interface AlertRule {
  id: string
  name: string
  condition: string
  threshold: number
  enabled: boolean
  cooldownMinutes: number
  lastTriggered?: Date
}

export class MonitoringService {
  private performanceMetrics: PerformanceMetric[] = []
  private usageMetrics: UsageMetric[] = []
  private alertRules: AlertRule[] = []
  private startTime = Date.now()

  constructor() {
    this.initializeDefaultAlerts()
    this.startPeriodicCleanup()
  }

  /**
   * Registrar métrica de performance
   */
  async recordPerformance(metric: PerformanceMetric): Promise<void> {
    try {
      // Armazenar em memória (últimas 1000 métricas)
      this.performanceMetrics.push(metric)
      if (this.performanceMetrics.length > 1000) {
        this.performanceMetrics.shift()
      }

      // Armazenar no cache para agregação
      const key = `metrics:performance:${metric.endpoint}:${Date.now()}`
      await cacheService.set(key, metric, { ttl: CacheTTL.DAILY })

      // Verificar alertas
      await this.checkPerformanceAlerts(metric)

      // Incrementar contador de requests
      const counterKey = `counter:${metric.endpoint}:${metric.method}`
      await cacheService.increment(counterKey, 3600) // 1 hora

    } catch (error) {
      console.error('Error recording performance metric:', error)
    }
  }

  /**
   * Registrar métrica de uso
   */
  async recordUsage(metric: UsageMetric): Promise<void> {
    try {
      // Armazenar em memória
      this.usageMetrics.push(metric)
      if (this.usageMetrics.length > 1000) {
        this.usageMetrics.shift()
      }

      // Armazenar no cache
      const key = `metrics:usage:${metric.action}:${Date.now()}`
      await cacheService.set(key, metric, { ttl: CacheTTL.DAILY })

      // Incrementar contadores por ação
      const actionKey = `usage:${metric.action}:${new Date().toISOString().split('T')[0]}`
      await cacheService.increment(actionKey, CacheTTL.WEEKLY)

      // Incrementar contadores por usuário
      if (metric.userId) {
        const userKey = `user:${metric.userId}:actions:${new Date().toISOString().split('T')[0]}`
        await cacheService.increment(userKey, CacheTTL.WEEKLY)
      }

    } catch (error) {
      console.error('Error recording usage metric:', error)
    }
  }

  /**
   * Obter saúde do sistema
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const [dbHealth, cacheHealth, apiMetrics] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
        this.getApiMetrics()
      ])

      // Calcular uso de memória (Node.js)
      const memUsage = process.memoryUsage()
      const memory = {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      }

      // Determinar status geral
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      
      if (!dbHealth.connected || !cacheHealth.connected) {
        status = 'unhealthy'
      } else if (
        dbHealth.responseTime > 1000 || 
        memory.percentage > 90 ||
        Object.values(apiMetrics).some(api => api.errorRate > 5)
      ) {
        status = 'degraded'
      }

      return {
        status,
        uptime: Date.now() - this.startTime,
        memory,
        database: dbHealth,
        cache: cacheHealth,
        apis: apiMetrics
      }

    } catch (error) {
      console.error('Error getting system health:', error)
      return {
        status: 'unhealthy',
        uptime: Date.now() - this.startTime,
        memory: { used: 0, total: 0, percentage: 0 },
        database: { connected: false, responseTime: 0, activeConnections: 0 },
        cache: { connected: false, hitRate: 0, memoryUsage: 'Error' },
        apis: {}
      }
    }
  }

  /**
   * Obter métricas de performance por endpoint
   */
  async getPerformanceMetrics(endpoint?: string, hours = 24): Promise<any> {
    try {
      const since = new Date(Date.now() - (hours * 60 * 60 * 1000))
      
      let metrics = this.performanceMetrics.filter(m => m.timestamp >= since)
      
      if (endpoint) {
        metrics = metrics.filter(m => m.endpoint === endpoint)
      }

      if (metrics.length === 0) {
        return {
          totalRequests: 0,
          averageResponseTime: 0,
          errorRate: 0,
          requestsPerHour: 0,
          slowestRequests: [],
          errorsByStatus: {}
        }
      }

      // Calcular estatísticas
      const totalRequests = metrics.length
      const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
      const errors = metrics.filter(m => m.statusCode >= 400)
      const errorRate = (errors.length / totalRequests) * 100
      const requestsPerHour = totalRequests / hours

      // Requests mais lentos
      const slowestRequests = metrics
        .sort((a, b) => b.responseTime - a.responseTime)
        .slice(0, 10)
        .map(m => ({
          endpoint: m.endpoint,
          responseTime: m.responseTime,
          timestamp: m.timestamp,
          statusCode: m.statusCode
        }))

      // Erros por status code
      const errorsByStatus = errors.reduce((acc, m) => {
        acc[m.statusCode] = (acc[m.statusCode] || 0) + 1
        return acc
      }, {} as Record<number, number>)

      return {
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerHour: Math.round(requestsPerHour),
        slowestRequests,
        errorsByStatus
      }

    } catch (error) {
      console.error('Error getting performance metrics:', error)
      return null
    }
  }

  /**
   * Obter métricas de uso
   */
  async getUsageMetrics(days = 7): Promise<any> {
    try {
      const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      const metrics = this.usageMetrics.filter(m => m.timestamp >= since)

      // Ações mais comuns
      const actionCounts = metrics.reduce((acc, m) => {
        acc[m.action] = (acc[m.action] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }))

      // Usuários mais ativos
      const userCounts = metrics
        .filter(m => m.userId)
        .reduce((acc, m) => {
          acc[m.userId!] = (acc[m.userId!] || 0) + 1
          return acc
        }, {} as Record<string, number>)

      const topUsers = Object.entries(userCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count }))

      // Atividade por dia
      const dailyActivity = metrics.reduce((acc, m) => {
        const day = m.timestamp.toISOString().split('T')[0]
        acc[day] = (acc[day] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalActions: metrics.length,
        uniqueUsers: Object.keys(userCounts).length,
        topActions,
        topUsers,
        dailyActivity
      }

    } catch (error) {
      console.error('Error getting usage metrics:', error)
      return null
    }
  }

  /**
   * Configurar regra de alerta
   */
  async setAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    const alertRule: AlertRule = {
      id: `alert_${Date.now()}`,
      ...rule
    }

    this.alertRules.push(alertRule)

    // Persistir no cache
    const key = `alert:rule:${alertRule.id}`
    await cacheService.set(key, alertRule, { ttl: CacheTTL.WEEKLY })

    return alertRule.id
  }

  /**
   * Obter todas as regras de alerta
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  /**
   * Middleware para capturar métricas de API
   */
  createMetricsMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now()

      // Capturar resposta
      const originalSend = res.send
      res.send = function(data: any) {
        const responseTime = Date.now() - startTime

        // Registrar métrica
        const metric: PerformanceMetric = {
          endpoint: req.route?.path || req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date(),
          userId: req.user?.id,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }

        // Não aguardar para não afetar a resposta
        setImmediate(() => {
          new MonitoringService().recordPerformance(metric)
        })

        return originalSend.call(this, data)
      }

      next()
    }
  }

  /**
   * Verificar saúde do banco de dados
   */
  private async checkDatabaseHealth(): Promise<{
    connected: boolean
    responseTime: number
    activeConnections: number
  }> {
    try {
      const startTime = Date.now()
      
      // Teste simples de conexão
      await prisma.$queryRaw`SELECT 1`
      
      const responseTime = Date.now() - startTime

      // Obter número de conexões ativas (se disponível)
      let activeConnections = 0
      try {
        const result = await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
        `
        activeConnections = result[0]?.count || 0
      } catch {
        // Ignorar se não conseguir obter
      }

      return {
        connected: true,
        responseTime,
        activeConnections
      }

    } catch (error) {
      return {
        connected: false,
        responseTime: 0,
        activeConnections: 0
      }
    }
  }

  /**
   * Verificar saúde do cache
   */
  private async checkCacheHealth(): Promise<{
    connected: boolean
    hitRate: number
    memoryUsage: string
  }> {
    try {
      const isHealthy = await cacheService.healthCheck()
      const stats = await cacheService.getStats()

      return {
        connected: isHealthy,
        hitRate: stats.hitRate,
        memoryUsage: stats.memoryUsage
      }

    } catch (error) {
      return {
        connected: false,
        hitRate: 0,
        memoryUsage: 'Error'
      }
    }
  }

  /**
   * Obter métricas das APIs
   */
  private async getApiMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {}

    // Agrupar métricas por endpoint
    const endpointGroups = this.performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = []
      }
      acc[metric.endpoint].push(metric)
      return acc
    }, {} as Record<string, PerformanceMetric[]>)

    // Calcular estatísticas por endpoint
    for (const [endpoint, endpointMetrics] of Object.entries(endpointGroups)) {
      const recentMetrics = endpointMetrics.filter(
        m => m.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Última hora
      )

      if (recentMetrics.length === 0) continue

      const averageResponseTime = recentMetrics.reduce(
        (sum, m) => sum + m.responseTime, 0
      ) / recentMetrics.length

      const errors = recentMetrics.filter(m => m.statusCode >= 400)
      const errorRate = (errors.length / recentMetrics.length) * 100

      const requestsPerMinute = recentMetrics.length / 60

      metrics[endpoint] = {
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerMinute: Math.round(requestsPerMinute * 100) / 100
      }
    }

    return metrics
  }

  /**
   * Verificar alertas de performance
   */
  private async checkPerformanceAlerts(metric: PerformanceMetric): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      // Verificar cooldown
      if (rule.lastTriggered) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000
        if (Date.now() - rule.lastTriggered.getTime() < cooldownMs) {
          continue
        }
      }

      let shouldTrigger = false

      // Avaliar condição
      switch (rule.condition) {
        case 'response_time_high':
          shouldTrigger = metric.responseTime > rule.threshold
          break
        case 'error_rate_high':
          shouldTrigger = metric.statusCode >= 400
          break
        case 'requests_per_minute_high':
          // Implementar lógica para RPM
          break
      }

      if (shouldTrigger) {
        await this.triggerAlert(rule, metric)
      }
    }
  }

  /**
   * Disparar alerta
   */
  private async triggerAlert(rule: AlertRule, metric: PerformanceMetric): Promise<void> {
    try {
      console.warn(`ALERT: ${rule.name}`, {
        rule: rule.condition,
        threshold: rule.threshold,
        actual: metric.responseTime || metric.statusCode,
        endpoint: metric.endpoint
      })

      // Atualizar último disparo
      rule.lastTriggered = new Date()

      // Aqui você pode integrar com sistemas de alerta externos
      // como Slack, email, PagerDuty, etc.

    } catch (error) {
      console.error('Error triggering alert:', error)
    }
  }

  /**
   * Inicializar alertas padrão
   */
  private initializeDefaultAlerts(): void {
    this.alertRules = [
      {
        id: 'high_response_time',
        name: 'High Response Time',
        condition: 'response_time_high',
        threshold: 2000, // 2 segundos
        enabled: true,
        cooldownMinutes: 5
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'error_rate_high',
        threshold: 5, // 5%
        enabled: true,
        cooldownMinutes: 10
      }
    ]
  }

  /**
   * Limpeza periódica de métricas antigas
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas

      // Limpar métricas antigas da memória
      this.performanceMetrics = this.performanceMetrics.filter(
        m => m.timestamp >= cutoff
      )

      this.usageMetrics = this.usageMetrics.filter(
        m => m.timestamp >= cutoff
      )

    }, 60 * 60 * 1000) // A cada hora
  }
}

// Singleton instance
export const monitoringService = new MonitoringService()