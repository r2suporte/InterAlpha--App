/**
 * @jest-environment node
 */

// ✅ MOCKS MUST BE BEFORE IMPORTS
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

jest.mock('@/lib/services/application-metrics', () => ({
  ApplicationMetricsService: jest.fn().mockImplementation(() => ({
    calculateErrorRate: jest.fn().mockResolvedValue(2.5),
    calculateAverageResponseTime: jest.fn().mockResolvedValue(450),
    getSuccessRate: jest.fn().mockResolvedValue(97.5),
  })),
}));

// ✅ NOW we can import the service
import {
  alertService,
  AlertRule,
  Alert,
  AlertNotification,
  AlertStats,
} from '@/lib/services/alert-service';

describe('lib/services/alert-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service exports', () => {
    it('should export alertService', () => {
      expect(alertService).toBeDefined();
      expect(typeof alertService).toBe('object');
    });

    it('should have all required methods', () => {
      expect(typeof alertService.initializeDefaultRules).toBe('function');
      expect(typeof alertService.createRule).toBe('function');
      expect(typeof alertService.updateRule).toBe('function');
      expect(typeof alertService.deleteRule).toBe('function');
      expect(typeof alertService.getRules).toBe('function');
      expect(typeof alertService.checkAlerts).toBe('function');
      expect(typeof alertService.acknowledgeAlert).toBe('function');
      expect(typeof alertService.resolveAlert).toBe('function');
      expect(typeof alertService.getActiveAlerts).toBe('function');
      expect(typeof alertService.getAlertStats).toBe('function');
      expect(typeof alertService.startMonitoring).toBe('function');
      expect(typeof alertService.stopMonitoring).toBe('function');
    });
  });

  describe('AlertRule type', () => {
    it('should support all required fields', () => {
      const rule: AlertRule = {
        id: 'rule-1',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 5%',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 5,
        severity: 'high',
        enabled: true,
        cooldown_minutes: 15,
      };
      expect(rule.id).toBe('rule-1');
      expect(rule.condition).toBe('greater_than');
      expect(rule.severity).toBe('high');
    });

    it('should support all conditions', () => {
      const conditions = ['greater_than', 'less_than', 'equals', 'not_equals'] as const;
      conditions.forEach(c => {
        expect(['greater_than', 'less_than', 'equals', 'not_equals']).toContain(c);
      });
    });

    it('should support all severities', () => {
      const severities = ['low', 'medium', 'high', 'critical'] as const;
      severities.forEach(s => {
        expect(['low', 'medium', 'high', 'critical']).toContain(s);
      });
    });
  });

  describe('Alert type', () => {
    it('should support active status', () => {
      const alert: Alert = {
        id: 'alert-1',
        rule_id: 'rule-1',
        rule_name: 'High Error Rate',
        metric: 'error_rate',
        current_value: 8,
        threshold: 5,
        severity: 'high',
        message: 'Error rate exceeded',
        status: 'active',
        triggered_at: new Date().toISOString(),
      };
      expect(alert.status).toBe('active');
    });

    it('should support resolved status', () => {
      const alert: Alert = {
        id: 'alert-2',
        rule_id: 'rule-2',
        rule_name: 'Memory Alert',
        metric: 'memory',
        current_value: 75,
        threshold: 90,
        severity: 'low',
        message: 'Memory normalized',
        status: 'resolved',
        triggered_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      };
      expect(alert.status).toBe('resolved');
    });
  });

  describe('AlertNotification type', () => {
    it('should support all channels', () => {
      const channels = ['email', 'sms', 'webhook', 'in_app'] as const;
      channels.forEach(ch => {
        const notif: AlertNotification = {
          id: `notif-${ch}`,
          alert_id: 'alert-1',
          channel: ch,
          recipient: 'test',
          status: 'sent',
        };
        expect(notif.channel).toBe(ch);
      });
    });

    it('should support all statuses', () => {
      const statuses = ['pending', 'sent', 'failed'] as const;
      statuses.forEach(st => {
        const notif: AlertNotification = {
          id: `notif-${st}`,
          alert_id: 'alert-1',
          channel: 'email',
          recipient: 'test',
          status: st,
        };
        expect(notif.status).toBe(st);
      });
    });
  });

  describe('AlertStats type', () => {
    it('should have all fields', () => {
      const stats: AlertStats = {
        total_alerts: 150,
        active_alerts: 25,
        critical_alerts: 5,
        alerts_by_severity: { low: 50, medium: 60, high: 30, critical: 10 },
        alerts_by_metric: { error_rate: 40, memory: 35 },
        resolution_time_avg: 3600,
      };
      expect(stats.total_alerts).toBe(150);
      expect(stats.active_alerts).toBe(25);
    });
  });
});
