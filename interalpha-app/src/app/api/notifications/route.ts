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
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const category = searchParams.get('category') as any;
    const priority = searchParams.get('priority') as any;

    const result = await notificationService.getUserNotifications(userId, {
      limit,
      offset,
      unreadOnly,
      category,
      priority
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM', 'SUPERVISOR_TECNICO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const {
      userId,
      type,
      title,
      message,
      priority,
      category,
      data,
      actionUrl,
      actionLabel,
      expiresAt,
      channels
    } = await request.json();

    // Validar dados obrigatórios
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'userId, type, title e message são obrigatórios' },
        { status: 400 }
      );
    }

    const notification = await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      priority,
      category,
      data,
      actionUrl,
      actionLabel,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      channels
    });

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}