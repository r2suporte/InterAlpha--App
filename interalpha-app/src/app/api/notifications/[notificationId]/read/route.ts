import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/auth-middleware';
import { NotificationService } from '@/services/notifications/notification-service';

const notificationService = new NotificationService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { notificationId } = params;

    await notificationService.markAsRead(notificationId, userId);

    return NextResponse.json({
      success: true,
      message: 'Notificação marcada como lida'
    });

  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}