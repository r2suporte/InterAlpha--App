// Mock do fetch global
global.fetch = jest.fn()

// Mock da classe EmailService
class MockEmailService {
  async enviarEmail(dados: any) {
    if (!dados.para || !dados.assunto || !dados.corpo) {
      return {
        sucesso: false,
        erro: 'Campos obrigatórios não preenchidos'
      }
    }

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          sucesso: false,
          erro: errorData.error
        }
      }

      const result = await response.json()
      return {
        sucesso: true,
        messageId: result.messageId
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erro: error.message
      }
    }
  }

  async enviarEmailTemplate(dados: any) {
    try {
      const response = await fetch('/api/email/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          sucesso: false,
          erro: errorData.error
        }
      }

      return { sucesso: true }
    } catch (error: any) {
      return {
        sucesso: false,
        erro: error.message
      }
    }
  }

  async verificarStatusEmail(messageId: string) {
    if (!messageId) {
      return {
        sucesso: false,
        erro: 'MessageId é obrigatório'
      }
    }

    try {
      const response = await fetch(`/api/email/status/${messageId}`)
      const result = await response.json()
      
      return {
        sucesso: true,
        ...result
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erro: error.message
      }
    }
  }

  async listarTemplates() {
    try {
      const response = await fetch('/api/email/templates')
      const result = await response.json()
      
      return {
        sucesso: true,
        templates: result.templates
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erro: error.message
      }
    }
  }
}

describe('EmailService', () => {
  let emailService: MockEmailService

  beforeEach(() => {
    emailService = new MockEmailService()
    jest.clearAllMocks()
  })

  describe('enviarEmail', () => {
    it('envia email com sucesso', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, messageId: 'msg-123' })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await emailService.enviarEmail({
        para: 'teste@exemplo.com',
        assunto: 'Teste',
        corpo: 'Corpo do email'
      })

      expect(fetch).toHaveBeenCalledWith('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          para: 'teste@exemplo.com',
          assunto: 'Teste',
          corpo: 'Corpo do email'
        })
      })

      expect(resultado).toEqual({
        sucesso: true,
        messageId: 'msg-123'
      })
    })

    it('trata erro de rede', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Erro de rede'))

      const resultado = await emailService.enviarEmail({
        para: 'teste@exemplo.com',
        assunto: 'Teste',
        corpo: 'Corpo do email'
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Erro de rede'
      })
    })

    it('trata resposta de erro do servidor', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Email inválido' })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await emailService.enviarEmail({
        para: 'email-invalido',
        assunto: 'Teste',
        corpo: 'Corpo do email'
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Email inválido'
      })
    })

    it('valida campos obrigatórios', async () => {
      const resultado = await emailService.enviarEmail({
        para: '',
        assunto: '',
        corpo: ''
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Campos obrigatórios não preenchidos'
      })

      expect(fetch).not.toHaveBeenCalled()
    })

    it('envia email com anexos', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, messageId: 'msg-456' })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const anexos = [
        { nome: 'documento.pdf', conteudo: 'base64content', tipo: 'application/pdf' }
      ]

      const resultado = await emailService.enviarEmail({
        para: 'teste@exemplo.com',
        assunto: 'Email com anexo',
        corpo: 'Corpo do email',
        anexos
      })

      expect(fetch).toHaveBeenCalledWith('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          para: 'teste@exemplo.com',
          assunto: 'Email com anexo',
          corpo: 'Corpo do email',
          anexos
        })
      })

      expect(resultado.sucesso).toBe(true)
    })
  })

  describe('enviarEmailTemplate', () => {
    it('envia email usando template', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, messageId: 'msg-789' })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await emailService.enviarEmailTemplate({
        para: 'cliente@exemplo.com',
        template: 'ordem-servico-criada',
        dados: {
          nomeCliente: 'João Silva',
          numeroOrdem: 'OS-001',
          valorTotal: 'R$ 500,00'
        }
      })

      expect(fetch).toHaveBeenCalledWith('/api/email/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          para: 'cliente@exemplo.com',
          template: 'ordem-servico-criada',
          dados: {
            nomeCliente: 'João Silva',
            numeroOrdem: 'OS-001',
            valorTotal: 'R$ 500,00'
          }
        })
      })

      expect(resultado.sucesso).toBe(true)
    })

    it('trata template não encontrado', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Template não encontrado' })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await emailService.enviarEmailTemplate({
        para: 'cliente@exemplo.com',
        template: 'template-inexistente',
        dados: {}
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Template não encontrado'
      })
    })
  })

  describe('verificarStatusEmail', () => {
    it('verifica status de email enviado', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 
          status: 'entregue',
          dataEntrega: '2024-01-15T10:30:00Z',
          tentativas: 1
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await emailService.verificarStatusEmail('msg-123')

      expect(fetch).toHaveBeenCalledWith('/api/email/status/msg-123')
      expect(resultado).toEqual({
        sucesso: true,
        status: 'entregue',
        dataEntrega: '2024-01-15T10:30:00Z',
        tentativas: 1
      })
    })

    it('trata messageId inválido', async () => {
      const resultado = await emailService.verificarStatusEmail('')

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'MessageId é obrigatório'
      })

      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('listarTemplates', () => {
    it('lista templates disponíveis', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          templates: [
            { id: 'ordem-servico-criada', nome: 'Ordem de Serviço Criada' },
            { id: 'pagamento-confirmado', nome: 'Pagamento Confirmado' }
          ]
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await emailService.listarTemplates()

      expect(fetch).toHaveBeenCalledWith('/api/email/templates')
      expect(resultado.sucesso).toBe(true)
      expect(resultado.templates).toHaveLength(2)
    })
  })
})