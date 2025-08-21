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
    const period = searchParams.get('period') || '30'; // dias
    const type = searchParams.get('type') || 'summary';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    if (type === 'summary') {
      // Relatório resumo
      const [totalOrders, completedOrders, avgTime, topServices] = await Promise.all([
        // Total de ordens no período
        prisma.serviceOrder.count({
          where: {
            assignedTechnicianId: userId,
            createdAt: { gte: startDate }
          }
        }),

        // Ordens concluídas
        prisma.serviceOrder.count({
          where: {
            assignedTechnicianId: userId,
            status: 'COMPLETED',
            completedAt: { gte: startDate }
          }
        }),

        // Tempo médio de conclusão
        prisma.serviceOrder.findMany({
          where: {
            assignedTechnicianId: userId,
            status: 'COMPLETED',
            startedAt: { not: null },
            completedAt: { gte: startDate }
          },
          select: {
            startedAt: true,
            completedAt: true
          }
        }),

        // Serviços mais executados
        prisma.serviceOrder.groupBy({
          by: ['serviceId'],
          where: {
            assignedTechnicianId: userId,
            completedAt: { gte: startDate }
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 5
        })
      ]);

      // Calcular tempo médio
      let averageTime = 0;
      if (avgTime.length > 0) {
        const totalTime = avgTime.reduce((acc, order) => {
          if (order.startedAt && order.completedAt) {
            return acc + (order.completedAt.getTime() - order.startedAt.getTime());
          }
          return acc;
        }, 0);
        averageTime = Math.round(totalTime / avgTime.length / (1000 * 60 * 60)); // horas
      }

      // Buscar nomes dos serviços mais executados
      const serviceIds = topServices.map(s => s.serviceId);
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true }
      });

      const topServicesWithNames = topServices.map(ts => ({
        serviceName: services.find(s => s.id === ts.serviceId)?.name || 'Desconhecido',
        count: ts._count.id
      }));

      return NextResponse.json({
        period: parseInt(period),
        summary: {
          totalOrders,
          completedOrders,
          completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
          averageTime,
          topServices: topServicesWithNames
        }
      });

    } else if (type === 'detailed') {
      // Relatório detalhado
      const orders = await prisma.serviceOrder.findMany({
        where: {
          assignedTechnicianId: userId,
          createdAt: { gte: startDate }
        },
        include: {
          client: {
            select: {
              name: true,
              email: true
            }
          },
          service: {
            select: {
              name: true,
              description: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const detailedOrders = orders.map(order => ({
        id: order.id,
        clientName: order.client.name,
        serviceName: order.service.name,
        status: order.status.toLowerCase(),
        priority: order.priority.toLowerCase(),
        createdAt: order.createdAt.toISOString(),
        scheduledDate: order.scheduledDate.toISOString(),
        startedAt: order.startedAt?.toISOString(),
        completedAt: order.completedAt?.toISOString(),
        duration: order.startedAt && order.completedAt 
          ? Math.round((order.completedAt.getTime() - order.startedAt.getTime()) / (1000 * 60 * 60))
          : null,
        location: order.location
      }));

      return NextResponse.json({
        period: parseInt(period),
        orders: detailedOrders
      });

    } else {
      return NextResponse.json(
        { error: 'Tipo de relatório inválido' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao gerar relatório técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['TECNICO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { orderId, reportData } = await request.json();

    // Validar se a ordem pertence ao técnico
    const order = await prisma.serviceOrder.findFirst({
      where: {
        id: orderId,
        assignedTechnicianId: userId
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Criar relatório técnico
    const report = await prisma.technicalReport.create({
      data: {
        serviceOrderId: orderId,
        technicianId: userId,
        description: reportData.description,
        workPerformed: reportData.workPerformed,
        partsUsed: reportData.partsUsed || [],
        timeSpent: reportData.timeSpent,
        clientSignature: reportData.clientSignature,
        photos: reportData.photos || [],
        recommendations: reportData.recommendations,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Relatório técnico criado com sucesso',
      reportId: report.id
    });

  } catch (error) {
    console.error('Erro ao criar relatório técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}