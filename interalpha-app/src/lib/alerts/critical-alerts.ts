/**
 * Critical System Alerts for Products Management
 * Handles system-wide alerts, notifications, and emergency protocols
 */

import { Redis } from 'ioredis';
import { prisma } from '@/lib/prisma';

export interface CriticalAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
  escalationLevel: number;
  notificationsSent: string[];
}

export type AlertType = 
  | 'system_failure'
  | 'database_error'
  | 'performance_degradation'
  | 'security_breach'
  | 'data_corruption'
  | 'service_unavailable'
  | 'resource_exhaustion'
  | 'backup_failure'
  | 'authentication_failure'
  | 'api_error_rate'
  | 'disk_space_low'
  | 'memory_usage_high'
  | 'cpu_usage_high'
  | 'network_connectivity'
  | 'external_service_failure';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical' | 'emergency';

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  condition: string;
  threshold: number;
  duration: number; // seconds
  severity: AlertSeverity;
  enabled: boolean;
  escalationRules: EscalationRule[];
  suppressionRules?: SuppressionRule[];
  metadata?: Record<string, any>;
}

export interface EscalationRule {
  level: number;
  delay: number; // minutes
  channels: NotificationChannel[];
  recipients: string[];
}

export interface SuppressionRule {
  condition: string;
  duration: number; // minutes
}

export type NotificationChannel = 'email' | 'sms' | 'slack' | 'webhook' | 'push' | 'phone';

