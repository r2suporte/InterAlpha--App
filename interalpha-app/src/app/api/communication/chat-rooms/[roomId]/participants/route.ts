import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'

const communicationService = new CommunicationService()

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { roomId } = params
    const body = await request.json()
    const { userId } = body

    if (!roomId) {
      return NextResponse.json(
        { error: 'ID da sala é obrigatório' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    await communicationService.addParticipantToChatRoom(
      roomId,
      userId,
      authResult.user.id
    )

    return NextResponse.json({
      success: true,
      message: 'Participante adicionado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao adicionar participante:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}