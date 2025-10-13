import WhatsAppService, { whatsappService } from '@/lib/services/whatsapp-service';

// Mock do Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null }))
    }))
  }))
}));

// Mock do fetch global
global.fetch = jest.fn();

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Configurar variáveis de ambiente para testes
    process.env.WA_PHONE_NUMBER_ID = '123456789';
    process.env.CLOUD_API_ACCESS_TOKEN = 'test_token';
    process.env.CLOUD_API_VERSION = 'v18.0';
    process.env.WA_BASE_URL = 'https://graph.facebook.com';

    service = new WhatsAppService();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Reset do mock do fetch
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('constructor e inicialização', () => {
    it('deve criar uma instância do WhatsAppService', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(WhatsAppService);
    });

    it('deve configurar credenciais a partir das variáveis de ambiente', () => {
      const newService = new WhatsAppService();
      expect(newService).toBeDefined();
    });
  });

  describe('sendOrdemServicoMessage', () => {
    const mockOrdemServico = {
      id: 'os-123',
      numero_os: 'OS-2024-001',
      descricao: 'Reparo em iPhone',
      valor: 150.50,
      data_inicio: '2024-01-15',
      cliente: {
        nome: 'João Silva',
        telefone: '11999999999'
      }
    };

    it('deve enviar mensagem de ordem de serviço com sucesso', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999999999', wa_id: '5511999999999' }],
        messages: [{ id: 'wamid.123' }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.sendOrdemServicoMessage(mockOrdemServico);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('deve formatar número de telefone corretamente', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999999999', wa_id: '5511999999999' }],
        messages: [{ id: 'wamid.123' }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.sendOrdemServicoMessage(mockOrdemServico);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.to).toBe('5511999999999');
    });

    it('deve retornar erro quando credenciais não estão configuradas', async () => {
      delete process.env.WA_PHONE_NUMBER_ID;
      const serviceWithoutConfig = new WhatsAppService();

      await expect(
        serviceWithoutConfig.sendOrdemServicoMessage(mockOrdemServico)
      ).rejects.toThrow('Configuração do WhatsApp incompleta');
    });

    it('deve retornar erro quando cliente não tem telefone', async () => {
      const ordemSemTelefone = {
        ...mockOrdemServico,
        cliente: { ...mockOrdemServico.cliente, telefone: '' }
      };

      await expect(
        service.sendOrdemServicoMessage(ordemSemTelefone)
      ).rejects.toThrow('Cliente não possui telefone cadastrado');
    });

    it('deve tratar erro da API do WhatsApp', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          error: { message: 'Invalid phone number' }
        })
      };

      (global.fetch as jest.Mock).mockResolvedValue(errorResponse);

      await expect(
        service.sendOrdemServicoMessage(mockOrdemServico)
      ).rejects.toThrow('WhatsApp API Error: Invalid phone number');
    });
  });

  describe('sendTextMessage', () => {
    it('deve enviar mensagem de texto simples', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999999999', wa_id: '5511999999999' }],
        messages: [{ id: 'wamid.123' }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.sendTextMessage('11999999999', 'Olá, teste!');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"text":{"body":"Olá, teste!"}')
        })
      );
    });
  });

  describe('sendTemplateMessage', () => {
    it('deve enviar mensagem usando template', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999999999', wa_id: '5511999999999' }],
        messages: [{ id: 'wamid.123' }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.sendTemplateMessage(
        '11999999999',
        'hello_world',
        [{ type: 'body', parameters: [{ type: 'text', text: 'João' }] }]
      );

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"template":{"name":"hello_world"')
        })
      );
    });
  });

  describe('formatPhoneNumber', () => {
    it('deve formatar números brasileiros corretamente', () => {
      // Acessar método privado através de reflexão para teste
      const formatPhoneNumber = (service as any).formatPhoneNumber.bind(service);
      
      expect(formatPhoneNumber('(11) 99999-9999')).toBe('5511999999999');
      expect(formatPhoneNumber('11999999999')).toBe('5511999999999');
      expect(formatPhoneNumber('5511999999999')).toBe('5511999999999');
      expect(formatPhoneNumber('011999999999')).toBe('11999999999');
    });
  });

  describe('generateOrdemServicoMessage', () => {
    it('deve gerar mensagem formatada corretamente', () => {
      const mockOrdemServico = {
        id: 'os-123',
        numero_os: 'OS-2024-001',
        descricao: 'Reparo em iPhone',
        valor: 150.50,
        data_inicio: '2024-01-15',
        cliente: {
          nome: 'João Silva',
          telefone: '11999999999'
        }
      };

      // Acessar método privado através de reflexão para teste
      const generateMessage = (service as any).generateOrdemServicoMessage.bind(service);
      const mensagem = generateMessage(mockOrdemServico);

      expect(mensagem).toContain('🔧 *Nova Ordem de Serviço*');
      expect(mensagem).toContain('OS-2024-001');
      expect(mensagem).toContain('João Silva');
      expect(mensagem).toContain('Reparo em iPhone');
      expect(mensagem).toContain('R$ 150,50');
      expect(mensagem).toContain('14/01/2024');
    });

    it('deve gerar mensagem sem valor quando não informado', () => {
      const mockOrdemServico = {
        id: 'os-123',
        numero_os: 'OS-2024-001',
        descricao: 'Reparo em iPhone',
        cliente: {
          nome: 'João Silva',
          telefone: '11999999999'
        }
      };

      const generateMessage = (service as any).generateOrdemServicoMessage.bind(service);
      const mensagem = generateMessage(mockOrdemServico);

      expect(mensagem).not.toContain('💰 *Valor:*');
    });
  });

  describe('testConnection', () => {
    it('deve retornar sucesso quando conexão é bem-sucedida', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      const result = await service.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
    });

    it('deve retornar falha quando credenciais não estão configuradas', async () => {
      delete process.env.WA_PHONE_NUMBER_ID;
      const serviceWithoutConfig = new WhatsAppService();

      const result = await serviceWithoutConfig.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Configuração do WhatsApp incompleta');
    });

    it('deve retornar falha quando API retorna erro', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error: { message: 'Invalid access token' }
        })
      });

      const result = await service.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid access token');
    });

    it('deve retornar falha quando há erro de conexão', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('instância exportada', () => {
    it('deve exportar uma instância do WhatsAppService', () => {
      expect(whatsappService).toBeDefined();
      expect(whatsappService).toBeInstanceOf(WhatsAppService);
    });
  });
});