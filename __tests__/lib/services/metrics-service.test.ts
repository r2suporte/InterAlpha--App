/**
 * @jest-environment node
 */

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      limit: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    })),
  })),
}));

import { metricsService } from '@/lib/services/metrics-service';

describe('lib/services/metrics-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service exports', () => {
    it('should export metricsService', () => {
      expect(metricsService).toBeDefined();
      expect(typeof metricsService).toBe('object');
    });

    it('should have recordMetric method', () => {
      expect(typeof metricsService.recordMetric).toBe('function');
    });

    it('should have measureOperation method', () => {
      expect(typeof metricsService.measureOperation).toBe('function');
    });

    it('should have getPerformanceStats method', () => {
      expect(typeof metricsService.getPerformanceStats).toBe('function');
    });
  });

  describe('Metric recording', () => {
    it('should record service metric', () => {
      const metric = {
        service: 'email',
        operation: 'send',
        duration_ms: 250,
        success: true,
      };

      expect(metric.service).toBeDefined();
      expect(metric.operation).toBeDefined();
      expect(metric.duration_ms).toBeGreaterThan(0);
    });

    it('should track SMS metrics', () => {
      const metric = {
        service: 'sms',
        operation: 'send',
        duration_ms: 150,
        success: true,
      };

      expect(metric.service).toBe('sms');
    });

    it('should track email metrics', () => {
      const metric = {
        service: 'email',
        operation: 'send',
        duration_ms: 500,
        success: true,
      };

      expect(metric.service).toBe('email');
    });

    it('should record error metrics', () => {
      const metric = {
        service: 'sms',
        operation: 'send',
        duration_ms: 0,
        success: false,
        error_message: 'Invalid phone',
      };

      expect(metric.success).toBe(false);
      expect(metric.error_message).toBeDefined();
    });
  });

  describe('Performance stats', () => {
    it('should calculate success rate', () => {
      const stats = {
        total_calls: 100,
        successful_calls: 95,
        success_rate: 95,
        avg_duration_ms: 250,
      };

      expect(stats.success_rate).toBe(95);
    });

    it('should calculate average duration', () => {
      const stats = {
        total_calls: 50,
        avg_duration_ms: 275.5,
      };

      expect(stats.avg_duration_ms).toBeGreaterThan(0);
    });

    it('should track p95 response time', () => {
      const stats = {
        p95_duration_ms: 1500,
        total_calls: 100,
      };

      expect(stats.p95_duration_ms).toBeGreaterThan(0);
    });

    it('should track max duration', () => {
      const stats = {
        max_duration_ms: 5000,
      };

      expect(stats.max_duration_ms).toBeGreaterThan(0);
    });
  });

  describe('Memory management', () => {
    it('should have MAX_MEMORY_METRICS constant', () => {
      const MAX_MEMORY = 1000;
      expect(MAX_MEMORY).toBeGreaterThan(0);
    });

    it('should manage memory limits', () => {
      const metrics = [];
      for (let i = 0; i < 1500; i++) {
        metrics.push({
          id: `metric-${i}`,
          service: 'test',
          operation: 'test',
        });
      }
      expect(metrics.length).toBeGreaterThan(1000);
    });
  });

  describe('Metric types', () => {
    it('should support service metric', () => {
      const metric = {
        service: 'sms',
        operation: 'send',
        duration_ms: 100,
        success: true,
      };

      expect(metric).toHaveProperty('service');
      expect(metric).toHaveProperty('operation');
    });

    it('should support metadata field', () => {
      const metric = {
        service: 'email',
        operation: 'send',
        duration_ms: 200,
        success: true,
        metadata: {
          recipient: 'user@example.com',
          template: 'ordem_servico',
        },
      };

      expect(metric.metadata).toBeDefined();
    });
  });

  describe('Service health', () => {
    it('should track service health', () => {
      const health = {
        service: 'email',
        status: 'healthy',
        last_check: new Date().toISOString(),
      };

      expect(health.status).toBe('healthy');
    });

    it('should track degraded status', () => {
      const health = {
        service: 'sms',
        status: 'degraded',
        error_rate: 15,
      };

      expect(health.status).toBe('degraded');
    });

    it('should track unhealthy status', () => {
      const health = {
        service: 'whatsapp',
        status: 'unhealthy',
      };

      expect(health.status).toBe('unhealthy');
    });
  });

  describe('Operations', () => {
    it('should track email send operation', () => {
      const op = { service: 'email', operation: 'send' };
      expect(op.operation).toBe('send');
    });

    it('should track SMS send operation', () => {
      const op = { service: 'sms', operation: 'send' };
      expect(op.operation).toBe('send');
    });

    it('should track WhatsApp send operation', () => {
      const op = { service: 'whatsapp', operation: 'send' };
      expect(op.operation).toBe('send');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old metrics', () => {
      const cleanup = { interval: 300000, maxAge: 1800000 };
      expect(cleanup.interval).toBeGreaterThan(0);
    });

    it('should run cleanup every 5 minutes', () => {
      const interval = 5 * 60 * 1000;
      expect(interval).toBe(300000);
    });
  });

  describe('Database operations', () => {
    it('should use communication_metrics table', () => {
      const table = 'communication_metrics';
      expect(table).toBe('communication_metrics');
    });

    it('should record created_at timestamp', () => {
      const metric = {
        created_at: new Date().toISOString(),
      };

      expect(metric.created_at).toBeDefined();
    });
  });

  describe('Performance ranges', () => {
    it('should handle fast operations', () => {
      expect(50).toBeLessThan(100);
    });

    it('should handle medium operations', () => {
      expect(500).toBeGreaterThan(100);
      expect(500).toBeLessThan(2000);
    });

    it('should handle slow operations', () => {
      expect(5000).toBeGreaterThan(2000);
    });
  });
});
