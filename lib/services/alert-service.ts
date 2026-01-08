import prisma from '@/lib/prisma';
import { ApplicationMetricsService } from './application-metrics';

import {
  AlertRule as PrismaAlertRule,
  Alert as PrismaAlert,
  AlertNotification as PrismaAlertNotification
} from '@prisma/client';

export type AlertRule = Omit<PrismaAlertRule, 'createdAt' | 'updatedAt'> & {
  created_at?: string;
  updated_at?: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  severity: 'low' | 'medium' | 'high' | 'critical';
};

export type Alert = Omit<PrismaAlert, 'triggeredAt' | 'resolvedAt' | 'acknowledgedAt' | 'acknowledgedBy'> & {
  rule_id: string;
  rule_name: string;
  current_value: number;
  triggered_at: string;
  resolved_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'acknowledged';
};

export type AlertNotification = PrismaAlertNotification;


export interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  alerts_by_severity: Record<string, number>;
  alerts_by_metric: Record<string, number>;
  resolution_time_avg: number;
}

export class AlertService {
  private metricsService = new ApplicationMetricsService();
  private alertCheckInterval: ReturnType<typeof setInterval> | null = null;
  private lastAlertCheck: Map<string, Date> = new Map();

  // Regras de alerta padrão
  private defaultRules: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>[] =
    [
      {
        name: 'High Error Rate',
        description: 'Taxa de erro acima de 5%',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 5,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        name: 'Critical Error Rate',
        description: 'Taxa de erro acima de 10%',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 10,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        name: 'High Response Time',
        description: 'Tempo de resposta médio acima de 2 segundos',
        metric: 'avg_response_time',
        condition: 'greater_than',
        threshold: 2000,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 10,
      },
      {
        name: 'Critical Response Time',
        description: 'Tempo de resposta médio acima de 5 segundos',
        metric: 'avg_response_time',
        condition: 'greater_than',
        threshold: 5000,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        name: 'Low Success Rate',
        description: 'Taxa de sucesso abaixo de 95%',
        metric: 'success_rate',
        condition: 'less_than',
        threshold: 95,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        name: 'Database Connection Issues',
        description: 'Falhas de conexão com banco de dados',
        metric: 'database_errors',
        condition: 'greater_than',
        threshold: 0,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        name: 'High Memory Usage',
        description: 'Uso de memória acima de 80%',
        metric: 'memory_usage_percent',
        condition: 'greater_than',
        threshold: 80,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 30,
      },
      {
        name: 'Critical Memory Usage',
        description: 'Uso de memória acima de 90%',
        metric: 'memory_usage_percent',
        condition: 'greater_than',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 10,
      },
    ];

