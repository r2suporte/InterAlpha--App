import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

export interface AuditContext {
  userId: string
  userType: 'client' | 'employee'
  action: string
  resource: string
  resourceId?: string
  sessionId?: string
}

// Middleware para logging automático de ações
export function auditLogger() {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    
    try {
      // Extrair informações do usuário
      const userId = request.headers.get('x-user-id')
      const userType = request.headers.get('x-user-type') as 'client' | 'employee'
      const sessionId = request.headers.get('x-session-id')

      if (!userId || !userType) {
        return NextResponse.next()
      }

      // Extrair contexto da requisição
      const context = extractRequestContext(request)
      
      // Capturar dados antes da modificação (para PUT/PATCH)
      let oldData: any = null
      if (['PUT', 'PATCH', 'DELETE'].includes(request.method) && context.resourceId) {
        oldData = await captureOldData(context.resource, context.resourceId)
      }

      // Continuar com a requisição
      const response = NextResponse.next()
      
      // Log após a resposta (em background)
      setImmediate(async () => {
        try {
          const endTime = Date.now()
          const duration = endTime - startTime

          // Determinar resultado baseado no status da resposta
          const result = response.status >= 200 && response.status < 400 ? 'success' : 'failure'
          
          // Capturar novos dados (para POST/PUT/PATCH)
          let newData: any = null
          if (['POST', 'PUT', 'PATCH'].includes(request.method) && result === 'success') {
            newData = await captureNewData(request, context.resource, context.resourceId)
          }

          // Log da ação
          await auditService.logAction(
            userId,
            userType,
            context.action,
            context.resource,
            {
              resourceId: context.resourceId,
              oldData,
              newData,
              result,
              reason: result === 'failure' ? `HTTP ${response.status}` : undefined,
              ipAddress: getClientIP(request),
              userAgent: request.headers.get('user-agent') || '',
              sessionId: sessionId || undefined,
              metadata: {
                method: request.method,
                url: request.url,
                duration,
                responseStatus: response.status
              }
            }
          )

        } catch (error) {
          console.error('Error in audit logging:', error)
        }
      })

      return response

    } catch (error) {
      console.error('Error in audit middleware:', error)
      return NextResponse.next()
    }
  }
}

// Middleware específico para logging de acesso
export function accessLogger() {
  return async (request: NextRequest) => {
    try {
      const userId = request.headers.get('x-user-id')
      const userType = request.headers.get('x-user-type') as 'client' | 'employee'

      if (!userId || !userType) {
        return NextResponse.next()
      }

      // Detectar tipo de ação de acesso
      const action = detectAccessAction(request)
      
      if (action) {
        // Log do acesso
        await auditService.logAccess(
          userId,
          userType,
          action,
          {
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') || '',
            location: await getLocationFromIP(getClientIP(request)),
            success: true,
            metadata: {
              url: request.url,
              method: request.method
            }
          }
        )
      }

      return NextResponse.next()

    } catch (error) {
      console.error('Error in access logging:', error)
      return NextResponse.next()
    }
  }
}

// Middleware para detecção de atividades suspeitas
export function securityMonitor() {
  return async (request: NextRequest) => {
    try {
      const ipAddress = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || ''
      const userId = request.headers.get('x-user-id')

      // Detectar padrões suspeitos
      await detectSuspiciousPatterns(request, {
        ipAddress,
        userAgent,
        userId: userId || undefined
      })

      return NextResponse.next()

    } catch (error) {
      console.error('Error in security monitoring:', error)
      return NextResponse.next()
    }
  }
}

// Funções auxiliares

