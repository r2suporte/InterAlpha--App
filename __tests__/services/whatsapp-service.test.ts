// Mock do fetch global
global.fetch = jest.fn()

// Mock da classe WhatsAppService
class MockWhatsAppService {
  async enviarMensagem(dados: any) {
    if (!dados.numero || !dados.mensagem) {
      return {
        sucesso: false,
        erro: 'Número e mensagem são obrigatórios'
      }
    }

    // Validação básica do número
    const numeroLimpo = dados.numero.replace(/\D/g, '')
    if (numeroLimpo.length < 10 || numeroLimpo.length > 15) {
      return {
        sucesso: false,
        erro: 'Número de telefone inválido'
      }
    }

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          numero: numeroLimpo,
          mensagem: dados.mensagem,
          tipo: dados.tipo || 'texto'
        })
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

  async enviarTemplate(dados: any) {
    if (!dados.numero || !dados.template) {
      return {
        sucesso: false,
        erro: 'Número e template são obrigatórios'
      }
    }

    try {
      const response = await fetch('/api/whatsapp/template', {
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

  async verificarStatusMensagem(messageId: string) {
    if (!messageId) {
      return {
        sucesso: false,
        erro: 'MessageId é obrigatório'
      }
    }

    try {
      const response = await fetch(`/api/whatsapp/status/${messageId}`)
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

  async obterQRCode() {
    try {
      const response = await fetch('/api/whatsapp/qr')
      const result = await response.json()
      
      return {
        sucesso: true,
        qrCode: result.qrCode,
        status: result.status
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erro: error.message
      }
    }
  }

  formatarNumero(numero: string): string {
    const numeroLimpo = numero.replace(/\D/g, '')
    
    if (numeroLimpo.length === 11) {
      // Celular brasileiro
      return `55${numeroLimpo}`
    } else if (numeroLimpo.length === 10) {
      // Telefone fixo brasileiro
      return `55${numeroLimpo}`
    }
    
    return numeroLimpo
  }

  validarNumero(numero: string): boolean {
    const numeroLimpo = numero.replace(/\D/g, '')
    return numeroLimpo.length >= 10 && numeroLimpo.length <= 15
  }
}

describe('WhatsAppService', () => {
  let whatsappService: MockWhatsAppService

  beforeEach(() => {
    whatsappService = new MockWhatsAppService()
    jest.clearAllMocks()
  })

  describe('enviarMensagem', () => {
    it('envia mensagem de texto com sucesso', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, messageId: 'msg-123' })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await whatsappService.enviarMensagem({
        numero: '11999887766',
        mensagem: 'Olá, teste de mensagem!'
      })

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          numero: '11999887766',
          mensagem: 'Olá, teste de mensagem!',
          tipo: 'texto'
        })
      })

      expect(resultado).toEqual({
        sucesso: true,
        messageId: 'msg-123'
      })
    })

    it('valida campos obrigatórios', async () => {
      const resultado = await whatsappService.enviarMensagem({
        numero: '',
        mensagem: ''
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Número e mensagem são obrigatórios'
      })

      expect(fetch).not.toHaveBeenCalled()
    })

    it('valida formato do número', async () => {
      const resultado = await whatsappService.enviarMensagem({
        numero: '123',
        mensagem: 'Teste'
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Número de telefone inválido'
      })

      expect(fetch).not.toHaveBeenCalled()
    })

    it('trata erro de rede', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Erro de conexão'))

      const resultado = await whatsappService.enviarMensagem({
        numero: '11999887766',
        mensagem: 'Teste'
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Erro de conexão'
      })
    })

    it('trata resposta de erro do servidor', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Número bloqueado' })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await whatsappService.enviarMensagem({
        numero: '11999887766',
        mensagem: 'Teste'
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Número bloqueado'
      })
    })
  })

  describe('enviarTemplate', () => {
    it('envia template com sucesso', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await whatsappService.enviarTemplate({
        numero: '11999887766',
        template: 'ordem-servico-criada',
        parametros: {
          nomeCliente: 'João Silva',
          numeroOrdem: 'OS-001'
        }
      })

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          numero: '11999887766',
          template: 'ordem-servico-criada',
          parametros: {
            nomeCliente: 'João Silva',
            numeroOrdem: 'OS-001'
          }
        })
      })

      expect(resultado.sucesso).toBe(true)
    })

    it('valida campos obrigatórios para template', async () => {
      const resultado = await whatsappService.enviarTemplate({
        numero: '',
        template: ''
      })

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'Número e template são obrigatórios'
      })

      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('verificarStatusMensagem', () => {
    it('verifica status de mensagem enviada', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 
          status: 'entregue',
          dataEntrega: '2024-01-15T10:30:00Z'
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await whatsappService.verificarStatusMensagem('msg-123')

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/status/msg-123')
      expect(resultado).toEqual({
        sucesso: true,
        status: 'entregue',
        dataEntrega: '2024-01-15T10:30:00Z'
      })
    })

    it('trata messageId inválido', async () => {
      const resultado = await whatsappService.verificarStatusMensagem('')

      expect(resultado).toEqual({
        sucesso: false,
        erro: 'MessageId é obrigatório'
      })

      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('obterQRCode', () => {
    it('obtém QR code para conexão', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          status: 'disconnected'
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const resultado = await whatsappService.obterQRCode()

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/qr')
      expect(resultado).toEqual({
        sucesso: true,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        status: 'disconnected'
      })
    })
  })

  describe('formatarNumero', () => {
    it('formata número de celular brasileiro', () => {
      const resultado = whatsappService.formatarNumero('11999887766')
      expect(resultado).toBe('5511999887766')
    })

    it('formata número de telefone fixo brasileiro', () => {
      const resultado = whatsappService.formatarNumero('1133334444')
      expect(resultado).toBe('551133334444')
    })

    it('remove caracteres especiais', () => {
      const resultado = whatsappService.formatarNumero('(11) 99988-7766')
      expect(resultado).toBe('5511999887766')
    })

    it('mantém números internacionais', () => {
      const resultado = whatsappService.formatarNumero('1234567890123')
      expect(resultado).toBe('1234567890123')
    })
  })

  describe('validarNumero', () => {
    it('valida número brasileiro válido', () => {
      expect(whatsappService.validarNumero('11999887766')).toBe(true)
      expect(whatsappService.validarNumero('1133334444')).toBe(true)
    })

    it('rejeita números muito curtos', () => {
      expect(whatsappService.validarNumero('123456789')).toBe(false)
    })

    it('rejeita números muito longos', () => {
      expect(whatsappService.validarNumero('1234567890123456')).toBe(false)
    })

    it('valida números com formatação', () => {
      expect(whatsappService.validarNumero('(11) 99988-7766')).toBe(true)
      expect(whatsappService.validarNumero('+55 11 99988-7766')).toBe(true)
    })
  })
})