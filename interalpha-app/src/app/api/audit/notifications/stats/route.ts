import { NextRequest, NextResponse } from 'next/server'
import { notificationQueueService } from '@/services/notifications/notification-queue-service'

// Obter estatísticas da fila de notificações
export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const stats = await notificationQueueService.getQueueStats()

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error getting notification queue stats:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Limpar fila de notificações
export async function DELETE(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    await notificationQueueService.clearQueue()

    return NextResponse.json({
      success: true,
      message: 'Fila de notificações limpa com sucesso'
    })

  } catch (error) {
    console.error('Error clearing notification queue:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}