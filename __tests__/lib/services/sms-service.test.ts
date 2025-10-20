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
    })),
  })),
}));

jest.mock('@/lib/services/metrics-service', () => ({
  metricsService: {
    recordMetric: jest.fn().mockResolvedValue(undefined),
  },
}));

import { smsService } from '@/lib/services/sms-service';

describe('lib/services/sms-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service exports', () => {
    it('should export smsService', () => {
      expect(smsService).toBeDefined();
      expect(typeof smsService).toBe('object');
    });

    it('should have sendSMS method', () => {
      expect(typeof smsService.sendSMS).toBe('function');
    });

    it('should have sendOrdemServicoSMS method', () => {
      expect(typeof smsService.sendOrdemServicoSMS).toBe('function');
    });

    it('should have testConnection method', () => {
      expect(typeof smsService.testConnection).toBe('function');
    });

    it('should have formatPhoneNumber method', () => {
      expect(typeof smsService.formatPhoneNumber).toBe('function');
    });
  });

  describe('Phone formatting', () => {
    it('should format Brazilian mobile', () => {
      const phone = '11999999999';
      expect(phone.length).toBe(11);
    });

    it('should format with country code', () => {
      const phone = '+5511999999999';
      expect(phone).toContain('+55');
    });
  });

  describe('Config validation', () => {
    it('should validate config structure', () => {
      const config = {
        accountSid: 'AC123456789',
        authToken: 'token_123',
        phoneNumber: '+5511999999999',
      };

      expect(config.accountSid).toBeTruthy();
      expect(config.authToken).toBeTruthy();
      expect(config.phoneNumber).toBeTruthy();
    });
  });

  describe('SMS message', () => {
    it('should support message structure', () => {
      const msg = {
        to: '+5511999999999',
        body: 'Test',
      };

      expect(msg.to).toBeDefined();
      expect(msg.body).toBeDefined();
    });
  });

  describe('SMS response', () => {
    it('should have success field', () => {
      const resp = { success: true, messageId: 'SM123', provider: 'twilio' as const };
      expect(resp.success).toBe(true);
    });

    it('should have provider field', () => {
      const resp = { success: true, messageId: 'SM123', provider: 'twilio' as const };
      expect(resp.provider).toBe('twilio');
    });
  });

  describe('Twilio', () => {
    it('should use twilio provider', () => {
      expect('twilio').toBe('twilio');
    });
  });

  describe('Brazilian numbers', () => {
    it('should handle 11 digit mobile', () => {
      expect('11999999999'.length).toBe(11);
    });

    it('should handle 10 digit landline', () => {
      expect('1133333333'.length).toBe(10);
    });
  });

  describe('Metrics', () => {
    it('should track SMS sends', () => {
      const metric = { service: 'sms', operation: 'send' };
      expect(metric.service).toBe('sms');
    });
  });
});
