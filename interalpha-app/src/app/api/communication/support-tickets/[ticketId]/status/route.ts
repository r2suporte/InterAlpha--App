import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'
import { TicketStatus } from '@/types/communication'

const communicationService = new CommunicationService()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { ticketId } = params
    const body = await request.json()
    const { status } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se o status é válido
    if (!Object.values(TicketStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    await communicationService.updateTicketStatus(
      ticketId,
      status,
      authResult.user.id
    )

    return NextResponse.json({
      success: true,
      message: 'Status do ticket atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar status do ticket:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}