/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';

// Mock do fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock do Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock das variáveis de ambiente
process.env.WA_PHONE_NUMBER_ID = 'test_phone_id';
process.env.CLOUD_API_ACCESS_TOKEN = 'test_token';
process.env.CLOUD_API_VERSION = 'v18.0';

describe('WhatsApp Service Integration Tests', () => {
  let WhatsAppService: any;
  let whatsappService: any;

  beforeAll(async () => {
    // Importa o serviço após configurar os mocks
    const module = await import('../../../lib/services/whatsapp-service');
    WhatsAppService = module.default;
    whatsappService = module.whatsappService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Configuração do Serviço', () => {
    it('deve inicializar com configurações corretas', () => {
      const service = new WhatsAppService();
      expect(service).toBeDefined();
    });
  });

  describe('formatPhoneNumber', () => {
    it('deve formatar números brasileiros corretamente', () => {
      const service = new WhatsAppService();
      
      expect(service.formatPhoneNumber('11999887766')).toBe('5511999887766');
      expect(service.formatPhoneNumber('(11) 99988-7766')).toBe('5511999887766');
      expect(service.formatPhoneNumber('+55 11 99988-7766')).toBe('5511999887766');
      expect(service.formatPhoneNumber('5511999887766')).toBe('5511999887766');
    });
  });

  describe('generateOrdemServicoMessage', () => {
    it('deve gerar mensagem completa para ordem de serviço', () => {
      const service = new WhatsAppService();
      const ordemServico = {
        id: '123',
        numero_os: 'OS-001',
        descricao: 'Reparo de iPhone',
        valor: 150.50,
        data_inicio: '2024-01-15',
        cliente: {
          nome: 'João Silva',
          telefone: '11999887766'
        }
      };

      const mensagem = service.generateOrdemServicoMessage(ordemServico);
      
      expect(mensagem).toContain('OS-001');
      expect(mensagem).toContain('João Silva');
      expect(mensagem).toContain('Reparo de iPhone');
      expect(mensagem).toContain('R$ 150,50');
    });
  });

  describe('sendTextMessage', () => {
    it('deve enviar mensagem de texto com sucesso', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999887766', wa_id: '5511999887766' }],
        messages: [{ id: 'msg_123' }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const resultado = await whatsappService.sendTextMessage('11999887766', 'Teste de mensagem');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json'
          })
        })
      );

      expect(resultado).toEqual(mockResponse);
    });

    it('deve tratar erro na API do WhatsApp', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: 'Bad Request' } }),
        statusText: 'Bad Request'
      });

      await expect(
        whatsappService.sendTextMessage('11999887766', 'Teste')
      ).rejects.toThrow('WhatsApp API Error');
    });
  });

  describe('sendOrdemServicoMessage', () => {
    it('deve enviar mensagem de ordem de serviço com sucesso', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '5511999887766', wa_id: '5511999887766' }],
        messages: [{ id: 'msg_os_123' }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const ordemServico = {
        id: '123',
        numero_os: 'OS-001',
        descricao: 'Reparo de iPhone',
        valor: 150.50,
        cliente: {
          nome: 'João Silva',
          telefone: '11999887766'
        }
      };

      const resultado = await whatsappService.sendOrdemServicoMessage(ordemServico);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('comunicacoes_cliente');
      expect(resultado).toEqual(mockResponse);
    });

    it('deve validar telefone do cliente', async () => {
      const ordemSemTelefone = {
        id: '123',
        numero_os: 'OS-001',
        descricao: 'Teste',
        cliente: {
          nome: 'Teste',
          telefone: ''
        }
      };

      await expect(
        whatsappService.sendOrdemServicoMessage(ordemSemTelefone)
      ).rejects.toThrow('Cliente não possui telefone cadastrado');
    });
  });

  describe('testConnection', () => {
    it('deve retornar sucesso quando conexão está ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const resultado = await whatsappService.testConnection();

      expect(resultado.success).toBe(true);
      expect(resultado.message).toContain('sucesso');
    });

    it('deve retornar erro quando conexão falha', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const resultado = await whatsappService.testConnection();

      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('Erro de conexão');
    });
  });
});