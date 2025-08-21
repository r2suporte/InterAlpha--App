import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/auth-middleware';
import { PushNotificationService } from '@/services/notifications/push-notification-service';

const pushService = new PushNotificationService();

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint é obrigatório' },
        { status: 400 }
      );
    }

    await pushService.unregisterSubscription(userId, endpoint);

    return NextResponse.json({
      success: true,
      message: 'Push notification removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover push subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}