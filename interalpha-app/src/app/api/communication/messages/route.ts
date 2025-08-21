import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'
import { MessageType, MessagePriority, MessageFilters } from '@/types/communication'

const communicationService = new CommunicationService()

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters: MessageFilters = {
      messageType: searchParams.get('messageType') as MessageType || undefined,
      priority: searchParams.get('priority') as MessagePriority || undefined,
      recipientId: searchParams.get('recipientId') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      searchTerm: searchParams.get('searchTerm') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    const messages = await communicationService.getMessages(authResult.user.id, filters)

    return NextResponse.json({
      success: true,
      data: messages
    })
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
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
      recipientId,
      departmentId,
      subject,
      content,
      messageType,
      priority,
      attachments,
      parentMessageId
    } = body

    // Validações
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo da mensagem é obrigatório' },
        { status: 400 }
      )
    }

    if (!messageType) {
      return NextResponse.json(
        { error: 'Tipo de mensagem é obrigatório' },
        { status: 400 }
      )
    }

    if (messageType === MessageType.DIRECT && !recipientId) {
      return NextResponse.json(
        { error: 'Destinatário é obrigatório para mensagens diretas' },
        { status: 400 }
      )
    }

    if (messageType === MessageType.DEPARTMENT && !departmentId) {
      return NextResponse.json(
        { error: 'Departamento é obrigatório para mensagens de departamento' },
        { status: 400 }
      )
    }

    const message = await communicationService.sendMessage({
      senderId: authResult.user.id,
      recipientId,
      departmentId,
      subject,
      content,
      messageType,
      priority: priority || MessagePriority.NORMAL,
      attachments,
      parentMessageId
    })

    return NextResponse.json({
      success: true,
      data: message
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}