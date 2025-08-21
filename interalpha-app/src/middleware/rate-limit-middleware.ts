import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requisições por janela
  message?: string
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  isAllowed(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Obter requisições existentes para este identificador
    const userRequests = this.requests.get(identifier) || []
    
    // Filtrar apenas requisições dentro da janela de tempo
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart)
    
    // Verificar se excedeu o limite
    if (recentRequests.length >= config.maxRequests) {
      return false
    }
    
    // Adicionar a requisição atual
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    
    return true
  }

  // Limpar requisições antigas periodicamente
  cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => now - timestamp < maxAge)
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recentRequests)
      }
    }
  }
}

const rateLimiter = new RateLimiter()

// Limpar cache a cada hora
setInterval(() => {
  rateLimiter.cleanup()
}, 60 * 60 * 1000)

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest, identifier?: string) => {
    // Usar IP como identificador padrão, ou identificador customizado
    const clientId = identifier || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'

    if (!rateLimiter.isAllowed(clientId, config)) {
      return NextResponse.json(
        { 
          error: config.message || 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter: Math.ceil(config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
          }
        }
      )
    }

    return null // Permitir requisição
  }
}

// Configurações pré-definidas
export const rateLimitConfigs = {
  // Para mensagens - máximo 30 mensagens por minuto por usuário
  messages: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30,
    message: 'Muitas mensagens enviadas. Aguarde um momento.'
  },
  
  // Para criação de tickets - máximo 5 tickets por hora por usuário
  tickets: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 5,
    message: 'Muitos tickets criados. Aguarde antes de criar outro.'
  },
  
  // Para APIs gerais - máximo 100 requisições por minuto por IP
  general: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100,
    message: 'Muitas requisições. Tente novamente mais tarde.'
  },
  
  // Para login - máximo 5 tentativas por 15 minutos por IP
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  }
}