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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      assignedTechnicianId: userId
    };

    if (startDate && endDate) {
      where.completedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    // Buscar histórico com paginação
    const [orders, totalCount] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        include: {
          client: {
            select: {
              nome: true,
              email: true,
              telefone: true
            }
          },
          service: {
            select: {
              name: true,
              description: true,
              category: true
            }
          },
          technicalReports: {
            select: {
              id: true,
              status: true,
              timeSpent: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        },
        skip,
        take: limit
      }),

      prisma.serviceOrder.count({ where })
    ]);

    // Formatar dados
    const formattedOrders = orders.map(order => {
      const duration = order.startedAt && order.completedAt 
        ? Math.round((order.completedAt.getTime() - order.startedAt.getTime()) / (1000 * 60 * 60))
        : null;

      return {
        id: order.id,
        title: order.title,
        clientName: order.client.nome,
        clientPhone: order.client.telefone,
        serviceName: order.service.name,
        serviceCategory: order.service.category,
        status: order.status.toLowerCase(),
        priority: order.priority.toLowerCase(),
        scheduledDate: order.scheduledDate.toISOString(),
        startedAt: order.startedAt?.toISOString(),
        completedAt: order.completedAt?.toISOString(),
        duration,
        location: order.location,
        finalValue: order.finalValue,
        hasReport: order.technicalReports.length > 0,
        reportStatus: order.technicalReports[0]?.status?.toLowerCase(),
        createdAt: order.createdAt.toISOString()
      };
    });

    // Calcular estatísticas do período
    const stats = {
      totalOrders: totalCount,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
      averageDuration: formattedOrders
        .filter(o => o.duration !== null)
        .reduce((acc, o) => acc + (o.duration || 0), 0) / 
        formattedOrders.filter(o => o.duration !== null).length || 0,
      totalValue: orders.reduce((acc, o) => acc + (o.finalValue || 0), 0)
    };

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      stats
    });

  } catch (error) {
    console.error('Erro ao buscar histórico do técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}