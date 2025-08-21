import { NextRequest, NextResponse } from 'next/server'
import { roleManagementService } from '@/services/rbac/role-management-service'

// Revogar role de usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const body = await request.json()
    const { revokedBy } = body

    if (!revokedBy) {
      return NextResponse.json(
        { error: 'revokedBy é obrigatório' },
        { status: 400 }
      )
    }

    const success = await roleManagementService.revokeUserRole(userId, revokedBy)

    if (!success) {
      return NextResponse.json(
        { error: 'Usuário não possui role ativo para revogar' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role revogado com sucesso'
    })

  } catch (error) {
    console.error('Error revoking role:', error)
    
    if (error instanceof Error) {
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