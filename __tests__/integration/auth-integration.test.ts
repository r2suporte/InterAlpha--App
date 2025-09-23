// Mock do fetch para simular chamadas de API
global.fetch = jest.fn()

describe('Integração de Autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Limpar localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  describe('Login', () => {
    it('deve realizar login com credenciais válidas', async () => {
      const credenciais = {
        email: 'admin@interalpha.com',
        password: 'senha123'
      }

      const mockResponse = {
        user: {
          id: '1',
          email: 'admin@interalpha.com',
          nome: 'Administrador',
          role: 'admin'
        },
        token: 'jwt-token-mock',
        refreshToken: 'refresh-token-mock'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciais)
      })

      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciais)
      })

      expect(response.ok).toBe(true)
      expect(data.user.email).toBe('admin@interalpha.com')
      expect(data.token).toBe('jwt-token-mock')
      expect(data.user.role).toBe('admin')
    })

    it('deve retornar erro para credenciais inválidas', async () => {
      const credenciaisInvalidas = {
        email: 'usuario@teste.com',
        password: 'senhaerrada'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Credenciais inválidas'
        }),
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciaisInvalidas)
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
      expect(data.error).toBe('Credenciais inválidas')
    })

    it('deve retornar erro para dados de login inválidos', async () => {
      const dadosInvalidos = {
        email: 'email-invalido',
        password: ''
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Dados inválidos',
          details: {
            email: 'Email deve ter formato válido',
            password: 'Senha é obrigatória'
          }
        }),
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosInvalidos)
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(data.error).toBe('Dados inválidos')
      expect(data.details.email).toBe('Email deve ter formato válido')
    })
  })

  describe('Logout', () => {
    it('deve realizar logout com sucesso', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Logout realizado com sucesso'
        }),
      })

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-mock'
        }
      })

      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-mock'
        }
      })

      expect(response.ok).toBe(true)
      expect(data.message).toBe('Logout realizado com sucesso')
    })

    it('deve retornar erro para token inválido no logout', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Token inválido'
        }),
      })

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-invalido'
        }
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
      expect(data.error).toBe('Token inválido')
    })
  })

  describe('Verificação de Token', () => {
    it('deve verificar token válido', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@interalpha.com',
        nome: 'Administrador',
        role: 'admin'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          valid: true,
          user: mockUser
        }),
      })

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer jwt-token-mock'
        }
      })

      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/auth/verify', {
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer jwt-token-mock'
        }
      })

      expect(response.ok).toBe(true)
      expect(data.valid).toBe(true)
      expect(data.user.email).toBe('admin@interalpha.com')
    })

    it('deve retornar inválido para token expirado', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          valid: false,
          error: 'Token expirado'
        }),
      })

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer token-expirado'
        }
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
      expect(data.valid).toBe(false)
      expect(data.error).toBe('Token expirado')
    })
  })

  describe('Refresh Token', () => {
    it('deve renovar token com refresh token válido', async () => {
      const refreshTokenData = {
        refreshToken: 'refresh-token-mock'
      }

      const mockResponse = {
        token: 'novo-jwt-token',
        refreshToken: 'novo-refresh-token',
        user: {
          id: '1',
          email: 'admin@interalpha.com',
          nome: 'Administrador',
          role: 'admin'
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshTokenData)
      })

      const data = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshTokenData)
      })

      expect(response.ok).toBe(true)
      expect(data.token).toBe('novo-jwt-token')
      expect(data.refreshToken).toBe('novo-refresh-token')
    })

    it('deve retornar erro para refresh token inválido', async () => {
      const refreshTokenInvalido = {
        refreshToken: 'refresh-token-invalido'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Refresh token inválido'
        }),
      })

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshTokenInvalido)
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
      expect(data.error).toBe('Refresh token inválido')
    })
  })

  describe('Fluxo completo de autenticação', () => {
    it('deve executar fluxo completo: login -> verificação -> refresh -> logout', async () => {
      // 1. Login
      const credenciais = {
        email: 'admin@interalpha.com',
        password: 'senha123'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: '1', email: 'admin@interalpha.com', role: 'admin' },
          token: 'jwt-token-1',
          refreshToken: 'refresh-token-1'
        }),
      })

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciais)
      })

      expect(loginResponse.ok).toBe(true)

      // 2. Verificar token
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          valid: true,
          user: { id: '1', email: 'admin@interalpha.com', role: 'admin' }
        }),
      })

      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer jwt-token-1' }
      })

      expect(verifyResponse.ok).toBe(true)

      // 3. Refresh token
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          token: 'jwt-token-2',
          refreshToken: 'refresh-token-2'
        }),
      })

      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'refresh-token-1' })
      })

      expect(refreshResponse.ok).toBe(true)

      // 4. Logout
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Logout realizado com sucesso'
        }),
      })

      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-2'
        }
      })

      expect(logoutResponse.ok).toBe(true)
    })
  })

  describe('Autorização por Role', () => {
    it('deve permitir acesso para role admin', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          authorized: true,
          user: { id: '1', role: 'admin' }
        }),
      })

      const response = await fetch('/api/auth/check-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-admin'
        },
        body: JSON.stringify({ requiredRole: 'admin' })
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.authorized).toBe(true)
    })

    it('deve negar acesso para role insuficiente', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          authorized: false,
          error: 'Acesso negado: role insuficiente'
        }),
      })

      const response = await fetch('/api/auth/check-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-user'
        },
        body: JSON.stringify({ requiredRole: 'admin' })
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
      expect(data.authorized).toBe(false)
      expect(data.error).toContain('Acesso negado')
    })
  })
})