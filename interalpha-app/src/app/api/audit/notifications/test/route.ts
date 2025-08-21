import { NextRequest, NextResponse } from 'next/server'
import { auditNotificationService } from '@/services/notifications/audit-notification-service'

// Testar sistema de notificações
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const { 
      testType = 'all', // 'email', 'sms', 'all'
      recipients 
    } = body

    let results: any = {}

    switch (testType) {
      case 'email':
        results = await auditNotificationService.testNotifications(
          recipients ? { emails: recipients.emails } : undefined
        )
        results = { email: results.email }
        break

      case 'sms':
        results = await auditNotificationService.testNotifications(
          recipients ? { phones: recipients.phones } : undefined
        )
        results = { sms: results.sms }
        break

      case 'all':
      default:
        results = await auditNotificationService.testNotifications(recipients)
        break
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de notificações executado',
      data: results
    })

  } catch (error) {
    console.error('Error testing notifications:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}