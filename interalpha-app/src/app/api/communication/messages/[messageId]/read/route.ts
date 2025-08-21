import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'

const communicationService = new CommunicationService()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { messageId } = params

    if (!messageId) {
      return NextResponse.json(
        { error: 'ID da mensagem é obrigatório' },
        { status: 400 }
      )
    }

    await communicationService.markMessageAsRead(messageId, authResult.user.id)

    return NextResponse.json({
      success: true,
      message: 'Mensagem marcada como lida'
    })
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}