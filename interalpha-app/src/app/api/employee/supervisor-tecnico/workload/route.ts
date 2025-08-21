import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['SUPERVISOR_TECNICO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Buscar todos os técnicos ativos
    const technicians = await prisma.employee.findMany({
      where: {
        role: 'TECNICO',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        assignedOrders: {
          where: {
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS']
            }
          },
          select: {
            id: true,
            priority: true,
            scheduledDate: true
          }
        }
      }
    });

    // Calcular carga de trabalho para cada técnico
    const workloadData = technicians.map(technician => {
      const assignedOrders = technician.assignedOrders.length;
      
      // Capacidade baseada em 8 ordens por dia (configurável)
      const capacity = 8;
      
      // Taxa de utilização
      const utilizationRate = Math.round((assignedOrders / capacity) * 100);

      // Calcular peso das ordens baseado na prioridade
      const priorityWeight = technician.assignedOrders.reduce((acc, order) => {
        switch (order.priority) {
          case 'URGENT': return acc + 2;
          case 'HIGH': return acc + 1.5;
          case 'MEDIUM': return acc + 1;
          case 'LOW': return acc + 0.5;
          default: return acc + 1;
        }
      }, 0);

      // Calcular ordens atrasadas
      const now = new Date();
      const overdueOrders = technician.assignedOrders.filter(order => 
        new Date(order.scheduledDate) < now
      ).length;

      return {
        technicianId: technician.id,
        technicianName: technician.name,
        assignedOrders,
        capacity,
        utilizationRate,
        priorityWeight,
        overdueOrders,
        status: utilizationRate >= 90 ? 'overloaded' : 
                utilizationRate >= 70 ? 'busy' : 'available'
      };
    });

    // Ordenar por taxa de utilização (maior primeiro)
    workloadData.sort((a, b) => b.utilizationRate - a.utilizationRate);

    // Calcular estatísticas gerais
    const totalOrders = workloadData.reduce((acc, data) => acc + data.assignedOrders, 0);
    const totalCapacity = workloadData.reduce((acc, data) => acc + data.capacity, 0);
    const averageUtilization = totalCapacity > 0 ? Math.round((totalOrders / totalCapacity) * 100) : 0;
    
    const overloadedTechnicians = workloadData.filter(data => data.utilizationRate >= 90).length;
    const availableTechnicians = workloadData.filter(data => data.utilizationRate < 70).length;

    return NextResponse.json({
      workloadData,
      summary: {
        totalOrders,
        totalCapacity,
        averageUtilization,
        overloadedTechnicians,
        availableTechnicians,
        totalTechnicians: technicians.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar carga de trabalho:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}