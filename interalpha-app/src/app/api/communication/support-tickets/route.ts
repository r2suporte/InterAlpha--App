import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'
import { TicketCategory, MessagePriority, TicketFilters, TicketStatus } from '@/types/communication'

const communicationService = new CommunicationService()

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters: TicketFilters = {
      category: searchParams.get('category') as TicketCategory || undefined,
      priority: searchParams.get('priority') as MessagePriority || undefined,
      status: searchParams.get('status') as TicketStatus || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      searchTerm: searchParams.get('searchTerm') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    const tickets = await communicationService.getTickets(authResult.user.id, filters)

    return NextResponse.json({
      success: true,
      data: tickets
    })
  } catch (error) {
    console.error('Erro ao buscar tickets:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const {
      clientId,
      subject,
      description,
      category,
      priority,
      departmentId,
      attachments
    } = body

    // Validações
    if (!subject || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Assunto é obrigatório' },
        { status: 400 }
      )
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria é obrigatória' },
        { status: 400 }
      )
    }

    const ticket = await communicationService.createSupportTicket({
      clientId,
      employeeId: authResult.user.role !== 'client' ? authResult.user.id : undefined,
      subject,
      description,
      category,
      priority: priority || MessagePriority.NORMAL,
      departmentId,
      attachments
    })

    return NextResponse.json({
      success: true,
      data: ticket
    })
  } catch (error) {
    console.error('Erro ao criar ticket:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}