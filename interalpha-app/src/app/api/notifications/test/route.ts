import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/auth-middleware';
import { NotificationService } from '@/services/notifications/notification-service';

const notificationService = new NotificationService();

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;

    // Criar notificação de teste
    await notificationService.createNotification({
      userId,
      type: 'custom',
      title: 'Notificação de Teste',
      message: 'Esta é uma notificação de teste do sistema InterAlpha. Se você está vendo isso, as notificações estão funcionando corretamente!',
      priority: 'medium',
      category: 'general',
      data: {
        testId: Date.now(),
        source: 'notification_settings'
      },
      channels: ['in_app', 'email', 'push']
    });

    return NextResponse.json({
      success: true,
      message: 'Notificação de teste enviada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}