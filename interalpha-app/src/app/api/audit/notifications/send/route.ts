import { NextRequest, NextResponse } from 'next/server'
import { auditNotificationService } from '@/services/notifications/audit-notification-service'

// Enviar notificação manual
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
      type, // 'critical_alert', 'audit_report'
      title,
      message,
      recipients,
      reportData,
      downloadUrl
    } = body

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: type, title' },
        { status: 400 }
      )
    }

    let success = false

    switch (type) {
      case 'critical_alert':
        if (!message) {
          return NextResponse.json(
            { error: 'Campo message é obrigatório para alertas críticos' },
            { status: 400 }
          )
        }
        success = await auditNotificationService.sendCriticalAlert(
          title,
          message,
          recipients
        )
        break

      case 'audit_report':
        success = await auditNotificationService.sendAuditReportNotification(
          title,
          reportData || {},
          downloadUrl,
          recipients
        )
        break

      default:
        return NextResponse.json(
          { error: 'Tipo de notificação inválido' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: success 
        ? 'Notificação enviada com sucesso' 
        : 'Falha ao enviar notificação',
      data: { sent: success }
    })

  } catch (error) {
    console.error('Error sending manual notification:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}