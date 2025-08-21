import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['SUPERVISOR_TECNICO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Buscar todos os técnicos da equipe
    const technicians = await prisma.employee.findMany({
      where: {
        role: 'TECNICO',
        isActive: true
      },
      include: {
        assignedOrders: {
          where: {
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS']
            }
          },
          include: {
            client: {
              select: {
                nome: true
              }
            },
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Buscar estatísticas de cada técnico
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const teamMembers = await Promise.all(
      technicians.map(async (technician) => {
        // Ordens concluídas hoje
        const completedToday = await prisma.serviceOrder.count({
          where: {
            assignedTechnicianId: technician.id,
            status: 'COMPLETED',
            completedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        // Tempo médio de conclusão
        const completedOrders = await prisma.serviceOrder.findMany({
          where: {
            assignedTechnicianId: technician.id,
            status: 'COMPLETED',
            startedAt: { not: null },
            completedAt: { not: null }
          },
          select: {
            startedAt: true,
            completedAt: true
          },
          take: 10 // últimas 10 ordens para calcular média
        });

        let averageTime = 0;
        if (completedOrders.length > 0) {
          const totalTime = completedOrders.reduce((acc, order) => {
            if (order.startedAt && order.completedAt) {
              return acc + (order.completedAt.getTime() - order.startedAt.getTime());
            }
            return acc;
          }, 0);
          averageTime = Math.round(totalTime / completedOrders.length / (1000 * 60 * 60)); // em horas
        }

        // Determinar status do técnico
        const currentOrder = technician.assignedOrders.find(order => order.status === 'IN_PROGRESS');
        let status: 'available' | 'busy' | 'offline' = 'available';
        
        if (currentOrder) {
          status = 'busy';
        } else if (technician.lastLoginAt) {
          const lastLogin = new Date(technician.lastLoginAt);
          const hoursSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLogin > 8) { // Considerado offline se não fez login há mais de 8 horas
            status = 'offline';
          }
        } else {
          status = 'offline';
        }

        return {
          id: technician.id,
          name: technician.name,
          email: technician.email,
          assignedOrders: technician.assignedOrders.length,
          completedToday,
          averageTime,
          status,
          currentOrder: currentOrder ? {
            id: currentOrder.id,
            clientName: currentOrder.client.nome,
            service: currentOrder.service.name,
            startedAt: currentOrder.startedAt?.toISOString() || currentOrder.createdAt.toISOString()
          } : undefined
        };
      })
    );

    return NextResponse.json(teamMembers);

  } catch (error) {
    console.error('Erro ao buscar equipe técnica:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}