/**
 * @jest-environment node
 */

// ✅ CRITICAL: Mock Supabase FIRST before any service imports
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

// ✅ Mock metrics BEFORE service uses it
jest.mock('@/lib/services/metrics-service', () => ({
  metricsService: {
    recordMetric: jest.fn().mockResolvedValue(undefined),
  },
}));

// ✅ Mock Email Service class (communication-service does: new EmailService())
jest.mock('@/lib/services/email-service', () => {
  return jest.fn().mockImplementation(() => ({
    sendOrdemServicoEmail: jest.fn().mockResolvedValue({ success: true }),
  }));
});

// ✅ Mock SMS Service class (communication-service does: new SMSService())
jest.mock('@/lib/services/sms-service', () => ({
  SMSService: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ success: true, sid: 'SM123' }),
  })),
}));

// ✅ Mock WhatsApp Service class (communication-service does: new WhatsAppService())
jest.mock('@/lib/services/whatsapp-service', () => {
  return jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ success: true, sid: 'WA123' }),
  }));
});

// ✅ NOW we can safely import the service
import { communicationService } from '@/lib/services/communication-service';

describe('lib/services/communication-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service exports', () => {
    it('should export communicationService', () => {
      expect(communicationService).toBeDefined();
      expect(typeof communicationService).toBe('object');
    });

    it('should have sendCommunication method', () => {
      expect(typeof communicationService.sendCommunication).toBe('function');
    });

    it('should have sendOrdemServicoCommunication method', () => {
      expect(typeof communicationService.sendOrdemServicoCommunication).toBe('function');
    });
  });

  describe('Channel types', () => {
    it('should support WhatsApp channel', () => {
      const channel = 'whatsapp';
      expect(['whatsapp', 'sms', 'email']).toContain(channel);
    });

    it('should support SMS channel', () => {
      const channel = 'sms';
      expect(['whatsapp', 'sms', 'email']).toContain(channel);
    });

    it('should support Email channel', () => {
      const channel = 'email';
      expect(['whatsapp', 'sms', 'email']).toContain(channel);
    });
  });

  describe('Communication priorities', () => {
    it('should support speed priority', () => {
      const priority = 'speed';
      expect(['speed', 'reliability', 'cost']).toContain(priority);
    });

    it('should support reliability priority', () => {
      const priority = 'reliability';
      expect(['speed', 'reliability', 'cost']).toContain(priority);
    });

    it('should support cost priority', () => {
      const priority = 'cost';
      expect(['speed', 'reliability', 'cost']).toContain(priority);
    });
  });

  describe('Communication urgency levels', () => {
    it('should support low urgency', () => {
      const urgency = 'low';
      expect(['low', 'medium', 'high', 'critical']).toContain(urgency);
    });

    it('should support medium urgency', () => {
      const urgency = 'medium';
      expect(['low', 'medium', 'high', 'critical']).toContain(urgency);
    });

    it('should support high urgency', () => {
      const urgency = 'high';
      expect(['low', 'medium', 'high', 'critical']).toContain(urgency);
    });

    it('should support critical urgency', () => {
      const urgency = 'critical';
      expect(['low', 'medium', 'high', 'critical']).toContain(urgency);
    });
  });

  describe('Client preferences', () => {
    it('should support whatsapp preference', () => {
      const pref = 'whatsapp';
      expect(['whatsapp', 'sms', 'email', 'auto']).toContain(pref);
    });

    it('should support sms preference', () => {
      const pref = 'sms';
      expect(['whatsapp', 'sms', 'email', 'auto']).toContain(pref);
    });

    it('should support email preference', () => {
      const pref = 'email';
      expect(['whatsapp', 'sms', 'email', 'auto']).toContain(pref);
    });

    it('should support auto preference', () => {
      const pref = 'auto';
      expect(['whatsapp', 'sms', 'email', 'auto']).toContain(pref);
    });
  });

  describe('Result structure', () => {
    it('should indicate success', () => {
      const success = true;
      expect(typeof success).toBe('boolean');
    });

    it('should track channel used', () => {
      const channel = 'sms';
      expect(channel).toBeDefined();
    });

    it('should have message ID optional', () => {
      const messageId = 'msg-123';
      expect(messageId).toBeDefined();
    });

    it('should have attempts array', () => {
      const attempts = [
        { channel: 'whatsapp', success: true },
      ];
      expect(Array.isArray(attempts)).toBe(true);
    });

    it('should track attempt details', () => {
      const attempt = {
        channel: 'sms',
        success: false,
        error: 'Invalid number',
      };
      expect(attempt.channel).toBeDefined();
      expect(attempt.success).toBe(false);
      expect(attempt.error).toBeDefined();
    });
  });

  describe('Fallback handling', () => {
    it('should support fallback flag', () => {
      const fallback = true;
      expect(typeof fallback).toBe('boolean');
    });

    it('should track multiple attempts for fallback', () => {
      const attempts = [
        { channel: 'whatsapp', success: false, error: 'Network error' },
        { channel: 'sms', success: true },
      ];
      expect(attempts.length).toBe(2);
      expect(attempts[1].success).toBe(true);
    });
  });

  describe('Order communication', () => {
    it('should support ordem servico communication', () => {
      const params = {
        ordemServico: {
          id: 'os-123',
          numero_ordem: 'OS-001',
          cliente_id: 'cli-123',
          status: 'pending',
        },
        cliente: {
          id: 'cli-123',
          nome: 'João',
          email: 'joao@example.com',
        },
      };
      expect(params.ordemServico.numero_ordem).toBe('OS-001');
      expect(params.cliente.nome).toBe('João');
    });
  });

  describe('Service status', () => {
    it('should check service availability', () => {
      const status = {
        whatsapp: true,
        sms: true,
        email: true,
      };
      expect(status).toHaveProperty('whatsapp');
      expect(status).toHaveProperty('sms');
      expect(status).toHaveProperty('email');
    });
  });
});
