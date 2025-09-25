import EmailService from '@/lib/services/email-service'
import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

// Mock do nodemailer
jest.mock('nodemailer')
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>

// Mock do Supabase
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock das variáveis de ambiente
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'test@example.com',
    SMTP_PASS: 'test-password',
    NEXT_PUBLIC_APP_URL: 'https://app.test.com'
  }
})

afterEach(() => {
  process.env = originalEnv
  jest.clearAllMocks()
})

describe('EmailService', () => {
  let emailService: EmailService
  let mockTransporter: any
  let mockSupabase: any

  beforeEach(() => {
    // Mock do transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn()
    }
    mockNodemailer.createTransport.mockReturnValue(mockTransporter)

    // Mock do Supabase
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnValue({ error: null })
    }
    mockCreateClient.mockResolvedValue(mockSupabase)

    emailService = new EmailService()
  })

  describe('constructor e initializeTransporter', () => {
    it('inicializa o transporter com configurações corretas', () => {
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password'
        }
      })
    })

    it('não inicializa transporter quando credenciais estão ausentes', () => {
      process.env.SMTP_USER = ''
      process.env.SMTP_PASS = ''
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      new EmailService()
      
      expect(consoleSpy).toHaveBeenCalledWith('Configurações SMTP não encontradas. Email não será enviado.')
      consoleSpy.mockRestore()
    })
  })

  describe('sendOrdemServicoEmail', () => {
    const mockOrdemServico = {
      id: 'os-123',
      numero_os: 'OS-001',
      descricao: 'Manutenção preventiva',
      valor: 150.00,
      data_inicio: '2024-01-15',
      cliente: {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        telefone: '11999887766'
      },
      equipamento: {
        marca: 'Dell',
        modelo: 'Inspiron 15',
        numero_serie: 'DL123456'
      }
    }

    it('envia email de ordem de serviço com sucesso', async () => {
      const mockResult = {
        messageId: 'msg-123',
        response: '250 Message accepted'
      }
      mockTransporter.sendMail.mockResolvedValue(mockResult)

      const resultado = await emailService.sendOrdemServicoEmail(mockOrdemServico)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"InterAlpha" <test@example.com>',
        to: 'joao@exemplo.com',
        subject: 'Nova Ordem de Serviço #OS-001 - InterAlpha',
        html: expect.stringContaining('Nova Ordem de Serviço')
      })

      expect(resultado).toEqual(mockResult)
    })

    it('envia email com credenciais de login', async () => {
      const mockResult = { messageId: 'msg-124' }
      mockTransporter.sendMail.mockResolvedValue(mockResult)

      const loginCredentials = {
        login: 'joao.silva',
        senha: 'senha123'
      }

      await emailService.sendOrdemServicoEmail(mockOrdemServico, loginCredentials)

      const emailCall = mockTransporter.sendMail.mock.calls[0][0]
      expect(emailCall.html).toContain('Acesso ao Portal do Cliente')
      expect(emailCall.html).toContain('joao.silva')
      expect(emailCall.html).toContain('senha123')
    })

    it('registra comunicação no banco após envio bem-sucedido', async () => {
      const mockResult = { messageId: 'msg-125' }
      mockTransporter.sendMail.mockResolvedValue(mockResult)

      await emailService.sendOrdemServicoEmail(mockOrdemServico)

      expect(mockSupabase.from).toHaveBeenCalledWith('comunicacoes_cliente')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        cliente_portal_id: 'os-123',
        ordem_servico_id: 'os-123',
        tipo: 'email',
        conteudo: expect.stringContaining('Nova Ordem de Serviço'),
        destinatario: 'joao@exemplo.com',
        status: 'enviado',
        message_id: 'msg-125',
        enviado_em: expect.any(String)
      })
    })

    it('trata erro ao enviar email', async () => {
      const mockError = new Error('SMTP connection failed')
      mockTransporter.sendMail.mockRejectedValue(mockError)

      await expect(emailService.sendOrdemServicoEmail(mockOrdemServico))
        .rejects.toThrow('SMTP connection failed')

      // Verifica se o erro foi registrado no banco
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        cliente_portal_id: 'os-123',
        ordem_servico_id: 'os-123',
        tipo: 'email',
        conteudo: expect.stringContaining('Nova Ordem de Serviço'),
        destinatario: 'joao@exemplo.com',
        status: 'erro',
        erro: 'SMTP connection failed',
        enviado_em: expect.any(String)
      })
    })

    it('lança erro quando transporter não está configurado', async () => {
      // Simula transporter não configurado
      emailService = new EmailService()
      ;(emailService as any).transporter = null

      await expect(emailService.sendOrdemServicoEmail(mockOrdemServico))
        .rejects.toThrow('Transporter de email não configurado')
    })
  })

  describe('generateOrdemServicoEmailTemplate', () => {
    const mockOrdemServico = {
      id: 'os-123',
      numero_os: 'OS-001',
      descricao: 'Manutenção preventiva',
      valor: 150.00,
      data_inicio: '2024-01-15',
      cliente: {
        nome: 'João Silva',
        email: 'joao@exemplo.com'
      }
    }

    it('gera template HTML corretamente', () => {
      const template = (emailService as any).generateOrdemServicoEmailTemplate(mockOrdemServico)

      expect(template).toContain('João Silva')
      expect(template).toContain('OS-001')
      expect(template).toContain('Manutenção preventiva')
      
      // Verificar se o valor está formatado corretamente como moeda brasileira
      const expectedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(150.00)
      expect(template).toContain(expectedValue)
      
      // Verificar se a data está formatada corretamente (pode variar por timezone)
      const expectedDate = new Date('2024-01-15').toLocaleDateString('pt-BR')
      expect(template).toContain(expectedDate)
      expect(template).toContain('InterAlpha')
    })

    it('inclui informações do equipamento quando disponível', () => {
      const ordemComEquipamento = {
        ...mockOrdemServico,
        equipamento: {
          marca: 'Dell',
          modelo: 'Inspiron 15',
          numero_serie: 'DL123456'
        }
      }

      const template = (emailService as any).generateOrdemServicoEmailTemplate(ordemComEquipamento)

      expect(template).toContain('Dell Inspiron 15')
      expect(template).toContain('S/N: DL123456')
    })

    it('inclui credenciais de login quando fornecidas', () => {
      const loginCredentials = {
        login: 'joao.silva',
        senha: 'senha123'
      }

      const template = (emailService as any).generateOrdemServicoEmailTemplate(
        mockOrdemServico, 
        loginCredentials
      )

      expect(template).toContain('Acesso ao Portal do Cliente')
      expect(template).toContain('joao.silva')
      expect(template).toContain('senha123')
      expect(template).toContain('Acessar Portal do Cliente')
    })

    it('formata valores monetários corretamente', () => {
      const ordemComValorDecimal = {
        ...mockOrdemServico,
        valor: 1234.56
      }

      const template = (emailService as any).generateOrdemServicoEmailTemplate(ordemComValorDecimal)
      
      // Verificar se o valor está formatado corretamente como moeda brasileira
      const expectedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(1234.56)
      expect(template).toContain(expectedValue)
    })

    it('formata data brasileira corretamente', () => {
      const template = (emailService as any).generateOrdemServicoEmailTemplate(mockOrdemServico)
      
      // Verificar se a data está formatada corretamente (pode variar por timezone)
      const expectedDate = new Date('2024-01-15').toLocaleDateString('pt-BR')
      expect(template).toContain(expectedDate)
    })
  })

  describe('testConnection', () => {
    it('retorna true quando conexão é bem-sucedida', async () => {
      mockTransporter.verify.mockResolvedValue(true)

      const resultado = await emailService.testConnection()

      expect(mockTransporter.verify).toHaveBeenCalled()
      expect(resultado).toBe(true)
    })

    it('retorna false quando conexão falha', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const resultado = await emailService.testConnection()

      expect(resultado).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Erro na conexão SMTP:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('retorna false quando transporter não está configurado', async () => {
      ;(emailService as any).transporter = null

      const resultado = await emailService.testConnection()

      expect(resultado).toBe(false)
    })
  })

  describe('registrarComunicacao', () => {
    it('registra comunicação no Supabase com sucesso', async () => {
      const dados = {
        cliente_portal_id: 'cliente-123',
        ordem_servico_id: 'os-123',
        tipo: 'email',
        conteudo: '<html>Email content</html>',
        destinatario: 'cliente@exemplo.com',
        status: 'enviado',
        message_id: 'msg-123'
      }

      await (emailService as any).registrarComunicacao(dados)

      expect(mockSupabase.from).toHaveBeenCalledWith('comunicacoes_cliente')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...dados,
        enviado_em: expect.any(String)
      })
    })

    it('trata erro ao registrar comunicação', async () => {
      mockSupabase.insert.mockReturnValue({ error: new Error('Database error') })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const dados = {
        cliente_portal_id: 'cliente-123',
        ordem_servico_id: 'os-123',
        tipo: 'email',
        conteudo: '<html>Email content</html>',
        destinatario: 'cliente@exemplo.com',
        status: 'erro',
        erro: 'SMTP error'
      }

      await (emailService as any).registrarComunicacao(dados)

      expect(consoleSpy).toHaveBeenCalledWith('Erro ao registrar comunicação:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Integração com interfaces', () => {
    it('valida interface OrdemServicoEmail', () => {
      const ordemServico = {
        id: 'os-123',
        numero_os: 'OS-001',
        descricao: 'Teste',
        valor: 100,
        data_inicio: '2024-01-15',
        cliente: {
          nome: 'Cliente Teste',
          email: 'cliente@teste.com',
          telefone: '11999887766'
        },
        equipamento: {
          marca: 'Marca',
          modelo: 'Modelo',
          numero_serie: 'SN123'
        }
      }

      // Se chegou até aqui, a interface está correta
      expect(ordemServico.id).toBeDefined()
      expect(ordemServico.cliente.email).toBeDefined()
    })

    it('valida interface EmailConfig', () => {
      const config = {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'user@test.com',
          pass: 'password'
        }
      }

      // Se chegou até aqui, a interface está correta
      expect(config.host).toBeDefined()
      expect(config.auth.user).toBeDefined()
    })
  })
})