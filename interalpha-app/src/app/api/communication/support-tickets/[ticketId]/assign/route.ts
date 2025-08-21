import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'
import { rbacMiddleware } from '@/middleware/rbac-middleware'

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

    // Verificar permissões para atribuir tickets
    const rbacResult = await rbacMiddleware(request, 'support_tickets', 'assign')
    if (!rbacResult.success) {
      return NextResponse.json({ error: rbacResult.error }, { status: 403 })
    }

    const { ticketId } = params
    const body = await request.json()
    const { assignedTo } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      )
    }

    if (!assignedTo) {
      return NextResponse.json(
        { error: 'Usuário para atribuição é obrigatório' },
        { status: 400 }
      )
    }

    await communicationService.assignTicket(
      ticketId,
      assignedTo,
      authResult.user.id
    )

    return NextResponse.json({
      success: true,
      message: 'Ticket atribuído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atribuir ticket:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}