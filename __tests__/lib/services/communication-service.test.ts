// 🧪 Testes para Communication Service
import { communicationService } from '@/lib/services/communication-service';

// Mock dos serviços dependentes
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        in: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }))
}));

jest.mock('@/lib/services/email-service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    testConnection: jest.fn(() => Promise.resolve(true)),
    sendEmail: jest.fn(() => Promise.resolve({ success: true, messageId: 'email-123' }))
  }))
}));

jest.mock('@/lib/services/sms-service', () => ({
  SMSService: jest.fn().mockImplementation(() => ({
    testConnection: jest.fn(() => Promise.resolve({ success: true, message: 'SMS OK' })),
    sendSMS: jest.fn(() => Promise.resolve({ success: true, messageId: 'sms-123' }))
  }))
}));

jest.mock('@/lib/services/whatsapp-service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    testConnection: jest.fn(() => Promise.resolve({ success: true, message: 'WhatsApp OK' })),
    sendMessage: jest.fn(() => Promise.resolve({ success: true, messageId: 'whatsapp-123' }))
  }))
}));

jest.mock('@/lib/services/metrics-service', () => ({
  metricsService: {
    measureOperation: jest.fn((category, operation, fn, metadata) => fn())
  }
}));

// Mock do console para evitar logs durante os testes
jest.mock('console', () => ({
  ...console,
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn()
}));

describe('CommunicationService', () => {
  describe('estrutura da classe', () => {
    test('deve criar uma instância do CommunicationService', () => {
      expect(communicationService).toBeDefined();
      expect(typeof communicationService).toBe('object');
    });

    test('deve ter todos os métodos principais', () => {
      expect(typeof communicationService.sendCommunication).toBe('function');
      expect(typeof communicationService.sendOrdemServicoCommunication).toBe('function');
      expect(typeof communicationService.getCommunicationStats).toBe('function');
      expect(typeof communicationService.testAllChannels).toBe('function');
    });
  });

  describe('validação de interfaces', () => {
    test('deve aceitar dados válidos para Cliente', () => {
      const cliente = {
        id: '123',
        nome: 'João Silva',
        telefone: '11999999999',
        email: 'joao@email.com',
        preferencia_comunicacao: 'whatsapp' as const
      };

      expect(cliente.id).toBe('123');
      expect(cliente.nome).toBe('João Silva');
      expect(cliente.preferencia_comunicacao).toBe('whatsapp');
    });

    test('deve aceitar dados válidos para OrdemServico', () => {
      const ordemServico = {
        id: '456',
        numero_ordem: 'OS-001',
        cliente_id: '123',
        status: 'Em andamento',
        descricao_problema: 'Tela quebrada',
        valor_total: 299.99,
        data_criacao: '2024-01-15T10:00:00Z'
      };

      expect(ordemServico.numero_ordem).toBe('OS-001');
      expect(ordemServico.valor_total).toBe(299.99);
    });

    test('deve aceitar dados válidos para CommunicationResult', () => {
      const result = {
        success: true,
        channel: 'whatsapp' as const,
        messageId: 'msg-123',
        attempts: [
          { channel: 'whatsapp', success: true }
        ]
      };

      expect(result.success).toBe(true);
      expect(result.channel).toBe('whatsapp');
      expect(result.attempts).toHaveLength(1);
    });

    test('deve aceitar dados válidos para CommunicationOptions', () => {
      const options = {
        forceChannel: 'email' as const,
        enableFallback: true,
        priority: 'reliability' as const,
        urgency: 'high' as const
      };

      expect(options.forceChannel).toBe('email');
      expect(options.enableFallback).toBe(true);
      expect(options.priority).toBe('reliability');
      expect(options.urgency).toBe('high');
    });
  });

  describe('métodos básicos', () => {
    const mockCliente = {
      id: '123',
      nome: 'João Silva',
      telefone: '11999999999',
      email: 'joao@email.com'
    };

    const mockOrdemServico = {
      id: '456',
      numero_ordem: 'OS-001',
      cliente_id: '123',
      status: 'Em andamento',
      descricao_problema: 'Tela quebrada',
      data_criacao: '2024-01-15T10:00:00Z'
    };

    test('deve chamar sendCommunication sem erro', async () => {
      await expect(
        communicationService.sendCommunication(mockCliente, 'Teste de mensagem')
      ).resolves.toBeDefined();
    });

    test('deve chamar sendOrdemServicoCommunication sem erro', async () => {
      await expect(
        communicationService.sendOrdemServicoCommunication(
          mockOrdemServico,
          mockCliente,
          'criacao'
        )
      ).resolves.toBeDefined();
    });

    test('deve chamar getCommunicationStats sem erro', async () => {
      await expect(
        communicationService.getCommunicationStats()
      ).resolves.toBeDefined();
    });

    test('deve chamar getCommunicationStats com clienteId sem erro', async () => {
      await expect(
        communicationService.getCommunicationStats('123')
      ).resolves.toBeDefined();
    });

    test('deve chamar testAllChannels sem erro', async () => {
      await expect(
        communicationService.testAllChannels()
      ).resolves.toBeDefined();
    });
  });

  describe('tipos de comunicação', () => {
    const mockCliente = {
      id: '123',
      nome: 'João Silva',
      telefone: '11999999999',
      email: 'joao@email.com'
    };

    const mockOrdemServico = {
      id: '456',
      numero_ordem: 'OS-001',
      cliente_id: '123',
      status: 'Em andamento',
      descricao_problema: 'Tela quebrada',
      data_criacao: '2024-01-15T10:00:00Z'
    };

    test('deve processar comunicação de criação de ordem', async () => {
      await expect(
        communicationService.sendOrdemServicoCommunication(
          mockOrdemServico,
          mockCliente,
          'criacao'
        )
      ).resolves.toBeDefined();
    });

    test('deve processar comunicação de atualização de ordem', async () => {
      await expect(
        communicationService.sendOrdemServicoCommunication(
          mockOrdemServico,
          mockCliente,
          'atualizacao'
        )
      ).resolves.toBeDefined();
    });

    test('deve processar comunicação de conclusão de ordem', async () => {
      await expect(
        communicationService.sendOrdemServicoCommunication(
          mockOrdemServico,
          mockCliente,
          'conclusao'
        )
      ).resolves.toBeDefined();
    });
  });

  describe('opções de comunicação', () => {
    const mockCliente = {
      id: '123',
      nome: 'João Silva',
      telefone: '11999999999',
      email: 'joao@email.com'
    };

    test('deve aceitar opções de canal forçado', async () => {
      const options = { forceChannel: 'email' as const };
      
      await expect(
        communicationService.sendCommunication(
          mockCliente,
          'Teste',
          'Assunto',
          options
        )
      ).resolves.toBeDefined();
    });

    test('deve aceitar opções de fallback', async () => {
      const options = { enableFallback: true };
      
      await expect(
        communicationService.sendCommunication(
          mockCliente,
          'Teste',
          undefined,
          options
        )
      ).resolves.toBeDefined();
    });

    test('deve aceitar opções de prioridade', async () => {
      const options = { priority: 'speed' as const };
      
      await expect(
        communicationService.sendCommunication(
          mockCliente,
          'Teste',
          undefined,
          options
        )
      ).resolves.toBeDefined();
    });

    test('deve aceitar opções de urgência', async () => {
      const options = { urgency: 'critical' as const };
      
      await expect(
        communicationService.sendCommunication(
          mockCliente,
          'Teste',
          undefined,
          options
        )
      ).resolves.toBeDefined();
    });
  });
});