import { NextRequest, NextResponse } from 'next/server'
import { auditNotificationService } from '@/services/notifications/audit-notification-service'

// Obter configurações de notificação
export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const stats = await auditNotificationService.getNotificationStats()
    const settings = auditNotificationService.getSettings()
    const recipients = auditNotificationService.getDefaultRecipients()

    return NextResponse.json({
      success: true,
      data: {
        stats,
        settings,
        recipients
      }
    })

  } catch (error) {
    console.error('Error getting notification settings:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Atualizar configurações de notificação
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const { settings, recipients } = body

    if (settings) {
      await auditNotificationService.updateSettings(settings)
    }

    if (recipients) {
      await auditNotificationService.updateDefaultRecipients(recipients)
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações de notificação atualizadas com sucesso'
    })

  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}