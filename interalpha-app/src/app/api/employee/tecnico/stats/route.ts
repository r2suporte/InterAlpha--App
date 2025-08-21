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

    // Buscar estatísticas do técnico
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [assignedOrders, completedToday, pendingOrders, allCompletedOrders] = await Promise.all([
      // Ordens atribuídas (assigned + in_progress + pending_parts)
      prisma.serviceOrder.count({
        where: {
          assignedTechnicianId: userId,
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS']
          }
        }
      }),

      // Ordens concluídas hoje
      prisma.serviceOrder.count({
        where: {
          assignedTechnicianId: userId,
          status: 'COMPLETED',
          completedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),

      // Ordens pendentes (apenas assigned)
      prisma.serviceOrder.count({
        where: {
          assignedTechnicianId: userId,
          status: 'ASSIGNED'
        }
      }),

      // Todas as ordens concluídas para calcular tempo médio
      prisma.serviceOrder.findMany({
        where: {
          assignedTechnicianId: userId,
          status: 'COMPLETED',
          startedAt: { not: null },
          completedAt: { not: null }
        },
        select: {
          startedAt: true,
          completedAt: true
        }
      })
    ]);

    // Calcular tempo médio de conclusão
    let averageCompletionTime = 0;
    if (allCompletedOrders.length > 0) {
      const totalTime = allCompletedOrders.reduce((acc, order) => {
        if (order.startedAt && order.completedAt) {
          const duration = order.completedAt.getTime() - order.startedAt.getTime();
          return acc + duration;
        }
        return acc;
      }, 0);
      
      averageCompletionTime = Math.round(totalTime / allCompletedOrders.length / (1000 * 60 * 60)); // em horas
    }

    const stats = {
      assignedOrders,
      completedToday,
      pendingOrders,
      averageCompletionTime
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas do técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}