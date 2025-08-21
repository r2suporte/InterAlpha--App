import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/auth-middleware';
import { NotificationService } from '@/services/notifications/notification-service';

const notificationService = new NotificationService();

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;

    await notificationService.markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    });

  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}