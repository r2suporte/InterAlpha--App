import EmailService, { emailService } from '@/lib/services/email-service';

// Mock do nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

// Mock do Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock do metrics service
jest.mock('@/lib/services/metrics-service', () => ({
  metricsService: {
    measureOperation: jest.fn((category, operation, fn, metadata) => fn()),
  },
}));

describe('EmailService', () => {
  const mockTransporter = {
    sendMail: jest.fn(),
    verify: jest.fn(),
  };

  const mockSupabaseClient = {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  };

  const originalEnv = process.env;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    console.warn = jest.fn();
    console.error = jest.fn();

    const nodemailer = require('nodemailer');
    nodemailer.createTransport.mockReturnValue(mockTransporter);

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabaseClient);
  });

  afterEach(() => {
    process.env = originalEnv;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('constructor e inicialização', () => {
    it('deve criar uma instância do EmailService', () => {
      const service = new EmailService();
      expect(service).toBeDefined();
    });

    it('deve mostrar aviso quando credenciais SMTP não estão configuradas', () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      
      new EmailService();
      
      expect(console.warn).toHaveBeenCalledWith(
        'Configurações SMTP não encontradas. Email não será enviado.'
      );
    });

    it('deve configurar transporter quando credenciais estão disponíveis', () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_SECURE = 'true';
      process.env.SMTP_USER = 'test@test.com';
      process.env.SMTP_PASS = 'password';

      const nodemailer = require('nodemailer');
      
      new EmailService();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: true,
        auth: {
          user: 'test@test.com',
          pass: 'password',
        },
      });
    });
  });

  describe('sendOrdemServicoEmail', () => {
    const mockOrdemServico = {
      id: 'os-123',
      numero_os: 'OS-001',
      descricao: 'Manutenção preventiva',
      valor: 150.00,
      data_inicio: '2024-01-15',
      cliente: {
        nome: 'João Silva',
        email: 'joao@test.com',
        telefone: '11999999999',
      },
      equipamento: {
        marca: 'Dell',
        modelo: 'Inspiron',
        numero_serie: 'ABC123',
      },
    };

    beforeEach(() => {
      process.env.SMTP_USER = 'test@test.com';
      process.env.SMTP_PASS = 'password';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.test.com';
    });

    it('deve enviar email de ordem de serviço com sucesso', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });

      const service = new EmailService();
      const result = await service.sendOrdemServicoEmail(mockOrdemServico);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"InterAlpha" <test@test.com>',
        to: 'joao@test.com',
        subject: 'Nova Ordem de Serviço #OS-001 - InterAlpha',
        html: expect.stringContaining('João Silva'),
      });

      expect(result).toEqual({ messageId: 'msg-123' });
    });

    it('deve incluir credenciais de login no email quando fornecidas', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });

      const service = new EmailService();
      const loginCredentials = { login: 'joao.silva', senha: 'temp123' };
      
      await service.sendOrdemServicoEmail(mockOrdemServico, loginCredentials);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('joao.silva');
      expect(emailCall.html).toContain('temp123');
      expect(emailCall.html).toContain('Acesso ao Portal do Cliente');
    });

    it('deve registrar comunicação no banco após envio bem-sucedido', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });

      const service = new EmailService();
      await service.sendOrdemServicoEmail(mockOrdemServico);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('comunicacoes_cliente');
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente_portal_id: 'os-123',
          ordem_servico_id: 'os-123',
          tipo: 'email',
          destinatario: 'joao@test.com',
          status: 'enviado',
          message_id: 'msg-123',
        })
      );
    });

    it('deve lançar erro quando transporter não está configurado', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const service = new EmailService();
      
      await expect(service.sendOrdemServicoEmail(mockOrdemServico))
        .rejects.toThrow('Transporter de email não configurado');
    });

    it('deve registrar erro no banco quando envio falha', async () => {
      const error = new Error('Falha no envio');
      mockTransporter.sendMail.mockRejectedValue(error);

      const service = new EmailService();
      
      await expect(service.sendOrdemServicoEmail(mockOrdemServico))
        .rejects.toThrow('Falha no envio');

      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'erro',
          erro: 'Falha no envio',
        })
      );
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      process.env.SMTP_USER = 'test@test.com';
      process.env.SMTP_PASS = 'password';
    });

    it('deve retornar true quando conexão é bem-sucedida', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const service = new EmailService();
      const result = await service.testConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('deve retornar false quando conexão falha', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const service = new EmailService();
      const result = await service.testConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Erro na conexão SMTP:',
        expect.any(Error)
      );
    });

    it('deve retornar false quando transporter não está configurado', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const service = new EmailService();
      const result = await service.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('instância exportada', () => {
    it('deve exportar uma instância do EmailService', () => {
      expect(emailService).toBeInstanceOf(EmailService);
    });
  });
});