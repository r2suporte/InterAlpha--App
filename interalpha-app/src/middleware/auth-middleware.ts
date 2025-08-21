import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    role: string
    type: 'employee' | 'client'
  }
  error?: string
}

// Middleware principal de autenticação
export async function authMiddleware(
  request: NextRequest, 
  allowedRoles?: string[]
): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Token de acesso requerido'
      }
    }

    const token = authHeader.substring(7)
    
    // Simular validação de token (em produção, usar JWT)
    // Por enquanto, usar o token como ID do usuário para desenvolvimento
    const employee = await prisma.employee.findUnique({
      where: { 
        id: token,
        isActive: true
      }
    })

    if (!employee) {
      return {
        success: false,
        error: 'Token inválido ou usuário não encontrado'
      }
    }

    // Verificar se o role é permitido
    if (allowedRoles && !allowedRoles.includes(employee.role)) {
      return {
        success: false,
        error: 'Permissão insuficiente'
      }
    }

    return {
      success: true,
      user: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        type: 'employee'
      }
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error)
    return {
      success: false,
      error: 'Erro interno de autenticação'
    }
  }
}

// Middleware para autenticação de clientes
export async function authenticateClient(request: NextRequest): Promise<AuthResult> {
  try {
    const clientKey = request.nextUrl.searchParams.get('key') || 
                     request.headers.get('x-client-key')
    
    if (!clientKey) {
      return {
        success: false,
        error: 'Chave de acesso requerida'
      }
    }

    const accessKey = await prisma.clientAccessKey.findUnique({
      where: { 
        key: clientKey,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        client: true
      }
    })

    if (!accessKey) {
      return {
        success: false,
        error: 'Chave de acesso inválida ou expirada'
      }
    }

    return {
      success: true,
      user: {
        id: accessKey.client.id,
        email: accessKey.client.email,
        name: accessKey.client.nome,
        role: 'CLIENT',
        type: 'client'
      }
    }
  } catch (error) {
    console.error('Erro na autenticação do cliente:', error)
    return {
      success: false,
      error: 'Erro interno de autenticação'
    }
  }
}