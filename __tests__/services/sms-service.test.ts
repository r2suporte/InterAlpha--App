// 📱 Testes para SMS Service - Twilio Integration
import { SMSService } from '@/lib/services/sms-service';

// Mock do fetch global
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock das variáveis de ambiente
const mockEnv = {
  TWILIO_ACCOUNT_SID: 'test_account_sid',
  TWILIO_AUTH_TOKEN: 'test_auth_token',
  TWILIO_PHONE_NUMBER: '+5511999999999'
};

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

describe('SMSService', () => {
  let smsService: SMSService;
  let originalEnv: NodeJS.ProcessEnv;
  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    originalEnv = process.env;
  });

  beforeEach(() => {
    // Configurar variáveis de ambiente para testes
    process.env = { ...originalEnv, ...mockEnv };
    smsService = new SMSService();
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  describe('Configuração e Inicialização', () => {
    it('deve inicializar com configuração válida', () => {
      expect(smsService).toBeInstanceOf(SMSService);
    });

    it('deve validar configuração incompleta', () => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      process.env.TWILIO_ACCOUNT_SID = '';
      
      new SMSService();
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ SMS Service: Configuração incompleta do Twilio');
      consoleSpy.mockRestore();
    });
  });

  describe('Formatação de Número de Telefone', () => {
    it('deve formatar número brasileiro com 11 dígitos', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await smsService.sendSMS('11993804816', 'Teste');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.twilio.com'),
        expect.objectContaining({
          body: expect.stringContaining('To=%2B5511993804816')
        })
      );
    });

    it('deve formatar número com máscara', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await smsService.sendSMS('(11) 99380-4816', 'Teste');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.twilio.com'),
        expect.objectContaining({
          body: expect.stringContaining('To=%2B5511993804816')
        })
      );
    });

    it('deve manter número já formatado', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await smsService.sendSMS('+5511993804816', 'Teste');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.twilio.com'),
        expect.objectContaining({
          body: expect.stringContaining('To=%2B5511993804816')
        })
      );
    });
  });

  describe('Envio de SMS Simples', () => {
    it('deve formatar número de telefone corretamente', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await smsService.sendSMS('11999999999', 'Mensagem teste');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.twilio.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          }),
          body: expect.stringContaining('To=%2B5511999999999')
        })
      );
    });

    it('deve enviar SMS com sucesso', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await smsService.sendSMS('+5511993804816', 'Mensagem de teste');

      expect(result).toEqual({
        success: true,
        messageId: 'SM123456789',
        provider: 'twilio'
      });
    });

    it('deve tratar erro de autenticação', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Authentication Error - invalid username' })
      } as Response);

      const result = await smsService.sendSMS('+5511993804816', 'Teste');

      expect(result).toEqual({
        success: false,
        error: 'Authentication Error - invalid username',
        provider: 'twilio'
      });
    });

    it('deve tratar erro de rede', async () => {
      mockFetch.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await smsService.sendSMS('+5511993804816', 'Teste');

      expect(result).toEqual({
        success: false,
        error: 'Network error',
        provider: 'twilio'
      });
    });

    it('deve tratar número vazio graciosamente', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Invalid phone number'));

      const result = await smsService.sendSMS('', 'Mensagem teste');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number');
      expect(result.provider).toBe('twilio');
    });
  });

  describe('SMS para Ordem de Serviço', () => {
    const mockOrdemServico = {
      id: '123',
      numero_ordem: 'OS-001',
      cliente_id: 'cliente-123',
      status: 'em_andamento',
      descricao_problema: 'Tela quebrada',
      valor_total: 350.00,
      data_criacao: '2024-01-15T10:00:00Z',
      tecnico_responsavel: 'João Silva'
    };

    const mockCliente = {
      id: 'cliente-123',
      nome: 'Maria Santos',
      telefone: '1133334444',
      celular: '11993804816',
      email: 'maria@email.com'
    };

    it('deve enviar SMS de criação de ordem', async () => {
      const mockResponse = {
        sid: 'SM987654321',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await smsService.sendOrdemServicoSMS(
        mockOrdemServico,
        mockCliente,
        'criacao'
      );

      expect(result).toEqual({
        success: true,
        messageId: 'SM987654321',
        provider: 'twilio'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.twilio.com'),
        expect.objectContaining({
          body: expect.stringContaining('Body=')
        })
      );
    });

    it('deve enviar SMS de atualização de ordem', async () => {
      const mockResponse = {
        sid: 'SM987654322',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await smsService.sendOrdemServicoSMS(
        mockOrdemServico,
        mockCliente,
        'atualizacao'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM987654322');
    });

    it('deve enviar SMS de conclusão de ordem', async () => {
      const mockOrdemConcluida = {
        ...mockOrdemServico,
        status: 'concluida',
        data_conclusao: '2024-01-16T15:30:00Z'
      };

      const mockResponse = {
        sid: 'SM987654323',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await smsService.sendOrdemServicoSMS(
        mockOrdemConcluida,
        mockCliente,
        'conclusao'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM987654323');
    });

    it('deve usar celular se telefone não disponível', async () => {
      const clienteSemTelefone = {
        ...mockCliente,
        telefone: undefined
      };

      const mockResponse = {
        sid: 'SM987654324',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await smsService.sendOrdemServicoSMS(
        mockOrdemServico,
        clienteSemTelefone,
        'criacao'
      );

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.twilio.com'),
        expect.objectContaining({
          body: expect.stringContaining('To=%2B5511993804816')
        })
      );
    });

    it('deve retornar erro se cliente não tem telefone', async () => {
      const clienteSemContato = {
        ...mockCliente,
        telefone: undefined,
        celular: undefined
      };

      const result = await smsService.sendOrdemServicoSMS(
        mockOrdemServico,
        clienteSemContato,
        'criacao'
      );

      expect(result).toEqual({
        success: false,
        error: 'Cliente não possui telefone cadastrado',
        provider: 'twilio'
      });
    });
  });

  describe('Teste de Conexão', () => {
    it('deve testar conexão com sucesso', async () => {
      const mockResponse = {
        account_sid: 'test_account_sid',
        status: 'active'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await smsService.testConnection();

      expect(result).toEqual({
        success: true,
        message: 'Conexão com Twilio estabelecida com sucesso'
      });
    });

    it('deve tratar falha na conexão', async () => {
      mockFetch.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await smsService.testConnection();

      expect(result).toEqual({
        success: false,
        message: 'Erro de conexão: Network error'
      });
    });
  });

  describe('Templates de SMS', () => {
    it('deve ter template de boas-vindas', () => {
      const message = SMSService.templates.bemVindo('João');
      expect(message).toContain('João');
      expect(message).toContain('InterAlpha');
    });

    it('deve ter template de lembrete de manutenção', () => {
      const message = SMSService.templates.lembreteManutencao('Maria', 'iPhone');
      expect(message).toContain('Maria');
      expect(message).toContain('iPhone');
    });

    it('deve ter template de promoção', () => {
      const message = SMSService.templates.promocao('Carlos', '20%');
      expect(message).toContain('Carlos');
      expect(message).toContain('20%');
    });

    it('deve ter template de agendamento', () => {
      const message = SMSService.templates.agendamento('Ana', '15/01/2024', '14:30');
      expect(message).toContain('Ana');
      expect(message).toContain('15/01/2024');
      expect(message).toContain('14:30');
    });
  });

  describe('Integração com Número de Teste', () => {
    const numeroTeste = '11993804816'; // Número fornecido pelo usuário

    it('deve formatar corretamente o número de teste', async () => {
      const mockResponse = {
        sid: 'SM_TEST_123',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await smsService.sendSMS(numeroTeste, 'Teste de integração');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.twilio.com'),
        expect.objectContaining({
          body: expect.stringContaining('To=%2B5511993804816')
        })
      );
    });

    it('deve enviar SMS de teste com template', async () => {
      const mockResponse = {
        sid: 'SM_TEST_124',
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const mensagem = SMSService.templates.bemVindo('Usuário Teste');
      const result = await smsService.sendSMS(numeroTeste, mensagem);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM_TEST_124');
    });
  });
});