export class CriticalAlertsSystem {
  private redis: Redis;
  private alerts: Map<string, CriticalAlert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.setupDefaultRules();
    this.startAlertProcessing();
  }

  // Alert Management
  async createAlert(alertData: Omit<CriticalAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved' | 'escalationLevel' | 'notificationsSent'>): Promise<CriticalAlert> {
    const alert: CriticalAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      escalationLevel: 0,
      notificationsSent: [],
      ...alertData
    };

    // Store alert
    this.alerts.set(alert.id, alert);
    await this.persistAlert(alert);

    // Log alert creation
    console.error(`🚨 CRITICAL ALERT: ${alert.title}`);
    console.error(`   Type: ${alert.type}`);
    console.error(`   Severity: ${alert.severity}`);
    console.error(`   Source: ${alert.source}`);
    console.error(`   Message: ${alert.message}`);

    // Start escalation process
    await this.processAlert(alert);

    return alert;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.acknowledged) {
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    await this.persistAlert(alert);

    // Stop escalation
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    console.log(`✅ Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    
    // Send acknowledgment notification
    await this.sendNotification({
      type: 'alert_acknowledged',
      title: 'Alert Acknowledged',
      message: `Alert ${alert.title} has been acknowledged by ${acknowledgedBy}`,
      severity: 'medium',
      channels: ['email', 'slack']
    });

    return true;
  }

  async resolveAlert(alertId: string, resolvedBy: string, resolution?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();
    
    if (resolution) {
      alert.metadata = { ...alert.metadata, resolution };
    }

    await this.persistAlert(alert);

    // Stop escalation
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    console.log(`✅ Alert resolved: ${alertId} by ${resolvedBy}`);
    
    // Send resolution notification
    await this.sendNotification({
      type: 'alert_resolved',
      title: 'Alert Resolved',
      message: `Alert ${alert.title} has been resolved by ${resolvedBy}`,
      severity: 'low',
      channels: ['email', 'slack']
    });

    return true;
  }

  // Predefined Alert Creators
  async createSystemFailureAlert(source: string, error: Error): Promise<CriticalAlert> {
    return this.createAlert({
      type: 'system_failure',
      severity: 'critical',
      title: 'System Failure Detected',
      message: `Critical system failure in ${source}: ${error.message}`,
      source,
      metadata: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
  }

  async createDatabaseErrorAlert(operation: string, error: Error): Promise<CriticalAlert> {
    return this.createAlert({
      type: 'database_error',
      severity: 'critical',
      title: 'Database Error',
      message: `Database operation failed: ${operation} - ${error.message}`,
      source: 'database',
      metadata: {
        operation,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  async createPerformanceDegradationAlert(metric: string, value: number, threshold: number): Promise<CriticalAlert> {
    const severity = value > threshold * 2 ? 'critical' : 'high';
    
    return this.createAlert({
      type: 'performance_degradation',
      severity,
      title: 'Performance Degradation',
      message: `${metric} is ${value}, exceeding threshold of ${threshold}`,
      source: 'monitoring',
      metadata: {
        metric,
        value,
        threshold,
        timestamp: new Date().toISOString()
      }
    });
  }

  async createSecurityBreachAlert(source: string, details: Record<string, any>): Promise<CriticalAlert> {
    return this.createAlert({
      type: 'security_breach',
      severity: 'emergency',
      title: 'Security Breach Detected',
      message: `Potential security breach detected in ${source}`,
      source,
      metadata: {
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }

  async createResourceExhaustionAlert(resource: string, usage: number, limit: number): Promise<CriticalAlert> {
    const severity = usage > limit * 0.95 ? 'critical' : 'high';
    
    return this.createAlert({
      type: 'resource_exhaustion',
      severity,
      title: 'Resource Exhaustion Warning',
      message: `${resource} usage is ${usage}% of limit (${limit})`,
      source: 'system_monitor',
      metadata: {
        resource,
        usage,
        limit,
        timestamp: new Date().toISOString()
      }
    });
  }

  async createApiErrorRateAlert(endpoint: string, errorRate: number, threshold: number): Promise<CriticalAlert> {
    const severity = errorRate > threshold * 2 ? 'critical' : 'high';
    
    return this.createAlert({
      type: 'api_error_rate',
      severity,
      title: 'High API Error Rate',
      message: `API endpoint ${endpoint} has error rate of ${errorRate}% (threshold: ${threshold}%)`,
      source: 'api_monitor',
      metadata: {
        endpoint,
        errorRate,
        threshold,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Alert Processing
  private async processAlert(alert: CriticalAlert): Promise<void> {
    // Check if alert should be suppressed
    if (await this.shouldSuppressAlert(alert)) {
      console.log(`🔇 Alert suppressed: ${alert.id}`);
      return;
    }

    // Find matching rule
    const rule = this.findMatchingRule(alert);
    if (!rule || !rule.enabled) {
      console.log(`⚠️  No matching rule for alert: ${alert.type}`);
      return;
    }

    // Start escalation process
    await this.startEscalation(alert, rule);
  }

  private async startEscalation(alert: CriticalAlert, rule: AlertRule): Promise<void> {
    const escalateLevel = async (level: number) => {
      const escalationRule = rule.escalationRules.find(r => r.level === level);
      if (!escalationRule) {
        console.log(`📈 No escalation rule for level ${level}`);
        return;
      }

      console.log(`📈 Escalating alert ${alert.id} to level ${level}`);
      
      alert.escalationLevel = level;
      await this.persistAlert(alert);

      // Send notifications for this escalation level
      await this.sendEscalationNotifications(alert, escalationRule);

      // Schedule next escalation if alert is not acknowledged/resolved
      const nextLevel = level + 1;
      const nextRule = rule.escalationRules.find(r => r.level === nextLevel);
      
      if (nextRule && !alert.acknowledged && !alert.resolved) {
        const timer = setTimeout(() => {
          if (!alert.acknowledged && !alert.resolved) {
            escalateLevel(nextLevel);
          }
        }, nextRule.delay * 60 * 1000); // Convert minutes to milliseconds

        this.escalationTimers.set(alert.id, timer);
      }
    };

    // Start with level 1
    await escalateLevel(1);
  }

  private async sendEscalationNotifications(alert: CriticalAlert, escalationRule: EscalationRule): Promise<void> {
    for (const channel of escalationRule.channels) {
      for (const recipient of escalationRule.recipients) {
        try {
          await this.sendNotification({
            type: 'alert_escalation',
            title: `🚨 ESCALATED: ${alert.title}`,
            message: this.formatAlertMessage(alert, escalationRule.level),
            severity: alert.severity,
            channels: [channel],
            recipient
          });

          alert.notificationsSent.push(`${channel}:${recipient}:${new Date().toISOString()}`);
        } catch (error) {
          console.error(`Failed to send ${channel} notification to ${recipient}:`, error);
        }
      }
    }

    await this.persistAlert(alert);
  }

  private formatAlertMessage(alert: CriticalAlert, escalationLevel: number): string {
    return `
🚨 CRITICAL ALERT - ESCALATION LEVEL ${escalationLevel}

Title: ${alert.title}
Type: ${alert.type}
Severity: ${alert.severity.toUpperCase()}
Source: ${alert.source}
Time: ${alert.timestamp.toISOString()}

Message: ${alert.message}

Alert ID: ${alert.id}

This alert requires immediate attention. Please acknowledge or resolve as soon as possible.

To acknowledge: POST /api/alerts/${alert.id}/acknowledge
To resolve: POST /api/alerts/${alert.id}/resolve
    `.trim();
  }

  // Alert Rules Management
  private setupDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'system_failure_rule',
        name: 'System Failure Alert Rule',
        type: 'system_failure',
        condition: 'always',
        threshold: 0,
        duration: 0,
        severity: 'critical',
        enabled: true,
        escalationRules: [
          {
            level: 1,
            delay: 0,
            channels: ['email', 'slack'],
            recipients: ['admin@interalpha.com', '#alerts']
          },
          {
            level: 2,
            delay: 5,
            channels: ['email', 'sms', 'slack'],
            recipients: ['admin@interalpha.com', 'emergency@interalpha.com', '#critical-alerts']
          },
          {
            level: 3,
            delay: 15,
            channels: ['email', 'sms', 'phone'],
            recipients: ['admin@interalpha.com', 'cto@interalpha.com']
          }
        ]
      },
      {
        id: 'database_error_rule',
        name: 'Database Error Alert Rule',
        type: 'database_error',
        condition: 'always',
        threshold: 0,
        duration: 0,
        severity: 'critical',
        enabled: true,
        escalationRules: [
          {
            level: 1,
            delay: 0,
            channels: ['email', 'slack'],
            recipients: ['admin@interalpha.com', '#database-alerts']
          },
          {
            level: 2,
            delay: 10,
            channels: ['email', 'sms'],
            recipients: ['admin@interalpha.com', 'dba@interalpha.com']
          }
        ]
      },
      {
        id: 'performance_degradation_rule',
        name: 'Performance Degradation Rule',
        type: 'performance_degradation',
        condition: 'threshold_exceeded',
        threshold: 2000, // 2 seconds
        duration: 300, // 5 minutes
        severity: 'high',
        enabled: true,
        escalationRules: [
          {
            level: 1,
            delay: 0,
            channels: ['email', 'slack'],
            recipients: ['admin@interalpha.com', '#performance-alerts']
          },
          {
            level: 2,
            delay: 30,
            channels: ['email', 'sms'],
            recipients: ['admin@interalpha.com']
          }
        ]
      },
      {
        id: 'security_breach_rule',
        name: 'Security Breach Rule',
        type: 'security_breach',
        condition: 'always',
        threshold: 0,
        duration: 0,
        severity: 'emergency',
        enabled: true,
        escalationRules: [
          {
            level: 1,
            delay: 0,
            channels: ['email', 'sms', 'slack', 'phone'],
            recipients: ['admin@interalpha.com', 'security@interalpha.com', '#security-alerts']
          },
          {
            level: 2,
            delay: 2,
            channels: ['email', 'sms', 'phone'],
            recipients: ['cto@interalpha.com', 'ceo@interalpha.com']
          }
        ]
      },
      {
        id: 'api_error_rate_rule',
        name: 'API Error Rate Rule',
        type: 'api_error_rate',
        condition: 'threshold_exceeded',
        threshold: 10, // 10% error rate
        duration: 300, // 5 minutes
        severity: 'high',
        enabled: true,
        escalationRules: [
          {
            level: 1,
            delay: 0,
            channels: ['email', 'slack'],
            recipients: ['admin@interalpha.com', '#api-alerts']
          },
          {
            level: 2,
            delay: 15,
            channels: ['email', 'sms'],
            recipients: ['admin@interalpha.com']
          }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private findMatchingRule(alert: CriticalAlert): AlertRule | undefined {
    return Array.from(this.rules.values()).find(rule => rule.type === alert.type);
  }

  private async shouldSuppressAlert(alert: CriticalAlert): Promise<boolean> {
    const rule = this.findMatchingRule(alert);
    if (!rule?.suppressionRules) {
      return false;
    }

    // Check suppression rules
    for (const suppressionRule of rule.suppressionRules) {
      if (await this.evaluateSuppressionCondition(suppressionRule, alert)) {
        return true;
      }
    }

    return false;
  }

  private async evaluateSuppressionCondition(suppressionRule: SuppressionRule, alert: CriticalAlert): Promise<boolean> {
    // Simple suppression logic - can be extended
    switch (suppressionRule.condition) {
      case 'similar_alert_exists':
        return this.hasSimilarRecentAlert(alert, suppressionRule.duration);
      case 'maintenance_window':
        return this.isMaintenanceWindow();
      default:
        return false;
    }
  }

  private hasSimilarRecentAlert(alert: CriticalAlert, durationMinutes: number): boolean {
    const cutoffTime = new Date(Date.now() - durationMinutes * 60 * 1000);
    
    return Array.from(this.alerts.values()).some(existingAlert => 
      existingAlert.type === alert.type &&
      existingAlert.source === alert.source &&
      existingAlert.timestamp > cutoffTime &&
      !existingAlert.resolved
    );
  }

  private isMaintenanceWindow(): boolean {
    // Check if current time is within a scheduled maintenance window
    // This would integrate with a maintenance schedule system
    return false;
  }

  // Notification System
  private async sendNotification(notification: {
    type: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    channels: NotificationChannel[];
    recipient?: string;
  }): Promise<void> {
    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(notification);
            break;
          case 'sms':
            await this.sendSmsNotification(notification);
            break;
          case 'slack':
            await this.sendSlackNotification(notification);
            break;
          case 'webhook':
            await this.sendWebhookNotification(notification);
            break;
          case 'push':
            await this.sendPushNotification(notification);
            break;
          case 'phone':
            await this.sendPhoneNotification(notification);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  private async sendEmailNotification(notification: any): Promise<void> {
    console.log(`📧 Email notification: ${notification.title}`);
    // Implementation would integrate with email service
  }

  private async sendSmsNotification(notification: any): Promise<void> {
    console.log(`📱 SMS notification: ${notification.title}`);
    // Implementation would integrate with SMS service
  }

  private async sendSlackNotification(notification: any): Promise<void> {
    console.log(`💬 Slack notification: ${notification.title}`);
    // Implementation would integrate with Slack API
  }

  private async sendWebhookNotification(notification: any): Promise<void> {
    console.log(`🔗 Webhook notification: ${notification.title}`);
    // Implementation would send to webhook URLs
  }

  private async sendPushNotification(notification: any): Promise<void> {
    console.log(`📲 Push notification: ${notification.title}`);
    // Implementation would integrate with push notification service
  }

  private async sendPhoneNotification(notification: any): Promise<void> {
    console.log(`📞 Phone notification: ${notification.title}`);
    // Implementation would integrate with voice call service
  }

  // Persistence
  private async persistAlert(alert: CriticalAlert): Promise<void> {
    try {
      await this.redis.setex(
        `alert:${alert.id}`,
        86400 * 7, // 7 days
        JSON.stringify(alert)
      );

      // Also store in active alerts set if not resolved
      if (!alert.resolved) {
        await this.redis.sadd('active_alerts', alert.id);
      } else {
        await this.redis.srem('active_alerts', alert.id);
      }
    } catch (error) {
      console.error('Failed to persist alert:', error);
    }
  }

  // Query Methods
  async getActiveAlerts(): Promise<CriticalAlert[]> {
    try {
      const activeAlertIds = await this.redis.smembers('active_alerts');
      const alerts: CriticalAlert[] = [];

      for (const alertId of activeAlertIds) {
        const alertData = await this.redis.get(`alert:${alertId}`);
        if (alertData) {
          alerts.push(JSON.parse(alertData));
        }
      }

      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  async getAlertHistory(limit: number = 100): Promise<CriticalAlert[]> {
    try {
      const alertKeys = await this.redis.keys('alert:*');
      const alerts: CriticalAlert[] = [];

      for (const key of alertKeys.slice(0, limit)) {
        const alertData = await this.redis.get(key);
        if (alertData) {
          alerts.push(JSON.parse(alertData));
        }
      }

      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get alert history:', error);
      return [];
    }
  }

  // System Lifecycle
  private startAlertProcessing(): void {
    // Cleanup resolved alerts periodically
    setInterval(async () => {
      await this.cleanupResolvedAlerts();
    }, 3600000); // Every hour

    console.log('🚨 Critical Alerts System started');
  }

  private async cleanupResolvedAlerts(): Promise<void> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const alertKeys = await this.redis.keys('alert:*');

      for (const key of alertKeys) {
        const alertData = await this.redis.get(key);
        if (alertData) {
          const alert = JSON.parse(alertData);
          if (alert.resolved && new Date(alert.resolvedAt) < oneDayAgo) {
            await this.redis.del(key);
            await this.redis.srem('active_alerts', alert.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup resolved alerts:', error);
    }
  }

  private generateAlertId(): string {
    return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
    // Clear all escalation timers
    for (const timer of this.escalationTimers.values()) {
      clearTimeout(timer);
    }
    this.escalationTimers.clear();

    await this.redis.quit();
    console.log('🚨 Critical Alerts System shutdown complete');
  }
}

// Singleton instance
export const criticalAlerts = new CriticalAlertsSystem();

// Express middleware for automatic error alerting
export function alertingMiddleware() {
  return (error: Error, req: any, res: any, next: any) => {
    // Create alert for unhandled errors
    criticalAlerts.createSystemFailureAlert(
      `${req.method} ${req.path}`,
      error
    ).catch(console.error);

    next(error);
  };
}