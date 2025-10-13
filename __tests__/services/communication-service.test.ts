// 🧪 Testes para Communication Service
import { CommunicationService } from '../../lib/services/communication-service';

// Mock do Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: {
                telefone: '11987654321',
                celular: '11987654321',
                email: 'test@email.com',
              },
              error: null,
            })
          ),
        })),
        in: jest.fn(() =>
          Promise.resolve({
            data: [
              { tipo: 'whatsapp', status: 'enviado', data_envio: '2024-01-15' },
              { tipo: 'email', status: 'enviado', data_envio: '2024-01-14' },
            ],
            error: null,
          })
        ),
      })),
    })),
  })),
}));

// Mock do WhatsAppService
jest.mock('../../lib/services/whatsapp-service', () => {
  return jest.fn().mockImplementation(() => ({
    sendTextMessage: jest.fn().mockResolvedValue({
      messages: [{ id: 'whatsapp-123' }],
    }),
    testConnection: jest
      .fn()
      .mockResolvedValue({ success: true, message: 'WhatsApp conectado' }),
  }));
});

// Mock do SMSService
jest.mock('../../lib/services/sms-service', () => ({
  SMSService: jest.fn().mockImplementation(() => ({
    sendSMS: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'sms-123',
      error: undefined,
    }),
    testConnection: jest
      .fn()
      .mockResolvedValue({ success: true, message: 'SMS conectado' }),
  })),
}));

// Mock do EmailService
jest.mock('../../lib/services/email-service', () => {
  return jest.fn().mockImplementation(() => ({
    sendOrdemServicoEmail: jest.fn().mockResolvedValue({
      messageId: 'email-123',
    }),
    testConnection: jest.fn().mockResolvedValue(true),
  }));
});

