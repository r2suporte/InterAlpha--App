import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'
import { ChatRoomType, ChatRoomFilters } from '@/types/communication'

const communicationService = new CommunicationService()

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters: ChatRoomFilters = {
      type: searchParams.get('type') as ChatRoomType || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    const chatRooms = await communicationService.getChatRooms(authResult.user.id, filters)

    return NextResponse.json({
      success: true,
      data: chatRooms
    })
  } catch (error) {
    console.error('Erro ao buscar salas de chat:', error)
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
      name,
      description,
      type,
      departmentId,
      participantIds
    } = body

    // Validações
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome da sala é obrigatório' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Tipo da sala é obrigatório' },
        { status: 400 }
      )
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'Lista de participantes é obrigatória' },
        { status: 400 }
      )
    }

    // Adicionar o criador à lista de participantes se não estiver
    if (!participantIds.includes(authResult.user.id)) {
      participantIds.push(authResult.user.id)
    }

    const chatRoom = await communicationService.createChatRoom({
      name,
      description,
      type,
      departmentId,
      createdBy: authResult.user.id,
      participantIds
    })

    return NextResponse.json({
      success: true,
      data: chatRoom
    })
  } catch (error) {
    console.error('Erro ao criar sala de chat:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}