function extractRequestContext(request: NextRequest): AuditContext {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  
  // Mapear rotas para recursos e ações
  const routeMapping = {
    'users': {
      resource: 'users',
      actions: {
        'GET': 'read_user',
        'POST': 'create_user',
        'PUT': 'update_user',
        'DELETE': 'delete_user'
      }
    },
    'employees': {
      resource: 'employees',
      actions: {
        'GET': 'read_employee',
        'POST': 'create_employee',
        'PUT': 'update_employee',
        'DELETE': 'deactivate_employee'
      }
    },
    'roles': {
      resource: 'roles',
      actions: {
        'GET': 'read_role',
        'POST': 'create_role',
        'PUT': 'update_role',
        'DELETE': 'delete_role'
      }
    },
    'clients': {
      resource: 'clients',
      actions: {
        'GET': 'read_client',
        'POST': 'create_client',
        'PUT': 'update_client',
        'DELETE': 'delete_client'
      }
    },
    'orders': {
      resource: 'orders',
      actions: {
        'GET': 'read_order',
        'POST': 'create_order',
        'PUT': 'update_order',
        'DELETE': 'delete_order'
      }
    },
    'payments': {
      resource: 'payments',
      actions: {
        'GET': 'read_payment',
        'POST': 'create_payment',
        'PUT': 'update_payment',
        'DELETE': 'delete_payment'
      }
    }
  }

  // Identificar recurso principal
  let resource = 'unknown'
  let action = `${request.method.toLowerCase()}_unknown`
  let resourceId: string | undefined

  for (const segment of pathSegments) {
    if (routeMapping[segment as keyof typeof routeMapping]) {
      const mapping = routeMapping[segment as keyof typeof routeMapping]
      resource = mapping.resource
      action = mapping.actions[request.method as keyof typeof mapping.actions] || action
      
      // Tentar extrair ID do recurso
      const nextSegmentIndex = pathSegments.indexOf(segment) + 1
      if (nextSegmentIndex < pathSegments.length) {
        const nextSegment = pathSegments[nextSegmentIndex]
        // Se o próximo segmento parece um ID (UUID ou número)
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nextSegment) || 
            /^\d+$/.test(nextSegment)) {
          resourceId = nextSegment
        }
      }
      break
    }
  }

  return {
    userId: '', // Será preenchido pelo middleware
    userType: 'employee', // Será preenchido pelo middleware
    action,
    resource,
    resourceId
  }
}

function detectAccessAction(request: NextRequest): 'login' | 'logout' | null {
  const url = new URL(request.url)
  
  if (url.pathname.includes('/login') && request.method === 'POST') {
    return 'login'
  }
  
  if (url.pathname.includes('/logout') && request.method === 'POST') {
    return 'logout'
  }
  
  return null
}

function getClientIP(request: NextRequest): string {
  // Tentar várias fontes de IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
}

async function getLocationFromIP(ipAddress: string): Promise<string | undefined> {
  try {
    // TODO: Implementar geolocalização por IP
    // Pode usar serviços como MaxMind, IPStack, etc.
    return undefined
  } catch (error) {
    return undefined
  }
}

async function captureOldData(resource: string, resourceId: string): Promise<any> {
  try {
    // TODO: Implementar captura de dados antigos
    // Buscar o estado atual do recurso antes da modificação
    return null
  } catch (error) {
    return null
  }
}

async function captureNewData(request: NextRequest, resource: string, resourceId?: string): Promise<any> {
  try {
    // TODO: Implementar captura de dados novos
    // Para POST, capturar dados do body
    // Para PUT/PATCH, buscar estado após modificação
    if (request.method === 'POST') {
      return await request.json().catch(() => null)
    }
    return null
  } catch (error) {
    return null
  }
}

async function detectSuspiciousPatterns(
  request: NextRequest, 
  context: { ipAddress: string; userAgent: string; userId?: string }
): Promise<void> {
  try {
    // Detectar SQL Injection
    const url = request.url.toLowerCase()
    const sqlInjectionPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+.*set/i,
      /exec\s*\(/i,
      /script\s*>/i
    ]

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(url)) {
        await auditService.logSecurityEvent(
          'sql_injection_attempt' as any,
          'high' as any,
          'Possível tentativa de SQL Injection detectada',
          {
            userId: context.userId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            details: {
              url: request.url,
              method: request.method,
              pattern: pattern.source
            }
          }
        )
        break
      }
    }

    // Detectar rate limiting por IP
    const requestCount = await getRecentRequestCount(context.ipAddress, 60) // 1 minuto
    if (requestCount > 100) { // Mais de 100 requests por minuto
      await auditService.logSecurityEvent(
        'brute_force_attack' as any,
        'medium' as any,
        `Rate limit excedido: ${requestCount} requests em 1 minuto`,
        {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          details: {
            requestCount,
            timeWindow: '1_minute'
          }
        }
      )
    }

  } catch (error) {
    console.error('Error detecting suspicious patterns:', error)
  }
}

async function getRecentRequestCount(ipAddress: string, seconds: number): Promise<number> {
  // TODO: Implementar contagem de requests recentes
  // Pode usar Redis ou cache em memória
  return 0
}

// Exportar middlewares compostos
export function createAuditMiddleware() {
  return [
    securityMonitor(),
    accessLogger(),
    auditLogger()
  ]
}

// Exportar middleware principal para compatibilidade
export const auditMiddleware = auditLogger