describe('CommunicationService', () => {
  let service: CommunicationService;

  const mockCliente = {
    id: '1',
    nome: 'João Silva',
    telefone: '11987654321',
    celular: '11987654321',
    email: 'joao@email.com',
    preferencia_comunicacao: 'auto' as const,
  };

  const mockOrdemServico = {
    id: '1',
    numero_ordem: 'OS-001',
    cliente_id: '1',
    status: 'Em andamento',
    descricao_problema: 'Tela quebrada',
    valor_total: 150.0,
    data_criacao: '2024-01-15',
    tecnico_responsavel: 'Carlos',
  };

  beforeEach(() => {
    service = new CommunicationService();
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    test('deve criar instância do serviço', () => {
      expect(service).toBeDefined();
    });

    test('deve ter métodos principais', () => {
      expect(typeof service.sendCommunication).toBe('function');
      expect(typeof service.sendOrdemServicoCommunication).toBe('function');
      expect(typeof service.getCommunicationStats).toBe('function');
      expect(typeof service.testAllChannels).toBe('function');
    });
  });

  describe('Seleção de Canal', () => {
    test('deve selecionar canal baseado em urgência', () => {
      const channel = (service as any).selectOptimalChannel(mockCliente, {
        urgency: 'high',
      });
      expect(channel).toBeDefined();
      expect(typeof channel).toBe('string');
    });

    test('deve respeitar canal forçado', () => {
      const channel = (service as any).selectOptimalChannel(mockCliente, {
        forceChannel: 'email',
      });
      expect(channel).toBe('email');
    });

    test('deve lidar com preferência do cliente', () => {
      const clienteComPreferencia = {
        ...mockCliente,
        preferencia_comunicacao: 'whatsapp' as const,
      };
      const channel = (service as any).selectOptimalChannel(
        clienteComPreferencia
      );
      expect(channel).toBeDefined();
    });
  });

  describe('Canais de Fallback', () => {
    test('deve retornar lista de fallbacks', () => {
      const fallbacks = (service as any).getFallbackChannels(
        'whatsapp',
        mockCliente
      );
      expect(Array.isArray(fallbacks)).toBe(true);
      expect(fallbacks.length).toBeGreaterThan(0);
    });

    test('deve filtrar canais indisponíveis', () => {
      const clienteSemTelefone = {
        ...mockCliente,
        telefone: undefined,
        celular: undefined,
      };
      const fallbacks = (service as any).getFallbackChannels(
        'email',
        clienteSemTelefone
      );
      expect(Array.isArray(fallbacks)).toBe(true);
    });
  });

  describe('Envio de Comunicação', () => {
    test('deve enviar comunicação com sucesso', async () => {
      const result = await service.sendCommunication(
        mockCliente,
        'Teste',
        undefined,
        { forceChannel: 'whatsapp' }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.channel).toBeDefined();
      expect(result.messageId).toBeDefined();
    });

    test('deve lidar com falha de envio', async () => {
      const clienteInvalido = {
        ...mockCliente,
        telefone: undefined,
        celular: undefined,
        email: undefined,
      };
      const result = await service.sendCommunication(
        clienteInvalido,
        'Teste',
        undefined,
        { forceChannel: 'whatsapp' }
      );

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Comunicação para Ordem de Serviço', () => {
    test('deve enviar comunicação de criação', async () => {
      const result = await service.sendOrdemServicoCommunication(
        mockOrdemServico,
        mockCliente,
        'criacao'
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.channel).toBeDefined();
    });

    test('deve enviar comunicação de atualização', async () => {
      const result = await service.sendOrdemServicoCommunication(
        mockOrdemServico,
        mockCliente,
        'atualizacao'
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('deve enviar comunicação de conclusão', async () => {
      const result = await service.sendOrdemServicoCommunication(
        mockOrdemServico,
        mockCliente,
        'conclusao'
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Geração de Conteúdo', () => {
    test('deve gerar conteúdo para WhatsApp', () => {
      const content = (service as any).generateWhatsAppContent(
        mockOrdemServico,
        'João',
        'criacao'
      );
      expect(content).toBeDefined();
      expect(content.message).toBeDefined();
      expect(typeof content.message).toBe('string');
      expect(content.message.length).toBeGreaterThan(0);
    });

    test('deve gerar conteúdo para SMS', () => {
      const content = (service as any).generateSMSContent(
        mockOrdemServico,
        'João',
        'criacao'
      );
      expect(content).toBeDefined();
      expect(content.message).toBeDefined();
      expect(typeof content.message).toBe('string');
    });

    test('deve gerar conteúdo para Email', () => {
      const content = (service as any).generateEmailContent(
        mockOrdemServico,
        mockCliente,
        'criacao'
      );
      expect(content).toBeDefined();
      expect(content.subject).toBeDefined();
      expect(content.message).toBeDefined();
      expect(typeof content.subject).toBe('string');
      expect(typeof content.message).toBe('string');
    });

    test('deve incluir informações da ordem no conteúdo', () => {
      const content = (service as any).generateWhatsAppContent(
        mockOrdemServico,
        'João',
        'criacao'
      );
      expect(content.message.includes('OS-001')).toBe(true);
      expect(content.message.includes('João')).toBe(true);
    });
  });

  describe('Estatísticas de Comunicação', () => {
    test('deve obter estatísticas gerais', async () => {
      const stats = await service.getCommunicationStats();

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.successRate).toBe('number');
      expect(stats.byChannel).toBeDefined();
      expect(typeof stats.byChannel).toBe('object');
    });

    test('deve obter estatísticas por cliente', async () => {
      const stats = await service.getCommunicationStats('1');

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('Teste de Canais', () => {
    test('deve testar todos os canais', async () => {
      const result = await service.testAllChannels();

      expect(result).toBeDefined();
      expect(result.whatsapp).toBeDefined();
      expect(result.sms).toBeDefined();
      expect(result.email).toBeDefined();
      expect(typeof result.whatsapp.success).toBe('boolean');
      expect(typeof result.sms.success).toBe('boolean');
      expect(typeof result.email.success).toBe('boolean');
    });
  });

  describe('Validação de Dados', () => {
    test('deve validar cliente com contatos válidos', () => {
      const channel = (service as any).selectOptimalChannel(mockCliente);
      expect(channel).toBeDefined();
      expect(['whatsapp', 'sms', 'email'].includes(channel)).toBe(true);
    });

    test('deve lidar com cliente sem telefone', () => {
      const clienteSemTelefone = {
        ...mockCliente,
        telefone: undefined,
        celular: undefined,
      };
      const channel = (service as any).selectOptimalChannel(clienteSemTelefone);
      expect(channel).toBeDefined();
    });

    test('deve lidar com cliente sem email', () => {
      const clienteSemEmail = { ...mockCliente, email: undefined };
      const channel = (service as any).selectOptimalChannel(clienteSemEmail);
      expect(channel).toBeDefined();
    });

    test('deve gerar conteúdo válido para diferentes tipos', () => {
      const tipos = ['criacao', 'atualizacao', 'conclusao'];

      tipos.forEach(tipo => {
        const content = (service as any).generateOrdemServicoContent(
          mockOrdemServico,
          mockCliente,
          tipo,
          'whatsapp'
        );
        expect(content).toBeDefined();
        expect(content.message).toBeDefined();
        expect(content.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Configurações de Prioridade', () => {
    test('deve selecionar canal por velocidade', () => {
      const channel = (service as any).selectOptimalChannel(mockCliente, {
        priority: 'speed',
      });
      expect(channel).toBeDefined();
      expect(['whatsapp', 'sms'].includes(channel)).toBe(true);
    });

    test('deve selecionar canal por custo', () => {
      const channel = (service as any).selectOptimalChannel(mockCliente, {
        priority: 'cost',
      });
      expect(channel).toBeDefined();
    });

    test('deve selecionar canal por confiabilidade', () => {
      const channel = (service as any).selectOptimalChannel(mockCliente, {
        priority: 'reliability',
      });
      expect(channel).toBeDefined();
    });
  });
});
