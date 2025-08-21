import { NextRequest, NextResponse } from 'next/server'
import { roleManagementService } from '@/services/rbac/role-management-service'
import { EmployeeRole } from '@/types/auth'

export interface RBACContext {
  userId: string
  userRole: EmployeeRole
  resource: string
  action: string
  resourceId?: string
  resourceData?: any
}

// Middleware para verificação de permissões RBAC
export function requireRBACPermission(resource: string, action: string) {
  return async (request: NextRequest) => {
    try {
      const userId = request.headers.get('x-user-id')
      const userType = request.headers.get('x-user-type')

      if (!userId || userType !== 'employee') {
        return NextResponse.json(
          { error: 'Autenticação de funcionário requerida' },
          { status: 401 }
        )
      }

      // Obter contexto adicional da requisição
      const context = await extractRequestContext(request)

      // Validar permissão usando o serviço RBAC
      const validation = await roleManagementService.validateUserPermission(
        userId,
        resource,
        action,
        {
          ...context,
          userId,
          requestMetadata: {
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            userAgent: request.headers.get('user-agent') || '',
            timestamp: new Date()
          }
        }
      )

      if (!validation.allowed) {
        // Log da tentativa de acesso negado
        await logAccessDenied({
          userId,
          resource,
          action,
          reason: validation.reason,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          url: request.url
        })

        return NextResponse.json(
          { 
            error: 'Acesso negado',
            message: validation.reason || 'Você não tem permissão para executar esta ação'
          },
          { status: 403 }
        )
      }

      // Log da ação permitida
      await logAccessGranted({
        userId,
        resource,
        action,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent'),
        url: request.url
      })

      return NextResponse.next()

    } catch (error) {
      console.error('RBAC middleware error:', error)
      return NextResponse.json(
        { error: 'Erro na verificação de permissões' },
        { status: 500 }
      )
    }
  }
}

// Middleware para verificação de hierarquia de roles
export function requireRoleHierarchy(minimumRole: EmployeeRole) {
  return async (request: NextRequest) => {
    try {
      const userId = request.headers.get('x-user-id')
      const userType = request.headers.get('x-user-type')

      if (!userId || userType !== 'employee') {
        return NextResponse.json(
          { error: 'Autenticação de funcionário requerida' },
          { status: 401 }
        )
      }

      // Obter role efetivo do usuário
      const { roleDefinition } = await roleManagementService.getUserEffectiveRole(userId)

      if (!roleDefinition) {
        return NextResponse.json(
          { error: 'Usuário sem role atribuído' },
          { status: 403 }
        )
      }

      // Verificar hierarquia
      const userLevel = roleDefinition.hierarchy_level
      const requiredLevel = getRoleHierarchyLevel(minimumRole)

      if (userLevel < requiredLevel) {
        return NextResponse.json(
          { 
            error: 'Nível de acesso insuficiente',
            message: `Esta ação requer nível ${minimumRole} ou superior`
          },
          { status: 403 }
        )
      }

      return NextResponse.next()

    } catch (error) {
      console.error('Role hierarchy middleware error:', error)
      return NextResponse.json(
        { error: 'Erro na verificação de hierarquia' },
        { status: 500 }
      )
    }
  }
}

// Middleware para verificação de gerenciamento de usuários
export function requireUserManagementPermission() {
  return async (request: NextRequest) => {
    try {
      const managerId = request.headers.get('x-user-id')
      const userType = request.headers.get('x-user-type')

      if (!managerId || userType !== 'employee') {
        return NextResponse.json(
          { error: 'Autenticação de funcionário requerida' },
          { status: 401 }
        )
      }

      // Extrair ID do usuário alvo da URL ou body
      const targetUserId = await extractTargetUserId(request)

      if (!targetUserId) {
        return NextResponse.json(
          { error: 'ID do usuário alvo não encontrado' },
          { status: 400 }
        )
      }

      // Obter role do gerente
      const { roleDefinition: managerRole } = await roleManagementService.getUserEffectiveRole(managerId)

      if (!managerRole) {
        return NextResponse.json(
          { error: 'Gerente sem role atribuído' },
          { status: 403 }
        )
      }

      // Verificar se pode gerenciar o usuário alvo
      const canManage = await roleManagementService.canUserManageUser(
        managerId,
        managerRole.role,
        targetUserId
      )

      if (!canManage) {
        return NextResponse.json(
          { 
            error: 'Não é possível gerenciar este usuário',
            message: 'Você não tem permissão para gerenciar usuários deste nível'
          },
          { status: 403 }
        )
      }

      return NextResponse.next()

    } catch (error) {
      console.error('User management middleware error:', error)
      return NextResponse.json(
        { error: 'Erro na verificação de gerenciamento' },
        { status: 500 }
      )
    }
  }
}

