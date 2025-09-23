// 🧪 Testes para Communication Service
import { CommunicationService } from '../../lib/services/communication-service';

// Mock do Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      select: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
}));

// Mock do WhatsAppService (default export)
jest.mock('../../lib/services/whatsapp-service', () => {
  return jest.fn().mockImplementation(() => ({
    sendTextMessage: jest.fn().mockResolvedValue({ 
      messages: [{ id: 'whatsapp-123' }]
    }),
    testConnection: jest.fn().mockResolvedValue({ success: true, message: 'WhatsApp conectado' })
  }));
});

// Mock do SMSService (named export)
jest.mock('../../lib/services/sms-service', () => ({
  SMSService: jest.fn().mockImplementation(() => ({
    enviarSMS: jest.fn().mockResolvedValue({ 
      messageId: 'sms-123',
      message: 'SMS enviado com sucesso'
    }),
    testarConexao: jest.fn().mockResolvedValue({ success: true, message: 'SMS conectado' })
  }))
}));

// Mock do EmailService (default export)
jest.mock('../../lib/services/email-service', () => {
  return jest.fn().mockImplementation(() => ({
    enviarEmail: jest.fn().mockResolvedValue({ 
      messageId: 'email-123',
      message: 'Email enviado com sucesso'
    }),
    testConnection: jest.fn().mockResolvedValue(true)
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
    valor_total: 150.00,
    data_criacao: '2024-01-15',
    tecnico_responsavel: 'Carlos',
  };

  beforeEach(() => {
    service = new CommunicationService();
    jest.clearAllMocks();
  });

  describe('Seleção de Canal', () => {
    test('deve selecionar WhatsApp para urgência alta', () => {
      const channel = (service as any).selectOptimalChannel(mockCliente, { urgency: 'high' });
      expect(channel).toBe('whatsapp');
    });

    test('deve respeitar preferência do cliente', () => {
      const clienteComPreferencia = { ...mockCliente, preferencia_comunicacao: 'email' as const };
      const channel = (service as any).selectOptimalChannel(clienteComPreferencia);
      expect(channel).toBe('email');
    });

    test('deve usar canal forçado', () => {
      const channel = (service as any).selectOptimalChannel(mockCliente, { forceChannel: 'sms' });
      expect(channel).toBe('sms');
    });
  });

  describe('Geração de Conteúdo', () => {
    test('deve gerar conteúdo para WhatsApp', () => {
      const content = (service as any).generateWhatsAppContent(mockOrdemServico, 'João', 'criacao');
      
      expect(content.message).toContain('Nova Ordem de Serviço');
      expect(content.message).toContain('OS-001');
      expect(content.message).toContain('João');
    });

    test('deve gerar conteúdo para SMS', () => {
      const content = (service as any).generateSMSContent(mockOrdemServico, 'João', 'conclusao');
      
      expect(content.message).toContain('concluída');
      expect(content.message).toContain('OS-001');
      expect(content.message).toContain('João');
    });
  });

  describe('Validação de Contatos', () => {
    test('deve identificar cliente sem telefone', () => {
      const clienteSemTelefone = { ...mockCliente, telefone: undefined, celular: undefined };
      const channel = (service as any).selectOptimalChannel(clienteSemTelefone);
      expect(channel).toBe('email');
    });
  });

  describe('Templates de Mensagem', () => {
    test('deve incluir valor apenas na conclusão', () => {
      const contentCriacao = (service as any).generateWhatsAppContent(mockOrdemServico, 'João', 'criacao');
      const contentConclusao = (service as any).generateWhatsAppContent(mockOrdemServico, 'João', 'conclusao');

      expect(contentCriacao.message).not.toContain('R$ 150.00');
      expect(contentConclusao.message).toContain('R$ 150.00');
    });
  });
});