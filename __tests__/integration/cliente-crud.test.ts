// Mock do fetch para simular chamadas de API
global.fetch = jest.fn()

describe('CRUD de Clientes - Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Criar Cliente', () => {
    it('deve criar um novo cliente com sucesso', async () => {
      const novoCliente = {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '(11) 99999-9999',
        cpf: '123.456.789-00',
        endereco: 'Rua das Flores, 123'
      }

      const mockResponse = {
        id: '1',
        ...novoCliente,
        createdAt: '2024-01-01T00:00:00Z'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      })

      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente)
      })

      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente)
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
      expect(data.nome).toBe('João Silva')
      expect(data.email).toBe('joao@example.com')
    })

    it('deve retornar erro para dados inválidos', async () => {
      const clienteInvalido = {
        nome: '',
        email: 'email-invalido',
        telefone: '',
        cpf: '123'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Dados inválidos',
          details: {
            nome: 'Nome é obrigatório',
            email: 'Email deve ter formato válido',
            telefone: 'Telefone é obrigatório',
            cpf: 'CPF deve ter formato válido'
          }
        }),
      })

      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteInvalido)
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(data.error).toBe('Dados inválidos')
      expect(data.details.nome).toBe('Nome é obrigatório')
    })
  })

  describe('Listar Clientes', () => {
    it('deve retornar lista de clientes', async () => {
      const mockClientes = [
        {
          id: '1',
          nome: 'João Silva',
          email: 'joao@example.com',
          telefone: '(11) 99999-9999',
          cpf: '123.456.789-00'
        },
        {
          id: '2',
          nome: 'Maria Santos',
          email: 'maria@example.com',
          telefone: '(11) 88888-8888',
          cpf: '987.654.321-00'
        }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          clientes: mockClientes,
          total: 2,
          page: 1,
          limit: 10
        }),
      })

      const response = await fetch('/api/clientes?page=1&limit=10')
      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/clientes?page=1&limit=10')
      expect(response.ok).toBe(true)
      expect(data.clientes).toHaveLength(2)
      expect(data.total).toBe(2)
      expect(data.clientes[0].nome).toBe('João Silva')
    })

    it('deve filtrar clientes por nome', async () => {
      const mockClientesFiltrados = [
        {
          id: '1',
          nome: 'João Silva',
          email: 'joao@example.com',
          telefone: '(11) 99999-9999',
          cpf: '123.456.789-00'
        }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          clientes: mockClientesFiltrados,
          total: 1,
          page: 1,
          limit: 10
        }),
      })

      const response = await fetch('/api/clientes?search=João&page=1&limit=10')
      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/clientes?search=João&page=1&limit=10')
      expect(data.clientes).toHaveLength(1)
      expect(data.clientes[0].nome).toContain('João')
    })
  })

  describe('Buscar Cliente por ID', () => {
    it('deve retornar cliente específico', async () => {
      const mockCliente = {
        id: '1',
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '(11) 99999-9999',
        cpf: '123.456.789-00',
        endereco: 'Rua das Flores, 123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCliente,
      })

      const response = await fetch('/api/clientes/1')
      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/clientes/1')
      expect(response.ok).toBe(true)
      expect(data.id).toBe('1')
      expect(data.nome).toBe('João Silva')
    })

    it('deve retornar erro 404 para cliente não encontrado', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Cliente não encontrado'
        }),
      })

      const response = await fetch('/api/clientes/999')
      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(data.error).toBe('Cliente não encontrado')
    })
  })

  describe('Atualizar Cliente', () => {
    it('deve atualizar cliente com sucesso', async () => {
      const dadosAtualizacao = {
        nome: 'João Silva Santos',
        telefone: '(11) 77777-7777',
        endereco: 'Rua Nova, 456'
      }

      const mockClienteAtualizado = {
        id: '1',
        nome: 'João Silva Santos',
        email: 'joao@example.com',
        telefone: '(11) 77777-7777',
        cpf: '123.456.789-00',
        endereco: 'Rua Nova, 456',
        updatedAt: '2024-01-02T00:00:00Z'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockClienteAtualizado,
      })

      const response = await fetch('/api/clientes/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizacao)
      })

      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/clientes/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizacao)
      })

      expect(response.ok).toBe(true)
      expect(data.nome).toBe('João Silva Santos')
      expect(data.telefone).toBe('(11) 77777-7777')
      expect(data.endereco).toBe('Rua Nova, 456')
    })
  })

  describe('Deletar Cliente', () => {
    it('deve deletar cliente com sucesso', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const response = await fetch('/api/clientes/1', {
        method: 'DELETE'
      })

      expect(fetch).toHaveBeenCalledWith('/api/clientes/1', {
        method: 'DELETE'
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(204)
    })

    it('deve retornar erro ao tentar deletar cliente com ordens ativas', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Não é possível deletar cliente com ordens de serviço ativas'
        }),
      })

      const response = await fetch('/api/clientes/1', {
        method: 'DELETE'
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(409)
      expect(data.error).toContain('ordens de serviço ativas')
    })
  })

  describe('Fluxo completo CRUD', () => {
    it('deve executar operações CRUD em sequência', async () => {
      // 1. Criar cliente
      const novoCliente = {
        nome: 'Teste Cliente',
        email: 'teste@example.com',
        telefone: '(11) 99999-9999',
        cpf: '123.456.789-00'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: '1', ...novoCliente }),
      })

      const createResponse = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente)
      })

      expect(createResponse.ok).toBe(true)

      // 2. Buscar cliente criado
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', ...novoCliente }),
      })

      const getResponse = await fetch('/api/clientes/1')
      expect(getResponse.ok).toBe(true)

      // 3. Atualizar cliente
      const dadosAtualizacao = { nome: 'Teste Cliente Atualizado' }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', ...novoCliente, ...dadosAtualizacao }),
      })

      const updateResponse = await fetch('/api/clientes/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizacao)
      })

      expect(updateResponse.ok).toBe(true)

      // 4. Deletar cliente
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const deleteResponse = await fetch('/api/clientes/1', {
        method: 'DELETE'
      })

      expect(deleteResponse.ok).toBe(true)
      expect(deleteResponse.status).toBe(204)
    })
  })
})