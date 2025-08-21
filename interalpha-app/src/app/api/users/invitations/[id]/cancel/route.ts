import { NextRequest, NextResponse } from 'next/server'
import { userManagementService } from '@/services/user-management/user-management-service'

// Cancelar convite
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const cancelledBy = request.headers.get('x-user-id')

    if (!cancelledBy) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const success = await userManagementService.cancelInvitation(id, cancelledBy)

    if (!success) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Convite cancelado com sucesso'
    })

  } catch (error) {
    console.error('Error cancelling invitation:', error)
    
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