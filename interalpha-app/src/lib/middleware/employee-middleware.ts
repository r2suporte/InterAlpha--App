import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { employeeService } from '@/lib/services/employee-service'

/**
 * Middleware para atualizar último login do funcionário
 */
export async function updateEmployeeLastLogin(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (userId) {
      // Atualizar último login de forma assíncrona (não bloquear a requisição)
      employeeService.updateLastLogin(userId).catch(error => {
        console.error('Erro ao atualizar último login:', error)
      })
    }
  } catch (error) {
    console.error('Erro no middleware de funcionário:', error)
  }
}

/**
 * Middleware para verificar permissões de funcionário
 */
export async function checkEmployeePermission(request: NextRequest, permission: string) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const hasPermission = await employeeService.hasPermission(userId, permission)
    
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: `Sem permissão para: ${permission}` },
        { status: 403 }
      )
    }

    return null // Permitir continuar
  } catch (error) {
    console.error('Erro ao verificar permissão:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Middleware para verificar se o usuário é admin
 */
export async function requireAdmin(request: NextRequest) {
  return checkEmployeePermission(request, 'all')
}

/**
 * Middleware para verificar múltiplas permissões (OR)
 */
export async function checkAnyPermission(request: NextRequest, permissions: string[]) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    for (const permission of permissions) {
      const hasPermission = await employeeService.hasPermission(userId, permission)
      if (hasPermission) {
        return null // Permitir continuar
      }
    }

    return NextResponse.json(
      { success: false, error: `Sem permissão para: ${permissions.join(' ou ')}` },
      { status: 403 }
    )
  } catch (error) {
    console.error('Erro ao verificar permissões:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Middleware para verificar múltiplas permissões (AND)
 */
export async function checkAllPermissions(request: NextRequest, permissions: string[]) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    for (const permission of permissions) {
      const hasPermission = await employeeService.hasPermission(userId, permission)
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: `Sem permissão para: ${permission}` },
          { status: 403 }
        )
      }
    }

    return null // Permitir continuar
  } catch (error) {
    console.error('Erro ao verificar permissões:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}