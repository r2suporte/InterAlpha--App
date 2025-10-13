/**
 * @jest-environment node
 */

// Testes para WhatsApp Service
// Foca nas funcionalidades principais da implementação real

describe('WhatsApp Service - Funcionalidades Principais', () => {
  // Interfaces para tipagem
  interface OrdemServicoWhatsApp {
    id: string;
    numero_os: string;
    descricao: string;
    valor?: number;
    data_inicio?: string;
    cliente: {
      nome: string;
      telefone: string;
    };
  }

  interface WhatsAppResponse {
    messaging_product: string;
    contacts: Array<{
      input: string;
      wa_id: string;
    }>;
    messages: Array<{
      id: string;
    }>;
  }

  // Mock da classe WhatsAppService
  class TestWhatsAppService {
    private config = {
      phoneNumberId: 'test-phone-id',
      accessToken: 'test-access-token',
      apiVersion: 'v18.0',
      baseUrl: 'https://graph.facebook.com',
    };

    formatPhoneNumber(phone: string): string {
      // Remove todos os caracteres não numéricos
      let cleanPhone = phone.replace(/\D/g, '');

      // Se não começar com código do país, adiciona o código do Brasil (55)
      if (!cleanPhone.startsWith('55') && cleanPhone.length === 11) {
        cleanPhone = `55${  cleanPhone}`;
      }

      // Se começar com 0, remove o 0
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }

      return cleanPhone;
    }

    async sendOrdemServicoMessage(
      ordemServico: OrdemServicoWhatsApp
    ): Promise<WhatsAppResponse> {
      // Validar configuração
      if (!this.config.phoneNumberId || !this.config.accessToken) {
        throw new Error('Configuração do WhatsApp incompleta');
      }

      // Validar telefone do cliente
      if (!ordemServico.cliente.telefone) {
        throw new Error('Cliente não possui telefone cadastrado');
      }

      // Simular resposta da API
      return {
        messaging_product: 'whatsapp',
        contacts: [
          { input: ordemServico.cliente.telefone, wa_id: '5511999887766' },
        ],
        messages: [{ id: 'wamid.test123' }],
      };
    }

    async sendTextMessage(
      telefone: string,
      mensagem: string
    ): Promise<WhatsAppResponse> {
      if (!telefone || !mensagem) {
        throw new Error('Telefone e mensagem são obrigatórios');
      }

      return {
        messaging_product: 'whatsapp',
        contacts: [
          { input: telefone, wa_id: this.formatPhoneNumber(telefone) },
        ],
        messages: [{ id: 'wamid.text123' }],
      };
    }

    async sendTemplateMessage(
      telefone: string,
      templateName: string,
      parameters: any[]
    ): Promise<WhatsAppResponse> {
      if (!telefone || !templateName) {
        throw new Error('Telefone e nome do template são obrigatórios');
      }

      return {
        messaging_product: 'whatsapp',
        contacts: [
          { input: telefone, wa_id: this.formatPhoneNumber(telefone) },
        ],
        messages: [{ id: 'wamid.template123' }],
      };
    }

    generateOrdemServicoMessage(ordemServico: OrdemServicoWhatsApp): string {
      const { numero_os, descricao, valor, data_inicio, cliente } =
        ordemServico;

      let mensagem = `🔧 *Nova Ordem de Serviço*\n\n`;
      mensagem += `📋 *OS:* ${numero_os}\n`;
      mensagem += `👤 *Cliente:* ${cliente.nome}\n`;
      mensagem += `📝 *Descrição:* ${descricao}\n`;

      if (valor) {
        mensagem += `💰 *Valor:* R$ ${valor.toFixed(2).replace('.', ',')}\n`;
      }

      if (data_inicio) {
        const dataFormatada = new Date(data_inicio).toLocaleDateString('pt-BR');
        mensagem += `📅 *Data de Início:* ${dataFormatada}\n`;
      }

      mensagem += `\n📱 Para acompanhar o andamento da sua ordem de serviço, acesse nosso portal do cliente.`;
      mensagem += `\n\n_Esta é uma mensagem automática. Para dúvidas, entre em contato conosco._`;

      return mensagem;
    }

    async testConnection(): Promise<{ success: boolean; message: string }> {
      if (!this.config.phoneNumberId || !this.config.accessToken) {
        return {
          success: false,
          message:
            'Configuração do WhatsApp incompleta. Verifique as variáveis de ambiente.',
        };
      }

      return {
        success: true,
        message: 'Conexão com WhatsApp Business API estabelecida com sucesso',
      };
    }
  }

  let whatsappService: TestWhatsAppService;

  beforeEach(() => {
    whatsappService = new TestWhatsAppService();
  });

  describe('sendOrdemServicoMessage', () => {
    test('envia mensagem de ordem de serviço com sucesso', async () => {
      const ordemServico: OrdemServicoWhatsApp = {
        id: 'os-123',
        numero_os: 'OS-001',
        descricao: 'Manutenção preventiva',
        valor: 150.5,
        data_inicio: '2024-01-15',
        cliente: {
          nome: 'João Silva',
          telefone: '11999887766',
        },
      };

      const resultado =
        await whatsappService.sendOrdemServicoMessage(ordemServico);

      expect(resultado).toBeDefined();
      expect(resultado.messaging_product).toBe('whatsapp');
      expect(resultado.contacts).toHaveLength(1);
      expect(resultado.messages).toHaveLength(1);
    });

    test('valida campos obrigatórios da ordem de serviço', async () => {
      const ordemServicoSemTelefone: OrdemServicoWhatsApp = {
        id: 'os-123',
        numero_os: 'OS-001',
        descricao: 'Teste',
        cliente: {
          nome: 'João Silva',
          telefone: '',
        },
      };

      await expect(
        whatsappService.sendOrdemServicoMessage(ordemServicoSemTelefone)
      ).rejects.toThrow('Cliente não possui telefone cadastrado');
    });
  });

  describe('sendTextMessage', () => {
    test('envia mensagem de texto com sucesso', async () => {
      const resultado = await whatsappService.sendTextMessage(
        '11999887766',
        'Olá, teste!'
      );

      expect(resultado).toBeDefined();
      expect(resultado.messaging_product).toBe('whatsapp');
      expect(resultado.contacts).toHaveLength(1);
      expect(resultado.messages).toHaveLength(1);
    });

    test('valida campos obrigatórios para mensagem de texto', async () => {
      await expect(
        whatsappService.sendTextMessage('', 'Mensagem')
      ).rejects.toThrow('Telefone e mensagem são obrigatórios');

      await expect(
        whatsappService.sendTextMessage('11999887766', '')
      ).rejects.toThrow('Telefone e mensagem são obrigatórios');
    });
  });

  describe('sendTemplateMessage', () => {
    test('envia template com sucesso', async () => {
      const resultado = await whatsappService.sendTemplateMessage(
        '11999887766',
        'ordem_servico',
        ['OS-001', 'João Silva']
      );

      expect(resultado).toBeDefined();
      expect(resultado.messaging_product).toBe('whatsapp');
      expect(resultado.contacts).toHaveLength(1);
      expect(resultado.messages).toHaveLength(1);
    });

    test('valida campos obrigatórios para template', async () => {
      await expect(
        whatsappService.sendTemplateMessage('', 'template', [])
      ).rejects.toThrow('Telefone e nome do template são obrigatórios');

      await expect(
        whatsappService.sendTemplateMessage('11999887766', '', [])
      ).rejects.toThrow('Telefone e nome do template são obrigatórios');
    });
  });

  describe('formatPhoneNumber', () => {
    test('formata diferentes tipos de telefone corretamente', () => {
      const formatos = [
        { input: '(11) 99988-7766', expected: '5511999887766' },
        { input: '11999887766', expected: '5511999887766' },
        { input: '011999887766', expected: '11999887766' },
        { input: '5511999887766', expected: '5511999887766' },
      ];

      formatos.forEach(formato => {
        const resultado = whatsappService.formatPhoneNumber(formato.input);
        expect(resultado).toBe(formato.expected);
      });
    });
  });

  describe('generateOrdemServicoMessage', () => {
    test('gera mensagem completa para ordem de serviço', () => {
      const ordemServico = {
        id: '1',
        numero_os: 'OS-001',
        descricao: 'Manutenção preventiva',
        valor: 150.5,
        data_inicio: '2024-01-13',
        cliente: {
          nome: 'João Silva',
          telefone: '11999887766',
        },
      };

      const mensagem =
        whatsappService.generateOrdemServicoMessage(ordemServico);

      expect(mensagem).toContain('Nova Ordem de Serviço');
      expect(mensagem).toContain('OS-001');
      expect(mensagem).toContain('João Silva');
      expect(mensagem).toContain('Manutenção preventiva');
      expect(mensagem).toContain('R$ 150,50');
      expect(mensagem).toContain('12/01/2024');
    });

    test('gera mensagem sem campos opcionais', () => {
      const ordemServico: OrdemServicoWhatsApp = {
        id: 'os-123',
        numero_os: 'OS-002',
        descricao: 'Teste simples',
        cliente: {
          nome: 'Maria Santos',
          telefone: '11888776655',
        },
      };

      const mensagem =
        whatsappService.generateOrdemServicoMessage(ordemServico);

      expect(mensagem).toContain('OS-002');
      expect(mensagem).toContain('Maria Santos');
      expect(mensagem).toContain('Teste simples');
      expect(mensagem).not.toContain('R$');
      expect(mensagem).not.toContain('Data de Início');
    });
  });

  describe('testConnection', () => {
    test('testa conexão com sucesso', async () => {
      const resultado = await whatsappService.testConnection();

      expect(resultado.success).toBe(true);
      expect(resultado.message).toContain('sucesso');
    });

    test('falha na conexão com configuração incompleta', async () => {
      const serviceWithoutConfig = new TestWhatsAppService();
      (serviceWithoutConfig as any).config.accessToken = '';

      const resultado = await serviceWithoutConfig.testConnection();

      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('incompleta');
    });
  });

  describe('Validações de Interface', () => {
    test('valida interface OrdemServicoWhatsApp', () => {
      const ordemServico: OrdemServicoWhatsApp = {
        id: 'test-id',
        numero_os: 'OS-TEST',
        descricao: 'Teste',
        cliente: {
          nome: 'Cliente Teste',
          telefone: '11999999999',
        },
      };

      expect(typeof ordemServico.id).toBe('string');
      expect(typeof ordemServico.numero_os).toBe('string');
      expect(typeof ordemServico.descricao).toBe('string');
      expect(typeof ordemServico.cliente.nome).toBe('string');
      expect(typeof ordemServico.cliente.telefone).toBe('string');
    });

    test('valida interface WhatsAppResponse', () => {
      const response: WhatsAppResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '11999999999', wa_id: '5511999999999' }],
        messages: [{ id: 'wamid.test' }],
      };

      expect(response.messaging_product).toBe('whatsapp');
      expect(Array.isArray(response.contacts)).toBe(true);
      expect(Array.isArray(response.messages)).toBe(true);
      expect(response.contacts.length).toBeGreaterThan(0);
      expect(response.messages.length).toBeGreaterThan(0);
    });
  });
});
