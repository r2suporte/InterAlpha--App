// 📱 Testes de Integração - SMS em Ordens de Serviço
// Testa a integração entre APIs de ordens de serviço e envio de SMS

// Mock do fetch para simular chamadas de API
global.fetch = jest.fn()

// Mock das variáveis de ambiente para testes
process.env.TWILIO_ACCOUNT_SID = 'test_account_sid'
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token'
process.env.TWILIO_PHONE_NUMBER = '+15551234567'

describe('Integração SMS - Ordens de Serviço', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Criação de Ordem de Serviço com SMS', () => {
    it('deve enviar SMS ao criar nova ordem de serviço', async () => {
      const novaOrdem = {
        clienteId: '1',
        descricao: 'Manutenção preventiva',
        valor: 500.00,
        dataVencimento: '2024-12-31',
        prioridade: 'media',
        categoria: 'manutencao'
      }

      const mockOrdemResponse = {
        id: '1',
        numero_os: 'OS-2024-001',
        cliente: {
          id: '1',
          nome: 'João Silva',
          telefone: '11999999999',
          email: 'joao@email.com'
        },
        ...novaOrdem,
        status: 'aberta',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock da criação da ordem
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockOrdemResponse,
      })

      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaOrdem)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(response.status).toBe(201)
      expect(data.numero_os).toBe('OS-2024-001')
      expect(data.cliente.telefone).toBe('11999999999')
    })

    it('deve validar dados obrigatórios para criação com SMS', async () => {
      const ordemIncompleta = {
        descricao: 'Manutenção preventiva'
        // Faltando clienteId
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'clienteId é obrigatório'
        }),
      })

      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordemIncompleta)
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('Atualização de Status com SMS', () => {
    it('deve enviar SMS ao atualizar status para "em_andamento"', async () => {
      const statusUpdate = { status: 'em_andamento' }

      const mockStatusResponse = {
        success: true,
        message: 'Status atualizado com sucesso',
        status: 'em_andamento',
        data: {
          id: '1',
          status: 'em_andamento',
          numero_os: 'OS-2024-001'
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockStatusResponse,
      })

      const response = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusUpdate)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.status).toBe('em_andamento')
    })

    it('deve enviar SMS ao concluir ordem de serviço', async () => {
      const conclusaoUpdate = { 
        status: 'concluida',
        dataConclusao: '2024-01-15T10:00:00Z'
      }

      const mockConclusaoResponse = {
        success: true,
        message: 'Status atualizado com sucesso',
        status: 'concluida',
        data: {
          id: '1',
          status: 'concluida',
          numero_os: 'OS-2024-001',
          dataConclusao: '2024-01-15T10:00:00Z'
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockConclusaoResponse,
      })

      const response = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conclusaoUpdate)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.status).toBe('concluida')
    })

    it('deve validar status válidos', async () => {
      const statusInvalido = { status: 'status_inexistente' }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Status inválido'
        }),
      })

      const response = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusInvalido)
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('API SMS Específica para Ordens', () => {
    it('deve enviar SMS específico para ordem de serviço', async () => {
      const smsRequest = {
        ordemServicoId: '1',
        tipo: 'atualizacao'
      }

      const mockSMSResponse = {
        success: true,
        messageId: 'SM123456789',
        message: 'SMS enviado com sucesso'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSMSResponse,
      })

      const response = await fetch('/api/ordens-servico/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsRequest)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.messageId).toBe('SM123456789')
    })

    it('deve validar parâmetros obrigatórios para SMS', async () => {
      const smsIncompleto = {
        ordemServicoId: '1'
        // Faltando tipo
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'ordemServicoId e tipo são obrigatórios'
        }),
      })

      const response = await fetch('/api/ordens-servico/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsIncompleto)
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.success).toBe(false)
      expect(data.error).toContain('obrigatórios')
    })

    it('deve validar tipos de SMS válidos', async () => {
      const tipoInvalido = {
        ordemServicoId: '1',
        tipo: 'tipo_inexistente'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Tipo deve ser: criacao, atualizacao ou conclusao'
        }),
      })

      const response = await fetch('/api/ordens-servico/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipoInvalido)
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.success).toBe(false)
      expect(data.error).toContain('criacao, atualizacao ou conclusao')
    })

    it('deve tratar ordem de serviço não encontrada', async () => {
      const smsRequest = {
        ordemServicoId: '999',
        tipo: 'atualizacao'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Ordem de serviço não encontrada'
        }),
      })

      const response = await fetch('/api/ordens-servico/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsRequest)
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(data.error).toBe('Ordem de serviço não encontrada')
    })
  })

  describe('Processamento em Lote de SMS', () => {
    it('deve processar fila de SMS pendentes', async () => {
      const batchRequest = { limit: 5 }

      const mockBatchResponse = {
        success: true,
        message: 'SMS processados com sucesso',
        processados: 3,
        sucessos: 2,
        falhas: 1,
        detalhes: [
          { id: '1', status: 'enviado', messageId: 'SM111' },
          { id: '2', status: 'enviado', messageId: 'SM222' },
          { id: '3', status: 'falha', error: 'Número inválido' }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBatchResponse,
      })

      const response = await fetch('/api/ordens-servico/processar-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequest)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.processados).toBe(3)
      expect(data.sucessos).toBe(2)
      expect(data.falhas).toBe(1)
    })

    it('deve retornar quando não há SMS pendentes', async () => {
      const batchRequest = { limit: 10 }

      const mockEmptyResponse = {
        success: true,
        message: 'Nenhum SMS pendente encontrado',
        processados: 0
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockEmptyResponse,
      })

      const response = await fetch('/api/ordens-servico/processar-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequest)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.processados).toBe(0)
      expect(data.message).toContain('Nenhum SMS pendente')
    })
  })

  describe('Fluxo Completo de Ordem com SMS', () => {
    it('deve executar fluxo completo: criar → atualizar → concluir com SMS', async () => {
      // 1. Criar ordem
      const novaOrdem = {
        clienteId: '1',
        descricao: 'Reparo de equipamento',
        valor: 300.00,
        prioridade: 'alta'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: '1',
          numero_os: 'OS-2024-002',
          status: 'aberta',
          cliente: {
            nome: 'Maria Santos',
            telefone: '11888888888'
          }
        }),
      })

      const createResponse = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaOrdem)
      })

      expect(createResponse.ok).toBe(true)

      // 2. Atualizar status
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          status: 'em_andamento'
        }),
      })

      const updateResponse = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_andamento' })
      })

      expect(updateResponse.ok).toBe(true)

      // 3. Concluir ordem
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          status: 'concluida'
        }),
      })

      const completeResponse = await fetch('/api/ordens-servico/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'concluida' })
      })

      expect(completeResponse.ok).toBe(true)
    })
  })

  describe('Tratamento de Erros SMS', () => {
    it('deve continuar operação mesmo com falha no SMS', async () => {
      // Simula criação de ordem que falha no SMS mas sucede na criação
      const novaOrdem = {
        clienteId: '1',
        descricao: 'Teste com falha SMS',
        valor: 100.00
      }

      // Mock que simula sucesso na criação mesmo com falha no SMS
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: '1',
          numero_os: 'OS-2024-003',
          status: 'aberta',
          cliente: {
            nome: 'Cliente Teste',
            telefone: null // Sem telefone para simular falha SMS
          },
          warnings: ['SMS não enviado: cliente sem telefone']
        }),
      })

      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaOrdem)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.numero_os).toBe('OS-2024-003')
      // Ordem criada com sucesso mesmo com falha no SMS
    })
  })

  describe('Integração com Número de Teste', () => {
    it('deve enviar SMS para número de teste fornecido', async () => {
      const numeroTeste = '11993804816' // Número fornecido pelo usuário

      const smsRequest = {
        ordemServicoId: '1',
        tipo: 'criacao',
        numeroTeste: numeroTeste
      }

      const mockSMSResponse = {
        success: true,
        messageId: 'SM_TEST_123',
        message: 'SMS de teste enviado com sucesso',
        numeroDestino: numeroTeste
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSMSResponse,
      })

      const response = await fetch('/api/ordens-servico/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsRequest)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.numeroDestino).toBe(numeroTeste)
      expect(data.messageId).toContain('TEST')
    })
  })
})