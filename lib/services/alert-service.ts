import { createClient } from '@/lib/supabase/client';

import { ApplicationMetricsService } from './application-metrics';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface Alert {
  id: string;
  rule_id: string;
  rule_name: string;
  metric: string;
  current_value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'resolved' | 'acknowledged';
  triggered_at: string;
  resolved_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

export interface AlertNotification {
  id: string;
  alert_id: string;
  channel: 'email' | 'sms' | 'webhook' | 'in_app';
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  error_message?: string;
}

export interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  alerts_by_severity: Record<string, number>;
  alerts_by_metric: Record<string, number>;
  resolution_time_avg: number;
}

// Tipo para linhas da tabela application_metrics
// contém campos usados nos cálculos de alerta
interface AppMetricRow {
  id?: string;
  success?: boolean;
  duration?: number | null;
  metadata?: Record<string, unknown> | null;
  timestamp?: string;
  metric_name?: string;
  category?: string;
}

export class AlertService {
  private supabase = createClient();
  private metricsService = new ApplicationMetricsService();
  private alertCheckInterval: NodeJS.Timeout | null = null;
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
        cooldown_minutes: 15,
      },
      {
        name: 'Critical Error Rate',
        description: 'Taxa de erro acima de 10%',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 10,
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 5,
      },
      {
        name: 'High Response Time',
        description: 'Tempo de resposta médio acima de 2 segundos',
        metric: 'avg_response_time',
        condition: 'greater_than',
        threshold: 2000,
        severity: 'medium',
        enabled: true,
        cooldown_minutes: 10,
      },
      {
        name: 'Critical Response Time',
        description: 'Tempo de resposta médio acima de 5 segundos',
        metric: 'avg_response_time',
        condition: 'greater_than',
        threshold: 5000,
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 5,
      },
      {
        name: 'Low Success Rate',
        description: 'Taxa de sucesso abaixo de 95%',
        metric: 'success_rate',
        condition: 'less_than',
        threshold: 95,
        severity: 'high',
        enabled: true,
        cooldown_minutes: 15,
      },
      {
        name: 'Database Connection Issues',
        description: 'Falhas de conexão com banco de dados',
        metric: 'database_errors',
        condition: 'greater_than',
        threshold: 0,
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 5,
      },
      {
        name: 'High Memory Usage',
        description: 'Uso de memória acima de 80%',
        metric: 'memory_usage_percent',
        condition: 'greater_than',
        threshold: 80,
        severity: 'medium',
        enabled: true,
        cooldown_minutes: 30,
      },
      {
        name: 'Critical Memory Usage',
        description: 'Uso de memória acima de 90%',
        metric: 'memory_usage_percent',
        condition: 'greater_than',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 10,
      },
    ];

  async initializeDefaultRules(): Promise<void> {
    try {
      for (const rule of this.defaultRules) {
        const { data: existing } = await this.supabase
          .from('alert_rules')
          .select('id')
          .eq('name', rule.name)
          .single();

        if (!existing) {
          await this.supabase.from('alert_rules').insert({
            ...rule,
            id: crypto.randomUUID(),
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
      const { data, error } = await this.supabase
        .from('alert_rules')
        .insert({
          ...rule,
          id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await this.supabase
        .from('alert_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar regra de alerta:', error);
      return null;
    }
  }

  async deleteRule(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('alert_rules')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Erro ao deletar regra de alerta:', error);
      return false;
    }
  }

  async getRules(): Promise<AlertRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('alert_rules')
        .select('*')
        .order('severity', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar regras de alerta:', error);
      return [];
    }
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
          if (minutesSinceLastCheck < rule.cooldown_minutes) {
            continue;
          }
        }

        const currentValue = await this.getCurrentMetricValue(rule.metric);

        if (
          currentValue !== null &&
          this.evaluateCondition(currentValue, rule.condition, rule.threshold)
        ) {
          // Verificar se já existe um alerta ativo para esta regra
          const { data: existingAlert } = await this.supabase
            .from('alerts')
            .select('id')
            .eq('rule_id', rule.id)
            .eq('status', 'active')
            .single();

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
    const { data } = await this.supabase
      .from('application_metrics')
      .select('success')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString())
      .eq('category', 'performance');

  if (!data || data.length === 0) return 0;

  const totalRequests = data.length;
  const errorRequests = data.filter((m: AppMetricRow) => !m.success).length;

    return (errorRequests / totalRequests) * 100;
  }

  private async calculateAvgResponseTime(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const { data } = await this.supabase
      .from('application_metrics')
      .select('duration')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString())
      .eq('category', 'performance')
      .not('duration', 'is', null);

  if (!data || data.length === 0) return 0;

  const totalDuration = data.reduce((sum: number, m: AppMetricRow) => sum + (m.duration || 0), 0);
  return totalDuration / data.length;
  }

  private async calculateSuccessRate(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const { data } = await this.supabase
      .from('application_metrics')
      .select('success')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString())
      .eq('category', 'performance');

  if (!data || data.length === 0) return 100;

  const totalRequests = data.length;
  const successRequests = data.filter((m: AppMetricRow) => m.success).length;

  return (successRequests / totalRequests) * 100;
  }

  private async countDatabaseErrors(
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const { data } = await this.supabase
      .from('application_metrics')
      .select('id')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString())
      .eq('category', 'error')
      .ilike('operation', '%database%');

  return data?.length || 0;
  }

  private async getMemoryUsage(): Promise<number> {
    // Em um ambiente real, isso viria de métricas do sistema
    // Por enquanto, retornamos um valor simulado baseado em métricas recentes
    const { data } = await this.supabase
      .from('application_metrics')
      .select('metadata')
      .eq('category', 'system')
      .eq('metric_name', 'memory_usage')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (data?.metadata?.memory_usage_percent) {
        const mem = (data.metadata as Record<string, unknown>)[
          'memory_usage_percent'
        ];
        if (typeof mem === 'number') return mem;
        if (typeof mem === 'string') return Number(mem) || 0;
        return 0;
    }

    return 0;
  }

  private async getCustomMetricValue(
    metric: string,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const { data } = await this.supabase
      .from('application_metrics')
      .select('value')
      .eq('metric_name', metric)
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

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
      const alert: Omit<Alert, 'id'> = {
        rule_id: rule.id,
        rule_name: rule.name,
        metric: rule.metric,
        current_value: currentValue,
        threshold: rule.threshold,
        severity: rule.severity,
        message: `${rule.description}. Valor atual: ${currentValue}, Limite: ${rule.threshold}`,
        status: 'active',
        triggered_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('alerts')
        .insert({
          ...alert,
          id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      return null;
    }
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
      await this.supabase.from('alert_notifications').insert({
        id: crypto.randomUUID(),
        alert_id: alertId,
        channel,
        recipient,
        status: 'pending',
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
      const { error } = await this.supabase
        .from('alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: acknowledgedBy,
        })
        .eq('id', alertId);

      return !error;
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
      return false;
    }
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      return !error;
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      return false;
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('triggered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar alertas ativos:', error);
      return [];
    }
  }

  async getAlertStats(): Promise<AlertStats> {
    try {
      const { data: alerts } = await this.supabase.from('alerts').select('*');

  const activeAlerts: Alert[] = (alerts?.filter((a: Alert) => a.status === 'active') as Alert[]) || [];
  const criticalAlerts: Alert[] = activeAlerts.filter((a: Alert) => a.severity === 'critical');

      const alertsBySeverity =
        alerts?.reduce(
          (acc: Record<string, number>, alert: Alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      const alertsByMetric =
        alerts?.reduce(
          (acc: Record<string, number>, alert: Alert) => {
            acc[alert.metric] = (acc[alert.metric] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      // Calcular tempo médio de resolução
      const resolvedAlerts: Alert[] =
        (alerts?.filter((a: Alert) => a.status === 'resolved' && a.resolved_at) as Alert[]) || [];
      const resolutionTimes = resolvedAlerts.map((alert: Alert) => {
        const triggered = new Date(alert.triggered_at).getTime();
        const resolved = new Date(alert.resolved_at!).getTime();
        return (resolved - triggered) / (1000 * 60); // em minutos
      });

      const resolutionTimeAvg =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((sum: number, time: number) => sum + time, 0) /
            resolutionTimes.length
          : 0;

      return {
        total_alerts: alerts?.length || 0,
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
