import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/auth-middleware';
import { NotificationService } from '@/services/notifications/notification-service';

const notificationService = new NotificationService();

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;

    const preferences = await notificationService.getUserPreferences(userId);

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Erro ao buscar preferências de notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;
    const preferences = await request.json();

    const updatedPreferences = await notificationService.updateUserPreferences(
      userId,
      preferences
    );

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences
    });

  } catch (error) {
    console.error('Erro ao atualizar preferências de notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}