/**
 * Serviço de monitoramento para produção
 */

import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { cacheService } from './cache-service'

export interface ProductionMetrics {
  system: {
    uptime: number
    memory: {
      used: number
      total: number
      percentage: number
      heap: {
        used: number
        total: number
      }
    }
    cpu: {
      usage: number
      loadAverage: number[]
    }
    disk: {
      used: number
      total: number
      percentage: number
    }
  }
  database: {
    connected: boolean
    responseTime: number
    activeConnections: number
    slowQueries: number
    lockWaits: number
    cacheHitRatio: number
  }
  cache: {
    connected: boolean
    hitRate: number
    memoryUsage: number
    keyCount: number
    evictions: number
    connections: number
  }
  application: {
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
    activeUsers: number
    queueSize: number
  }
  business: {
    productsCount: number
    ordersToday: number
    stockAlerts: number
    revenueToday: number
  }
}

export interface SystemAlert {
  id: string
  type: 'performance' | 'error' | 'resource' | 'business'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  metric: string
  threshold: number
  currentValue: number
  timestamp: Date
  resolved: boolean
}

export class ProductionMonitoringService {
  private alerts: SystemAlert[] = []
  private metricsHistory: ProductionMetrics[] = []
  private readonly MAX_HISTORY = 1440 // 24 horas (1 por minuto)

  /**
   * Coletar métricas completas do sistema
   */
  async collectMetrics(): Promise<ProductionMetrics> {
    const [systemMetrics, dbMetrics, cacheMetrics, appMetrics, businessMetrics] = await Promise.all([
      this.getSystemMetrics(),
      this.getDatabaseMetrics(),
      this.getCacheMetrics(),
      this.getApplicationMetrics(),
      this.getBusinessMetrics()
    ])

    const metrics: ProductionMetrics = {
      system: systemMetrics,
      database: dbMetrics,
      cache: cacheMetrics,
      application: appMetrics,
      business: businessMetrics
    }

    // Armazenar no histórico
    this.metricsHistory.push(metrics)
    if (this.metricsHistory.length > this.MAX_HISTORY) {
      this.metricsHistory.shift()
    }

    // Verificar alertas
    await this.checkAlerts(metrics)

    return metrics
  }

