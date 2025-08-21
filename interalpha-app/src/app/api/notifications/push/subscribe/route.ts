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
    const { subscription, userAgent } = await request.json();

    // Validar dados da subscription
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Dados de subscription inválidos' },
        { status: 400 }
      );
    }

    await pushService.registerSubscription(userId, {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent
    });

    return NextResponse.json({
      success: true,
      message: 'Push notification registrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao registrar push subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}