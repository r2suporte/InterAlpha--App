import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Resolver evento de segurança
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const body = await request.json()
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const { resolution } = body

    const success = await auditService.resolveSecurityEvent(
      eventId,
      currentUserId,
      resolution
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Evento de segurança não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Evento de segurança resolvido com sucesso'
    })

  } catch (error) {
    console.error('Error resolving security event:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}