// Middleware para rate limiting baseado em role
export function roleBasedRateLimit() {
  return async (request: NextRequest) => {
    try {
      const userId = request.headers.get('x-user-id')
      const userType = request.headers.get('x-user-type')

      if (!userId || userType !== 'employee') {
        return NextResponse.next() // Não aplicar rate limit para não-funcionários
      }

      // Obter role do usuário
      const { roleDefinition } = await roleManagementService.getUserEffectiveRole(userId)

      if (!roleDefinition) {
        return NextResponse.next()
      }

      // Definir limites por role
      const rateLimits = getRoleLimits(roleDefinition.role)
      
      // Verificar rate limit
      const isAllowed = await checkRateLimit(userId, rateLimits)

      if (!isAllowed) {
        return NextResponse.json(
          { 
            error: 'Limite de requisições excedido',
            message: `Limite: ${rateLimits.requests} requisições por ${rateLimits.window}ms`
          },
          { status: 429 }
        )
      }

      return NextResponse.next()

    } catch (error) {
      console.error('Rate limit middleware error:', error)
      return NextResponse.next() // Não bloquear em caso de erro
    }
  }
}

// Funções auxiliares

async function extractRequestContext(request: NextRequest): Promise<any> {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  
  // Extrair ID do recurso da URL (ex: /api/clientes/123)
  const resourceId = pathSegments[pathSegments.length - 1]
  
  // Extrair dados do body se for POST/PUT
  let resourceData = null
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      resourceData = await request.json()
    } catch {
      // Ignorar erro de parsing
    }
  }

  return {
    resourceId: resourceId !== 'route.ts' ? resourceId : undefined,
    resourceData,
    method: request.method,
    url: request.url
  }
}

async function extractTargetUserId(request: NextRequest): Promise<string | null> {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  
  // Tentar extrair da URL
  const userIdFromPath = pathSegments[pathSegments.length - 1]
  if (userIdFromPath && userIdFromPath !== 'route.ts') {
    return userIdFromPath
  }

  // Tentar extrair do body
  try {
    const body = await request.json()
    return body.userId || body.targetUserId || null
  } catch {
    return null
  }
}

function getRoleHierarchyLevel(role: EmployeeRole): number {
  const levels = {
    [EmployeeRole.ATENDENTE]: 1,
    [EmployeeRole.TECNICO]: 2,
    [EmployeeRole.SUPERVISOR_TECNICO]: 3,
    [EmployeeRole.GERENTE_ADM]: 4,
    [EmployeeRole.GERENTE_FINANCEIRO]: 5
  }
  return levels[role] || 0
}

function getRoleLimits(role: EmployeeRole): { requests: number; window: number } {
  const limits = {
    [EmployeeRole.ATENDENTE]: { requests: 100, window: 60000 }, // 100/min
    [EmployeeRole.TECNICO]: { requests: 150, window: 60000 }, // 150/min
    [EmployeeRole.SUPERVISOR_TECNICO]: { requests: 200, window: 60000 }, // 200/min
    [EmployeeRole.GERENTE_ADM]: { requests: 300, window: 60000 }, // 300/min
    [EmployeeRole.GERENTE_FINANCEIRO]: { requests: 500, window: 60000 } // 500/min
  }
  return limits[role] || { requests: 50, window: 60000 }
}

async function checkRateLimit(userId: string, limits: { requests: number; window: number }): Promise<boolean> {
  // TODO: Implementar rate limiting real (Redis, etc.)
  // Por enquanto, sempre permitir
  return true
}

async function logAccessDenied(data: any): Promise<void> {
  // TODO: Implementar log de acesso negado
  console.log('Access denied:', data)
}

async function logAccessGranted(data: any): Promise<void> {
  // TODO: Implementar log de acesso permitido
  console.log('Access granted:', data)
}

// Exportar middleware principal para compatibilidade
export const rbacMiddleware = requireRBACPermission