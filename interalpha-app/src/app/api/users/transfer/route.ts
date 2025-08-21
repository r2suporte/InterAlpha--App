import { NextRequest, NextResponse } from 'next/server'
import { userManagementService } from '@/services/user-management/user-management-service'

// Transferir responsabilidades
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const transferredBy = request.headers.get('x-user-id')

    if (!transferredBy) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const { fromUserId, toUserId, reason } = body

    // Validar dados obrigatórios
    if (!fromUserId || !toUserId || !reason) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: fromUserId, toUserId, reason' },
        { status: 400 }
      )
    }

    // Validar que não está transferindo para si mesmo
    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: 'Não é possível transferir responsabilidades para o mesmo usuário' },
        { status: 400 }
      )
    }

    const transfer = await userManagementService.transferUserResponsibilities(
      fromUserId,
      toUserId,
      transferredBy,
      reason
    )

    return NextResponse.json({
      success: true,
      message: 'Transferência iniciada com sucesso',
      data: transfer
    })

  } catch (error) {
    console.error('Error transferring responsibilities:', error)
    
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