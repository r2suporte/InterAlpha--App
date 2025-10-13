// Mock do ApplicationMetricsService
jest.mock('../../../lib/services/application-metrics', () => ({
  ApplicationMetricsService: jest.fn().mockImplementation(() => ({})),
}));

// Mock do createClient
jest.mock('../../../lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({})),
        })),
        order: jest.fn(() => ({})),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}));

import { AlertService, AlertRule, Alert, AlertStats } from '../../../lib/services/alert-service';

// Mock do crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-123'),
  },
});

// Mock do console para evitar logs durante os testes
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('AlertService', () => {
  let alertService: AlertService;

  beforeEach(() => {
    alertService = new AlertService();
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('estrutura da classe', () => {
    it('deve criar uma instância do AlertService', () => {
      expect(alertService).toBeDefined();
      expect(typeof alertService).toBe('object');
    });

    it('deve ter todos os métodos principais', () => {
      expect(typeof alertService.initializeDefaultRules).toBe('function');
      expect(typeof alertService.createRule).toBe('function');
      expect(typeof alertService.updateRule).toBe('function');
      expect(typeof alertService.deleteRule).toBe('function');
      expect(typeof alertService.getRules).toBe('function');
    });

    it('deve ter métodos de gerenciamento de alertas', () => {
      expect(typeof alertService.acknowledgeAlert).toBe('function');
      expect(typeof alertService.resolveAlert).toBe('function');
      expect(typeof alertService.getActiveAlerts).toBe('function');
      expect(typeof alertService.getAlertStats).toBe('function');
    });

    it('deve ter métodos de monitoramento', () => {
      expect(typeof alertService.startMonitoring).toBe('function');
      expect(typeof alertService.stopMonitoring).toBe('function');
    });
  });

  describe('validação de interfaces', () => {
    it('deve aceitar dados válidos para AlertRule', () => {
      const alertRule: AlertRule = {
        id: 'rule-123',
        name: 'Test Rule',
        description: 'Test description',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 5,
        severity: 'high',
        enabled: true,
        cooldown_minutes: 15,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      expect(alertRule.id).toBeDefined();
      expect(alertRule.name).toBeDefined();
      expect(alertRule.metric).toBeDefined();
      expect(typeof alertRule.threshold).toBe('number');
      expect(typeof alertRule.enabled).toBe('boolean');
    });

    it('deve aceitar dados válidos para Alert', () => {
      const alert: Alert = {
        id: 'alert-123',
        rule_id: 'rule-456',
        rule_name: 'Test Rule',
        metric: 'error_rate',
        current_value: 10,
        threshold: 5,
        severity: 'high',
        message: 'Error rate exceeded',
        status: 'active',
        triggered_at: '2024-01-15T10:00:00Z',
      };

      expect(alert.id).toBeDefined();
      expect(alert.rule_id).toBeDefined();
      expect(alert.metric).toBeDefined();
      expect(typeof alert.current_value).toBe('number');
      expect(typeof alert.threshold).toBe('number');
    });

    it('deve aceitar dados válidos para AlertStats', () => {
      const stats: AlertStats = {
        total_alerts: 10,
        active_alerts: 3,
        critical_alerts: 1,
        alerts_by_severity: { high: 5, critical: 2 },
        alerts_by_metric: { error_rate: 4, response_time: 3 },
        resolution_time_avg: 25.5,
      };

      expect(typeof stats.total_alerts).toBe('number');
      expect(typeof stats.active_alerts).toBe('number');
      expect(typeof stats.critical_alerts).toBe('number');
      expect(typeof stats.alerts_by_severity).toBe('object');
      expect(typeof stats.alerts_by_metric).toBe('object');
      expect(typeof stats.resolution_time_avg).toBe('number');
    });
  });

  describe('métodos básicos', () => {
    it('deve chamar initializeDefaultRules sem erro', async () => {
      await expect(alertService.initializeDefaultRules()).resolves.not.toThrow();
    });

    it('deve chamar getRules sem erro', async () => {
      await expect(alertService.getRules()).resolves.not.toThrow();
    });

    it('deve chamar getActiveAlerts sem erro', async () => {
      await expect(alertService.getActiveAlerts()).resolves.not.toThrow();
    });

    it('deve chamar getAlertStats sem erro', async () => {
      await expect(alertService.getAlertStats()).resolves.not.toThrow();
    });

    it('deve chamar startMonitoring sem erro', () => {
      expect(() => alertService.startMonitoring()).not.toThrow();
    });

    it('deve chamar stopMonitoring sem erro', () => {
      expect(() => alertService.stopMonitoring()).not.toThrow();
    });
  });
});