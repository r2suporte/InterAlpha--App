import { SMSService } from '@/lib/services/sms-service';

// Mock do Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }))
}));

// Mock do metrics service
jest.mock('@/lib/services/metrics-service', () => ({
  metricsService: {
    recordMetric: jest.fn(),
    measureOperation: jest.fn((service, operation, fn) => fn()),
    getPerformanceStats: jest.fn(),
    getServiceHealth: jest.fn(),
    detectAnomalies: jest.fn(),
    getRealTimeMetrics: jest.fn()
  }
}));

// Mock do fetch global
global.fetch = jest.fn();

describe('SMSService', () => {
  let smsService: SMSService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    smsService = new SMSService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor e inicialização', () => {
    it('deve criar uma instância do SMSService', () => {
      expect(smsService).toBeDefined();
    });

    it('deve mostrar aviso quando credenciais Twilio não estão configuradas', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_PHONE_NUMBER;
      
      new SMSService();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ SMS Service: Configuração incompleta do Twilio'
      );
      
      consoleSpy.mockRestore();
    });

    it('deve configurar credenciais quando variáveis de ambiente estão disponíveis', () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';
      
      const service = new SMSService();
      expect(service).toBeDefined();
    });
  });

  describe('sendSMS', () => {
    beforeEach(() => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';
    });

    it('deve enviar SMS com sucesso', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          sid: 'test_message_id',
          status: 'sent'
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await smsService.sendSMS('+5511999999999', 'Teste de mensagem');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test_message_id');
      expect(result.provider).toBe('twilio');
    });

    it('deve formatar número de telefone corretamente', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          sid: 'test_message_id',
          status: 'sent'
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await smsService.sendSMS('11999999999', 'Teste');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('To=%2B5511999999999')
        })
      );
    });

    it('deve tentar enviar SMS mesmo sem credenciais configuradas', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      const serviceWithoutConfig = new SMSService();

      // Mock fetch para simular erro de autenticação
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Authentication failed'));

      const result = await serviceWithoutConfig.sendSMS('+5511999999999', 'Teste');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });

    it('deve tratar erro da API do Twilio', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          message: 'Invalid phone number',
          code: 21211
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(errorResponse);

      const result = await smsService.sendSMS('+5511999999999', 'Teste');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number');
    });

    it('deve tratar erro de rede', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await smsService.sendSMS('+5511999999999', 'Teste');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendOrdemServicoSMS', () => {
    const mockOrdemServico = {
      id: '1',
      numero_ordem: 'OS-001',
      cliente_id: '1',
      status: 'em_andamento',
      descricao_problema: 'Problema no iPhone',
      valor_total: 150.00,
      data_criacao: '2024-01-01',
      tecnico_responsavel: 'João'
    };

    const mockCliente = {
      id: '1',
      nome: 'Cliente Teste',
      telefone: '+5511999999999',
      email: 'teste@email.com'
    };

    beforeEach(() => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';
    });

    it('deve enviar SMS de criação de ordem de serviço', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          sid: 'test_message_id',
          status: 'sent'
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await smsService.sendOrdemServicoSMS(
        mockOrdemServico,
        mockCliente,
        'criacao'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('OS-001')
        })
      );
    });

    it('deve usar celular quando telefone não está disponível', async () => {
      const clienteSemTelefone = {
        ...mockCliente,
        telefone: undefined,
        celular: '+5511888888888'
      };

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          sid: 'test_message_id',
          status: 'sent'
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await smsService.sendOrdemServicoSMS(
        mockOrdemServico,
        clienteSemTelefone,
        'criacao'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('%2B5511888888888')
        })
      );
    });

    it('deve retornar erro quando cliente não tem telefone', async () => {
      const clienteSemTelefone = {
        ...mockCliente,
        telefone: undefined,
        celular: undefined
      };

      const result = await smsService.sendOrdemServicoSMS(
        mockOrdemServico,
        clienteSemTelefone,
        'criacao'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cliente não possui telefone cadastrado');
    });
  });

  describe('testConnection', () => {
    it('deve retornar sucesso quando conexão é bem-sucedida', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          account_sid: 'test_sid',
          status: 'active'
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await smsService.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Conexão com Twilio estabelecida');
    });

    it('deve retornar falha quando credenciais não estão configuradas', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      const serviceWithoutConfig = new SMSService();

      const result = await serviceWithoutConfig.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Configuração do Twilio incompleta');
    });

    it('deve retornar falha quando conexão falha', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await smsService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro de conexão: Network error');
    });
  });

  describe('templates estáticos', () => {
    it('deve ter template de bem-vindo', () => {
      const message = SMSService.templates.bemVindo('João');
      expect(message).toContain('Bem-vindo à InterAlpha, João');
    });

    it('deve ter template de lembrete de manutenção', () => {
      const message = SMSService.templates.lembreteManutencao('João', 'iPhone');
      expect(message).toContain('João');
      expect(message).toContain('iPhone');
    });

    it('deve ter template de promoção', () => {
      const message = SMSService.templates.promocao('João', '20%');
      expect(message).toContain('João');
      expect(message).toContain('20%');
    });

    it('deve ter template de agendamento', () => {
      const message = SMSService.templates.agendamento('João', '15/01/2024', '14:00');
      expect(message).toContain('João');
      expect(message).toContain('15/01/2024');
      expect(message).toContain('14:00');
    });
  });

  describe('instância exportada', () => {
    it('deve exportar uma instância do SMSService', () => {
      const { smsService } = require('@/lib/services/sms-service');
      expect(smsService).toBeInstanceOf(SMSService);
    });
  });
});