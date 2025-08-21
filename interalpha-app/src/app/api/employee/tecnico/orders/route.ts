import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['TECNICO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir filtros
    const where: any = {
      assignedTechnicianId: userId
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    // Buscar ordens de serviço
    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            name: true,
            description: true,
            estimatedDuration: true
          }
        },
        assignedTechnician: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledDate: 'asc' }
      ],
      take: limit
    });

    // Formatar dados para o frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      clientName: order.client.name,
      service: order.service.name,
      priority: order.priority.toLowerCase(),
      status: order.status.toLowerCase(),
      scheduledDate: order.scheduledDate.toISOString(),
      location: order.location || 'Não informado',
      estimatedDuration: order.service.estimatedDuration || 2,
      description: order.description || order.service.description,
      createdAt: order.createdAt.toISOString(),
      startedAt: order.startedAt?.toISOString(),
      completedAt: order.completedAt?.toISOString()
    }));

    return NextResponse.json(formattedOrders);

  } catch (error) {
    console.error('Erro ao buscar ordens do técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}