import { NextRequest, NextResponse } from 'next/server'
import { roleManagementService } from '@/services/rbac/role-management-service'

// Atribuir role a usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      roleId,
      assignedBy,
      expiresAt,
      metadata
    } = body

    // Validar dados obrigatórios
    if (!userId || !roleId || !assignedBy) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, roleId, assignedBy' },
        { status: 400 }
      )
    }

    const assignment = await roleManagementService.assignRoleToUser(
      userId,
      roleId,
      assignedBy,
      {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        metadata
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Role atribuído com sucesso',
      data: assignment
    })

  } catch (error) {
    console.error('Error assigning role:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      
      if (error.message.includes('não tem permissão')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Obter role efetivo de um usuário
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const effectiveRole = await roleManagementService.getUserEffectiveRole(userId)

    return NextResponse.json({
      success: true,
      data: effectiveRole
    })

  } catch (error) {
    console.error('Error getting user effective role:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}