/**
 * Production Monitoring System for Products Management
 * Comprehensive monitoring, alerting, and health checks
 */

import { Redis } from 'ioredis';
import { prisma } from '@/lib/prisma';

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  unit?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: string[]; // email, slack, webhook
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  message?: string;
  timestamp: Date;
}

export class ProductionMonitoring {
  private redis: Redis;
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: Map<string, AlertRule> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.setupDefaultAlerts();
    this.startMonitoring();
  }

  // Metrics Collection
  async recordMetric(metric: MetricData): Promise<void> {
    try {
      // Store in memory for immediate access
      if (!this.metrics.has(metric.name)) {
        this.metrics.set(metric.name, []);
      }
      
      const metricHistory = this.metrics.get(metric.name)!;
      metricHistory.push(metric);
      
      // Keep only last 1000 data points in memory
      if (metricHistory.length > 1000) {
        metricHistory.shift();
      }

      // Store in Redis for persistence
      await this.redis.zadd(
        `metrics:${metric.name}`,
        metric.timestamp.getTime(),
        JSON.stringify(metric)
      );

      // Keep only last 24 hours of data
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      await this.redis.zremrangebyscore(`metrics:${metric.name}`, 0, oneDayAgo);

      // Check alert rules
      await this.checkAlerts(metric);

    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }

  // Products-specific metrics
  async recordProductMetrics(): Promise<void> {
    try {
      const startTime = Date.now();

      // Database metrics
      const totalProducts = await prisma.product.count();
      const activeProducts = await prisma.product.count({ where: { isActive: true } });
      const productsCreatedToday = await prisma.product.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      // Performance metrics
      const dbResponseTime = Date.now() - startTime;

      // Record metrics
      await Promise.all([
        this.recordMetric({
          name: 'products.total_count',
          value: totalProducts,
          timestamp: new Date(),
          tags: { type: 'inventory' }
        }),
        this.recordMetric({
          name: 'products.active_count',
          value: activeProducts,
          timestamp: new Date(),
          tags: { type: 'inventory' }
        }),
        this.recordMetric({
          name: 'products.created_today',
          value: productsCreatedToday,
          timestamp: new Date(),
          tags: { type: 'activity' }
        }),
        this.recordMetric({
          name: 'products.db_response_time',
          value: dbResponseTime,
          timestamp: new Date(),
          unit: 'ms',
          tags: { type: 'performance' }
        })
      ]);

    } catch (error) {
      console.error('Failed to record product metrics:', error);
      
      await this.recordMetric({
        name: 'products.metric_collection_errors',
        value: 1,
        timestamp: new Date(),
        tags: { type: 'error' }
      });
    }
  }

  // API Performance Monitoring
  async recordApiMetric(endpoint: string, method: string, statusCode: number, responseTime: number): Promise<void> {
    const timestamp = new Date();

    await Promise.all([
      this.recordMetric({
        name: 'api.response_time',
        value: responseTime,
        timestamp,
        unit: 'ms',
        tags: { endpoint, method, status: statusCode.toString() }
      }),
      this.recordMetric({
        name: 'api.request_count',
        value: 1,
        timestamp,
        tags: { endpoint, method, status: statusCode.toString() }
      })
    ]);

    // Record error rate
    if (statusCode >= 400) {
      await this.recordMetric({
        name: 'api.error_count',
        value: 1,
        timestamp,
        tags: { endpoint, method, status: statusCode.toString() }
      });
    }
  }

  // Health Checks
  async performHealthChecks(): Promise<Map<string, HealthCheck>> {
    const checks = new Map<string, HealthCheck>();

    // Database health check
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      checks.set('database', {
        name: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date()
      });
    } catch (error) {
      checks.set('database', {
        name: 'database',
        status: 'unhealthy',
        responseTime: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }

    // Redis health check
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      checks.set('redis', {
        name: 'redis',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date()
      });
    } catch (error) {
      checks.set('redis', {
        name: 'redis',
        status: 'unhealthy',
        responseTime: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }

    // Products API health check
    try {
      const startTime = Date.now();
      const productCount = await prisma.product.count();
      const responseTime = Date.now() - startTime;

      checks.set('products_api', {
        name: 'products_api',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        message: `${productCount} products in system`,
        timestamp: new Date()
      });
    } catch (error) {
      checks.set('products_api', {
        name: 'products_api',
        status: 'unhealthy',
        responseTime: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }

    // Update health checks cache
    this.healthChecks = checks;

    // Record health check metrics
    for (const [name, check] of checks) {
      await this.recordMetric({
        name: `health.${name}`,
        value: check.status === 'healthy' ? 1 : 0,
        timestamp: new Date(),
        tags: { service: name, status: check.status }
      });

      await this.recordMetric({
        name: `health.${name}_response_time`,
        value: check.responseTime,
        timestamp: new Date(),
        unit: 'ms',
        tags: { service: name }
      });
    }

    return checks;
  }

  // Alert Management
  private setupDefaultAlerts(): void {
    const defaultAlerts: AlertRule[] = [
      {
        id: 'high_api_response_time',
        name: 'High API Response Time',
        metric: 'api.response_time',
        condition: 'gt',
        threshold: 2000,
        duration: 300, // 5 minutes
        severity: 'high',
        enabled: true,
        channels: ['email', 'slack']
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        metric: 'api.error_count',
        condition: 'gt',
        threshold: 10,
        duration: 60, // 1 minute
        severity: 'critical',
        enabled: true,
        channels: ['email', 'slack', 'webhook']
      },
      {
        id: 'database_unhealthy',
        name: 'Database Unhealthy',
        metric: 'health.database',
        condition: 'eq',
        threshold: 0,
        duration: 30, // 30 seconds
        severity: 'critical',
        enabled: true,
        channels: ['email', 'slack', 'webhook']
      },
      {
        id: 'low_product_creation',
        name: 'Low Product Creation Rate',
        metric: 'products.created_today',
        condition: 'lt',
        threshold: 1,
        duration: 3600, // 1 hour
        severity: 'low',
        enabled: true,
        channels: ['email']
      }
    ];

    defaultAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });
  }

  private async checkAlerts(metric: MetricData): Promise<void> {
    for (const [alertId, rule] of this.alerts) {
      if (!rule.enabled || rule.metric !== metric.name) {
        continue;
      }

      const isTriggered = this.evaluateAlertCondition(metric.value, rule);
      
      if (isTriggered) {
        await this.triggerAlert(alertId, rule, metric);
      }
    }
  }

  private evaluateAlertCondition(value: number, rule: AlertRule): boolean {
    switch (rule.condition) {
      case 'gt': return value > rule.threshold;
      case 'gte': return value >= rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'lte': return value <= rule.threshold;
      case 'eq': return value === rule.threshold;
      default: return false;
    }
  }

  private async triggerAlert(alertId: string, rule: AlertRule, metric: MetricData): Promise<void> {
    const alertKey = `alert:${alertId}:${Date.now()}`;
    
    try {
      // Check if alert was recently triggered (avoid spam)
      const recentAlert = await this.redis.get(`alert_cooldown:${alertId}`);
      if (recentAlert) {
        return; // Alert is in cooldown period
      }

      // Set cooldown period (5 minutes)
      await this.redis.setex(`alert_cooldown:${alertId}`, 300, '1');

      const alertData = {
        id: alertId,
        rule: rule.name,
        metric: metric.name,
        value: metric.value,
        threshold: rule.threshold,
        severity: rule.severity,
        timestamp: new Date().toISOString(),
        message: this.generateAlertMessage(rule, metric)
      };

      // Store alert
      await this.redis.setex(alertKey, 86400, JSON.stringify(alertData)); // 24 hours

      // Send notifications
      await this.sendAlertNotifications(rule, alertData);

      console.warn(`🚨 Alert triggered: ${rule.name}`, alertData);

    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  private generateAlertMessage(rule: AlertRule, metric: MetricData): string {
    return `Alert: ${rule.name}\n` +
           `Metric: ${metric.name}\n` +
           `Current Value: ${metric.value}${metric.unit || ''}\n` +
           `Threshold: ${rule.threshold}\n` +
           `Condition: ${rule.condition}\n` +
           `Severity: ${rule.severity}\n` +
           `Time: ${metric.timestamp.toISOString()}`;
  }

  private async sendAlertNotifications(rule: AlertRule, alertData: any): Promise<void> {
    for (const channel of rule.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alertData);
            break;
          case 'slack':
            await this.sendSlackAlert(alertData);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alertData);
            break;
        }
      } catch (error) {
        console.error(`Failed to send alert via ${channel}:`, error);
      }
    }
  }

  private async sendEmailAlert(alertData: any): Promise<void> {
    // Implementation would integrate with email service
    console.log('📧 Email alert sent:', alertData.message);
  }

  private async sendSlackAlert(alertData: any): Promise<void> {
    // Implementation would integrate with Slack API
    console.log('💬 Slack alert sent:', alertData.message);
  }

  private async sendWebhookAlert(alertData: any): Promise<void> {
    // Implementation would send to webhook URL
    console.log('🔗 Webhook alert sent:', alertData.message);
  }

  // Monitoring Dashboard Data
  async getDashboardData(): Promise<any> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    return {
      healthChecks: Object.fromEntries(this.healthChecks),
      metrics: {
        totalProducts: await this.getLatestMetricValue('products.total_count'),
        activeProducts: await this.getLatestMetricValue('products.active_count'),
        productsCreatedToday: await this.getLatestMetricValue('products.created_today'),
        avgResponseTime: await this.getAverageMetricValue('api.response_time', oneHourAgo),
        errorRate: await this.getAverageMetricValue('api.error_count', oneHourAgo)
      },
      alerts: await this.getRecentAlerts(),
      systemStatus: this.getOverallSystemStatus()
    };
  }

  private async getLatestMetricValue(metricName: string): Promise<number> {
    try {
      const latest = await this.redis.zrevrange(`metrics:${metricName}`, 0, 0);
      if (latest.length > 0) {
        const metric = JSON.parse(latest[0]);
        return metric.value;
      }
    } catch (error) {
      console.error(`Failed to get latest metric ${metricName}:`, error);
    }
    return 0;
  }

  private async getAverageMetricValue(metricName: string, since: Date): Promise<number> {
    try {
      const metrics = await this.redis.zrangebyscore(
        `metrics:${metricName}`,
        since.getTime(),
        Date.now()
      );
      
      if (metrics.length === 0) return 0;
      
      const values = metrics.map(m => JSON.parse(m).value);
      return values.reduce((a, b) => a + b, 0) / values.length;
    } catch (error) {
      console.error(`Failed to get average metric ${metricName}:`, error);
    }
    return 0;
  }

  private async getRecentAlerts(): Promise<any[]> {
    try {
      const alertKeys = await this.redis.keys('alert:*');
      const alerts = [];
      
      for (const key of alertKeys.slice(0, 10)) { // Last 10 alerts
        const alertData = await this.redis.get(key);
        if (alertData) {
          alerts.push(JSON.parse(alertData));
        }
      }
      
      return alerts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  private getOverallSystemStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const healthStatuses = Array.from(this.healthChecks.values()).map(h => h.status);
    
    if (healthStatuses.includes('unhealthy')) {
      return 'unhealthy';
    } else if (healthStatuses.includes('degraded')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  // Start monitoring processes
  private startMonitoring(): void {
    // Collect metrics every minute
    setInterval(() => {
      this.recordProductMetrics().catch(console.error);
    }, 60000);

    // Perform health checks every 30 seconds
    setInterval(() => {
      this.performHealthChecks().catch(console.error);
    }, 30000);

    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics().catch(console.error);
    }, 3600000);
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      const metricKeys = await this.redis.keys('metrics:*');
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      for (const key of metricKeys) {
        await this.redis.zremrangebyscore(key, 0, oneDayAgo);
      }
      
      console.log(`🧹 Cleaned up old metrics for ${metricKeys.length} metric types`);
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('📊 Production monitoring shutdown complete');
    } catch (error) {
      console.error('Error during monitoring shutdown:', error);
    }
  }
}

// Singleton instance
export const productionMonitoring = new ProductionMonitoring();

// Express middleware for API monitoring
export function monitoringMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const endpoint = req.route?.path || req.path;
      
      productionMonitoring.recordApiMetric(
        endpoint,
        req.method,
        res.statusCode,
        responseTime
      ).catch(console.error);
    });
    
    next();
  };
}