  async initializeDefaultRules(): Promise<void> {
    try {
      for (const rule of this.defaultRules) {
        const existing = await prisma.alertRule.findUnique({
          where: { name: rule.name },
        });

        if (!existing) {
          await prisma.alertRule.create({
            data: {
              name: rule.name,
              description: rule.description,
              metric: rule.metric,
              condition: rule.condition,
              threshold: rule.threshold,
              severity: rule.severity,
              enabled: rule.enabled,
              cooldownMinutes: rule.cooldownMinutes,
            },
          });
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar regras de alerta:', error);
    }
  }

  async createRule(
    rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AlertRule | null> {
    try {
      const data = await prisma.alertRule.create({
        data: {
          name: rule.name,
          description: rule.description,
          metric: rule.metric,
          condition: rule.condition,
          threshold: rule.threshold,
          severity: rule.severity,
          enabled: rule.enabled,
          cooldownMinutes: rule.cooldownMinutes,
        },
      });
      return this.mapToAlertRule(data);
    } catch (error) {
      console.error('Erro ao criar regra de alerta:', error);
      return null;
    }
  }

  async updateRule(
    id: string,
    updates: Partial<AlertRule>
  ): Promise<AlertRule | null> {
    try {
      const data = await prisma.alertRule.update({
        where: { id },
        data: {
          name: updates.name,
          description: updates.description,
          metric: updates.metric,
          condition: updates.condition,
          threshold: updates.threshold,
          severity: updates.severity,
          enabled: updates.enabled,
          cooldownMinutes: updates.cooldownMinutes,
        },
      });
      return this.mapToAlertRule(data);
    } catch (error) {
      console.error('Erro ao atualizar regra de alerta:', error);
      return null;
    }
  }

  async deleteRule(id: string): Promise<boolean> {
    try {
      await prisma.alertRule.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar regra de alerta:', error);
      return false;
    }
  }

  async getRules(): Promise<AlertRule[]> {
    try {
      const data = await prisma.alertRule.findMany({
        orderBy: { severity: 'desc' },
      });
      return data.map(this.mapToAlertRule);
    } catch (error) {
      console.error('Erro ao buscar regras de alerta:', error);
      return [];
    }
  }

  private mapToAlertRule(data: PrismaAlertRule): AlertRule {
    return {
      ...data,
      condition: data.condition as AlertRule['condition'],
      severity: data.severity as AlertRule['severity'],
      created_at: data.createdAt.toISOString(),
      updated_at: data.updatedAt.toISOString(),
      cooldownMinutes: data.cooldownMinutes,
    };
  }

  async checkAlerts(): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    try {
      const rules = await this.getRules();
      const enabledRules = rules.filter(rule => rule.enabled);

      for (const rule of enabledRules) {
        // Verificar cooldown
        const lastCheck = this.lastAlertCheck.get(rule.id);
        const now = new Date();

        if (lastCheck) {
          const minutesSinceLastCheck =
            (now.getTime() - lastCheck.getTime()) / (1000 * 60);
          if (minutesSinceLastCheck < rule.cooldownMinutes) {
            continue;
          }
        }

        const currentValue = await this.getCurrentMetricValue(rule.metric);

        if (
          currentValue !== null &&
          this.evaluateCondition(currentValue, rule.condition, rule.threshold)
        ) {
          // Verificar se já existe um alerta ativo para esta regra
          const existingAlert = await prisma.alert.findFirst({
            where: {
              ruleId: rule.id,
              status: 'active',
            }
          });

          if (!existingAlert) {
            const alert = await this.createAlert(rule, currentValue);
            if (alert) {
              triggeredAlerts.push(alert);
              await this.sendNotifications(alert);
            }
          }
        }

        this.lastAlertCheck.set(rule.id, now);
      }
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
    }

    return triggeredAlerts;
  }

  private async getCurrentMetricValue(metric: string): Promise<number | null> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // Últimos 15 minutos

      switch (metric) {
        case 'error_rate':
          return await this.calculateErrorRate(startTime, endTime);
        case 'avg_response_time':
          return await this.calculateAvgResponseTime(startTime, endTime);
        case 'success_rate':
          return await this.calculateSuccessRate(startTime, endTime);
        case 'database_errors':
          return await this.countDatabaseErrors(startTime, endTime);
        case 'memory_usage_percent':
          return await this.getMemoryUsage();
        default:
          return await this.getCustomMetricValue(metric, startTime, endTime);
      }
    } catch (error) {
      console.error(`Erro ao obter valor da métrica ${metric}:`, error);
      return null;
    }
  }

