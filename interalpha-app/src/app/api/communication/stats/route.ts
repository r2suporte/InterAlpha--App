import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'

const communicationService = new CommunicationService()

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId') || undefined
    const type = searchParams.get('type') || 'messages' // 'messages' ou 'tickets'

    let stats
    if (type === 'tickets') {
      stats = await communicationService.getTicketStats(departmentId)
    } else {
      stats = await communicationService.getMessageStats(authResult.user.id, departmentId)
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}