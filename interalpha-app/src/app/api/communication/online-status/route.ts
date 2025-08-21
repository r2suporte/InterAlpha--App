import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/services/communication/communication-service'
import { authMiddleware } from '@/middleware/auth-middleware'
import { UserStatus } from '@/types/communication'

const communicationService = new CommunicationService()

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId') || undefined

    const onlineUsers = communicationService.getOnlineUsers(departmentId)

    return NextResponse.json({
      success: true,
      data: onlineUsers
    })
  } catch (error) {
    console.error('Erro ao buscar usuários online:', error)
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
    const { status, activity } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se o status é válido
    if (!Object.values(UserStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    communicationService.setUserOnlineStatus(
      authResult.user.id,
      status,
      activity
    )

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar status online:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}