  private async calculateErrorRate(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const data = await prisma.applicationMetric.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
        category: 'performance',
      },
      select: { success: true },
    });

    if (!data || data.length === 0) return 0;

    const totalRequests = data.length;
    const errorRequests = data.filter((m) => !m.success).length;

    return (errorRequests / totalRequests) * 100;
  }

  private async calculateAvgResponseTime(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const data = await prisma.applicationMetric.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
        category: 'performance',
        duration: { not: null },
      },
      select: { duration: true },
    });

    if (!data || data.length === 0) return 0;

    const totalDuration = data.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalDuration / data.length;
  }

  private async calculateSuccessRate(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const data = await prisma.applicationMetric.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
        category: 'performance',
      },
      select: { success: true },
    });

    if (!data || data.length === 0) return 100;

    const totalRequests = data.length;
    const successRequests = data.filter((m) => m.success).length;

    return (successRequests / totalRequests) * 100;
  }

  private async countDatabaseErrors(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const count = await prisma.applicationMetric.count({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
        category: 'error',
        operation: {
          contains: 'database',
          mode: 'insensitive',
        }
      }
    });

    return count;
  }

  private async getMemoryUsage(): Promise<number> {
    // Em um ambiente real, isso viria de métricas do sistema
    // Por enquanto, retornamos um valor simulado baseado em métricas recentes
    const data = await prisma.applicationMetric.findFirst({
      where: {
        category: 'system',
        metricName: 'memory_usage',
      },
      orderBy: { timestamp: 'desc' },
      select: { metadata: true }
    });

    if (data?.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)) {
      const mem = (data.metadata as Record<string, unknown>).memory_usage_percent;
      if (typeof mem === 'number') return mem;
      if (typeof mem === 'string') return Number(mem) || 0;
    }
    return 0;
  }

  private async getCustomMetricValue(
    metric: string,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const data = await prisma.applicationMetric.findFirst({
      where: {
        metricName: metric,
        timestamp: {
          gte: startTime,
          lte: endTime,
        }
      },
      orderBy: { timestamp: 'desc' },
      select: { value: true }
    });

    return data?.value || 0;
  }

  private evaluateCondition(
    value: number,
    condition: string,
    threshold: number
  ): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  private async createAlert(
    rule: AlertRule,
    currentValue: number
  ): Promise<Alert | null> {
    try {
      const data = await prisma.alert.create({
        data: {
          ruleId: rule.id,
          ruleName: rule.name,
          metric: rule.metric,
          currentValue,
          threshold: rule.threshold,
          severity: rule.severity,
          message: `${rule.description}. Valor atual: ${currentValue}, Limite: ${rule.threshold}`,
          status: 'active',
          triggeredAt: new Date(),
          // Assuming IDs are generated by DB or Prisma default if omitted, but schema says generated by db or uuid.
          // Using prisma.alert.create without 'id' usually works if @default(uuid()).
          // But if schema has @default(dbgenerated), we should let DB handle it.
        }
      });

      return this.mapToAlert(data);
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      return null;
    }
  }

  private mapToAlert(data: PrismaAlert): Alert {
    return {
      ...data,
      rule_id: data.ruleId,
      rule_name: data.ruleName,
      current_value: data.currentValue,
      triggered_at: data.triggeredAt.toISOString(),
      resolved_at: data.resolvedAt?.toISOString(),
      acknowledged_at: data.acknowledgedAt?.toISOString(),
      acknowledged_by: data.acknowledgedBy || undefined,
      severity: data.severity as Alert['severity'],
      status: data.status as Alert['status'],
    };
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    try {
      // Notificação in-app (sempre enviada)
      await this.createNotification(alert.id, 'in_app', 'system');

      // Notificações por email para alertas críticos
      if (alert.severity === 'critical') {
        await this.createNotification(
          alert.id,
          'email',
          'admin@interalpha.com'
        );
      }

      // Webhook para integração com sistemas externos
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await this.createNotification(alert.id, 'webhook', 'alerts_webhook');
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  }

  private async createNotification(
    alertId: string,
    channel: string,
    recipient: string
  ): Promise<void> {
    try {
      await prisma.alertNotification.create({
        data: {
          alertId,
          channel,
          recipient,
          status: 'pending',
        }
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  }

  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<boolean> {
    try {
      await prisma.alert.update({
        where: { id: alertId },
        data: {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy,
        }
      });
      return true;
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
      return false;
    }
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      await prisma.alert.update({
        where: { id: alertId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      return false;
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const data = await prisma.alert.findMany({
        where: { status: 'active' },
        orderBy: { triggeredAt: 'desc' },
      });
      return data.map(this.mapToAlert);
    } catch (error) {
      console.error('Erro ao buscar alertas ativos:', error);
      return [];
    }
  }

  async getAlertStats(): Promise<AlertStats> {
    try {
      const alerts = await prisma.alert.findMany();

      const activeAlerts = alerts.filter((a) => a.status === 'active');
      const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

      const alertsBySeverity = alerts.reduce(
        (acc: Record<string, number>, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const alertsByMetric = alerts.reduce(
        (acc: Record<string, number>, alert) => {
          acc[alert.metric] = (acc[alert.metric] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Calcular tempo médio de resolução
      const resolvedAlerts = alerts.filter((a) => a.status === 'resolved' && a.resolvedAt);

      const resolutionTimes = resolvedAlerts.map((alert) => {
        const triggered = alert.triggeredAt.getTime();
        const resolved = alert.resolvedAt!.getTime();
        return (resolved - triggered) / (1000 * 60); // em minutos
      });

      const resolutionTimeAvg =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((sum: number, time: number) => sum + time, 0) /
          resolutionTimes.length
          : 0;

      return {
        total_alerts: alerts.length,
        active_alerts: activeAlerts.length,
        critical_alerts: criticalAlerts.length,
        alerts_by_severity: alertsBySeverity,
        alerts_by_metric: alertsByMetric,
        resolution_time_avg: resolutionTimeAvg,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas de alertas:', error);
      return {
        total_alerts: 0,
        active_alerts: 0,
        critical_alerts: 0,
        alerts_by_severity: {},
        alerts_by_metric: {},
        resolution_time_avg: 0,
      };
    }
  }

  startMonitoring(intervalMinutes: number = 5): void {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
    }

    this.alertCheckInterval = setInterval(
      async () => {
        await this.checkAlerts();
      },
      intervalMinutes * 60 * 1000
    );

    console.log(
      `Monitoramento de alertas iniciado (intervalo: ${intervalMinutes} minutos)`
    );
  }

  stopMonitoring(): void {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
      console.log('Monitoramento de alertas parado');
    }
  }
}

export const alertService = new AlertService();