  /**
   * Métricas do sistema (Node.js/OS)
   */
  private async getSystemMetrics() {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    const uptime = process.uptime()

    // Simular métricas de disco (em produção, usar bibliotecas específicas)
    const diskUsage = {
      used: 0,
      total: 0,
      percentage: 0
    }

    return {
      uptime: uptime * 1000, // em ms
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        heap: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal
        }
      },
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // converter para ms
        loadAverage: [0, 0, 0] // Em produção, usar os.loadavg()
      },
      disk: diskUsage
    }
  }

  /**
   * Métricas do banco de dados
   */
  private async getDatabaseMetrics() {
    try {
      const startTime = Date.now()
      
      // Teste de conectividade
      await prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - startTime

      // Métricas do PostgreSQL
      const [connections, slowQueries, cacheStats] = await Promise.all([
        // Conexões ativas
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `,
        
        // Queries lentas (> 1 segundo)
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT count(*) as count 
          FROM pg_stat_statements 
          WHERE mean_exec_time > 1000
        `,
        
        // Cache hit ratio
        prisma.$queryRaw<Array<{ ratio: number }>>`
          SELECT 
            round(
              (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 2
            ) as ratio
          FROM pg_statio_user_tables
        `
      ])

      return {
        connected: true,
        responseTime,
        activeConnections: connections[0]?.count || 0,
        slowQueries: slowQueries[0]?.count || 0,
        lockWaits: 0, // Implementar se necessário
        cacheHitRatio: cacheStats[0]?.ratio || 0
      }

    } catch (error) {
      return {
        connected: false,
        responseTime: 0,
        activeConnections: 0,
        slowQueries: 0,
        lockWaits: 0,
        cacheHitRatio: 0
      }
    }
  }

  /**
   * Métricas do cache Redis
   */
  private async getCacheMetrics() {
    try {
      const isHealthy = await cacheService.healthCheck()
      const stats = await cacheService.getStats()

      // Métricas adicionais do Redis (simuladas)
      return {
        connected: isHealthy,
        hitRate: stats.hitRate,
        memoryUsage: 0, // Implementar com INFO memory
        keyCount: stats.totalKeys,
        evictions: 0, // Implementar com INFO stats
        connections: 0 // Implementar com INFO clients
      }

    } catch (error) {
      return {
        connected: false,
        hitRate: 0,
        memoryUsage: 0,
        keyCount: 0,
        evictions: 0,
        connections: 0
      }
    }
  }

  /**
   * Métricas da aplicação
   */
  private async getApplicationMetrics() {
    // Estas métricas seriam coletadas pelo middleware de monitoramento
    // Por enquanto, valores simulados baseados em cache
    
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60000)

    try {
      // Simular coleta de métricas de requests
      const requestsPerMinute = await this.getRequestCount(oneMinuteAgo, now)
      const averageResponseTime = await this.getAverageResponseTime(oneMinuteAgo, now)
      const errorRate = await this.getErrorRate(oneMinuteAgo, now)
      const activeUsers = await this.getActiveUserCount()

      return {
        requestsPerMinute,
        averageResponseTime,
        errorRate,
        activeUsers,
        queueSize: 0 // Implementar se usar filas
      }

    } catch (error) {
      return {
        requestsPerMinute: 0,
        averageResponseTime: 0,
        errorRate: 0,
        activeUsers: 0,
        queueSize: 0
      }
    }
  }

  /**
   * Métricas de negócio
   */
  private async getBusinessMetrics() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [productsCount, ordersToday, stockAlerts, revenueToday] = await Promise.all([
        // Total de produtos ativos
        prisma.product.count({
          where: { isActive: true }
        }),

        // Ordens criadas hoje
        prisma.ordemServico.count({
          where: {
            createdAt: { gte: today }
          }
        }),

        // Produtos com estoque baixo
        prisma.product.count({
          where: {
            isActive: true,
            quantity: { lte: prisma.product.fields.minStock }
          }
        }),

        // Receita de hoje (simulada)
        prisma.orderItem.aggregate({
          where: {
            createdAt: { gte: today }
          },
          _sum: {
            totalPrice: true
          }
        })
      ])

      return {
        productsCount,
        ordersToday,
        stockAlerts,
        revenueToday: revenueToday._sum.totalPrice || 0
      }

    } catch (error) {
      return {
        productsCount: 0,
        ordersToday: 0,
        stockAlerts: 0,
        revenueToday: 0
      }
    }
  }

  /**
   * Verificar alertas baseados nas métricas
   */
  private async checkAlerts(metrics: ProductionMetrics) {
    const alertRules = [
      {
        type: 'performance' as const,
        severity: 'high' as const,
        condition: () => metrics.application.averageResponseTime > 2000,
        title: 'Response Time Alto',
        description: `Response time médio: ${metrics.application.averageResponseTime}ms`,
        metric: 'response_time',
        threshold: 2000,
        currentValue: metrics.application.averageResponseTime
      },
      {
        type: 'error' as const,
        severity: 'critical' as const,
        condition: () => metrics.application.errorRate > 5,
        title: 'Taxa de Erro Alta',
        description: `Taxa de erro: ${metrics.application.errorRate}%`,
        metric: 'error_rate',
        threshold: 5,
        currentValue: metrics.application.errorRate
      },
      {
        type: 'resource' as const,
        severity: 'medium' as const,
        condition: () => metrics.system.memory.percentage > 85,
        title: 'Uso de Memória Alto',
        description: `Uso de memória: ${metrics.system.memory.percentage.toFixed(1)}%`,
        metric: 'memory_usage',
        threshold: 85,
        currentValue: metrics.system.memory.percentage
      },
      {
        type: 'resource' as const,
        severity: 'critical' as const,
        condition: () => !metrics.database.connected,
        title: 'Banco de Dados Desconectado',
        description: 'Falha na conexão com o banco de dados',
        metric: 'db_connection',
        threshold: 1,
        currentValue: metrics.database.connected ? 1 : 0
      },
      {
        type: 'resource' as const,
        severity: 'medium' as const,
        condition: () => metrics.cache.hitRate < 70,
        title: 'Cache Hit Rate Baixo',
        description: `Cache hit rate: ${metrics.cache.hitRate}%`,
        metric: 'cache_hit_rate',
        threshold: 70,
        currentValue: metrics.cache.hitRate
      },
      {
        type: 'business' as const,
        severity: 'medium' as const,
        condition: () => metrics.business.stockAlerts > 10,
        title: 'Muitos Alertas de Estoque',
        description: `${metrics.business.stockAlerts} produtos com estoque baixo`,
        metric: 'stock_alerts',
        threshold: 10,
        currentValue: metrics.business.stockAlerts
      }
    ]

    for (const rule of alertRules) {
      if (rule.condition()) {
        const existingAlert = this.alerts.find(
          a => a.metric === rule.metric && !a.resolved
        )

        if (!existingAlert) {
          const alert: SystemAlert = {
            id: `alert_${Date.now()}_${rule.metric}`,
            type: rule.type,
            severity: rule.severity,
            title: rule.title,
            description: rule.description,
            metric: rule.metric,
            threshold: rule.threshold,
            currentValue: rule.currentValue,
            timestamp: new Date(),
            resolved: false
          }

          this.alerts.push(alert)
          await this.sendAlert(alert)
        }
      } else {
        // Resolver alertas que não estão mais ativos
        const activeAlert = this.alerts.find(
          a => a.metric === rule.metric && !a.resolved
        )

        if (activeAlert) {
          activeAlert.resolved = true
          await this.sendAlertResolution(activeAlert)
        }
      }
    }
  }

  /**
   * Enviar alerta
   */
  private async sendAlert(alert: SystemAlert) {
    try {
      // Implementar integração com Slack, email, etc.
      console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`)
      console.warn(`   ${alert.description}`)
      console.warn(`   Threshold: ${alert.threshold}, Current: ${alert.currentValue}`)

      // Salvar no cache para dashboard
      await cacheService.set(
        `alert:${alert.id}`,
        alert,
        { ttl: 86400 } // 24 horas
      )

    } catch (error) {
      console.error('Erro ao enviar alerta:', error)
    }
  }

  /**
   * Enviar resolução de alerta
   */
  private async sendAlertResolution(alert: SystemAlert) {
    try {
      console.log(`✅ RESOLVED: ${alert.title}`)
      
      // Atualizar no cache
      await cacheService.set(
        `alert:${alert.id}`,
        alert,
        { ttl: 86400 }
      )

    } catch (error) {
      console.error('Erro ao enviar resolução de alerta:', error)
    }
  }

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  /**
   * Obter histórico de métricas
   */
  getMetricsHistory(hours = 1): ProductionMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.metricsHistory.filter(m => 
      new Date(m.system.uptime).getTime() > cutoff
    )
  }

  /**
   * Métodos auxiliares para métricas de aplicação
   */
  private async getRequestCount(from: Date, to: Date): Promise<number> {
    // Implementar baseado em logs ou métricas coletadas
    return Math.floor(Math.random() * 100) + 50
  }

  private async getAverageResponseTime(from: Date, to: Date): Promise<number> {
    // Implementar baseado em métricas coletadas
    return Math.floor(Math.random() * 500) + 100
  }

  private async getErrorRate(from: Date, to: Date): Promise<number> {
    // Implementar baseado em logs de erro
    return Math.random() * 2
  }

  private async getActiveUserCount(): Promise<number> {
    // Implementar baseado em sessões ativas
    return Math.floor(Math.random() * 50) + 10
  }

  /**
   * Iniciar coleta automática de métricas
   */
  startMonitoring(intervalMs = 60000) {
    setInterval(async () => {
      try {
        await this.collectMetrics()
      } catch (error) {
        console.error('Erro na coleta de métricas:', error)
      }
    }, intervalMs)

    console.log(`Monitoramento iniciado (intervalo: ${intervalMs}ms)`)
  }

  /**
   * Health check completo
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, boolean>
    metrics: ProductionMetrics
  }> {
    const metrics = await this.collectMetrics()
    
    const checks = {
      database: metrics.database.connected,
      cache: metrics.cache.connected,
      memory: metrics.system.memory.percentage < 90,
      responseTime: metrics.application.averageResponseTime < 3000,
      errorRate: metrics.application.errorRate < 10
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length

    let status: 'healthy' | 'degraded' | 'unhealthy'
    
    if (healthyChecks === totalChecks) {
      status = 'healthy'
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return { status, checks, metrics }
  }
}

// Singleton instance
export const productionMonitoring = new ProductionMonitoringService()