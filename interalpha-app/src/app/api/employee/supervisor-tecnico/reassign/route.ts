import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['SUPERVISOR_TECNICO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supervisorId = authResult.user.id;
    const { orderId, newTechnicianId, reason } = await request.json();

    // Validar dados de entrada
    if (!orderId || !newTechnicianId) {
      return NextResponse.json(
        { error: 'ID da ordem e ID do técnico são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a ordem existe
    const existingOrder = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: {
        assignedTechnician: {
          select: {
            id: true,
            name: true
          }
        },
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
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o novo técnico existe e está ativo
    const newTechnician = await prisma.employee.findFirst({
      where: {
        id: newTechnicianId,
        role: 'TECNICO',
        isActive: true
      }
    });

    if (!newTechnician) {
      return NextResponse.json(
        { error: 'Técnico não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Verificar se não é o mesmo técnico
    if (existingOrder.assignedTechnicianId === newTechnicianId) {
      return NextResponse.json(
        { error: 'A ordem já está atribuída a este técnico' },
        { status: 400 }
      );
    }

    // Verificar carga de trabalho do novo técnico
    const newTechnicianWorkload = await prisma.serviceOrder.count({
      where: {
        assignedTechnicianId: newTechnicianId,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS']
        }
      }
    });

    // Limite de 8 ordens por técnico (configurável)
    const maxOrdersPerTechnician = 8;
    if (newTechnicianWorkload >= maxOrdersPerTechnician) {
      return NextResponse.json(
        { error: `Técnico já possui ${newTechnicianWorkload} ordens atribuídas (limite: ${maxOrdersPerTechnician})` },
        { status: 400 }
      );
    }

    // Reatribuir a ordem
    const updatedOrder = await prisma.serviceOrder.update({
      where: { id: orderId },
      data: {
        assignedTechnicianId: newTechnicianId,
        // Reset status se estava em progresso
        status: existingOrder.status === 'IN_PROGRESS' ? 'ASSIGNED' : existingOrder.status,
        startedAt: existingOrder.status === 'IN_PROGRESS' ? null : existingOrder.startedAt
      }
    });

    // Log de auditoria
    await auditMiddleware({
      userId: supervisorId,
      action: 'REASSIGN_ORDER',
      resource: 'SERVICE_ORDER',
      resourceId: orderId,
      details: {
        orderId,
        previousTechnicianId: existingOrder.assignedTechnicianId,
        previousTechnicianName: existingOrder.assignedTechnician?.name,
        newTechnicianId,
        newTechnicianName: newTechnician.name,
        reason: reason || 'Reatribuição pelo supervisor',
        clientName: existingOrder.client.nome,
        serviceName: existingOrder.service.name
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Notificar técnicos sobre a mudança (implementar conforme necessário)
    console.log(`Ordem ${orderId} reatribuída de ${existingOrder.assignedTechnician?.name} para ${newTechnician.name}`);

    return NextResponse.json({
      success: true,
      message: 'Ordem reatribuída com sucesso',
      order: {
        id: updatedOrder.id,
        previousTechnician: existingOrder.assignedTechnician?.name,
        newTechnician: newTechnician.name,
        status: updatedOrder.status
      }
    });

  } catch (error) {
    console.error('Erro ao reatribuir ordem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['SUPERVISOR_TECNICO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Buscar ordens que precisam de reatribuição
    const ordersNeedingReassignment = await prisma.serviceOrder.findMany({
      where: {
        OR: [
          // Ordens sem técnico atribuído
          { assignedTechnicianId: null },
          // Ordens com técnico inativo
          {
            assignedTechnician: {
              isActive: false
            }
          },
          // Ordens atrasadas há mais de 2 horas
          {
            status: 'ASSIGNED',
            scheduledDate: {
              lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
            }
          }
        ],
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS']
        }
      },
      include: {
        client: {
          select: {
            nome: true,
            telefone: true
          }
        },
        service: {
          select: {
            name: true,
            category: true
          }
        },
        assignedTechnician: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledDate: 'asc' }
      ]
    });

    // Buscar técnicos disponíveis
    const availableTechnicians = await prisma.employee.findMany({
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
            id: true
          }
        }
      }
    });

    // Calcular disponibilidade dos técnicos
    const techniciansWithAvailability = availableTechnicians.map(tech => ({
      id: tech.id,
      name: tech.name,
      currentLoad: tech.assignedOrders.length,
      maxCapacity: 8,
      available: tech.assignedOrders.length < 8
    }));

    const formattedOrders = ordersNeedingReassignment.map(order => ({
      id: order.id,
      title: order.title,
      clientName: order.client.nome,
      clientPhone: order.client.telefone,
      serviceName: order.service.name,
      serviceCategory: order.service.category,
      priority: order.priority.toLowerCase(),
      status: order.status.toLowerCase(),
      scheduledDate: order.scheduledDate.toISOString(),
      currentTechnician: order.assignedTechnician ? {
        id: order.assignedTechnician.id,
        name: order.assignedTechnician.name,
        isActive: order.assignedTechnician.isActive
      } : null,
      reasonForReassignment: !order.assignedTechnicianId 
        ? 'Sem técnico atribuído'
        : !order.assignedTechnician?.isActive
        ? 'Técnico inativo'
        : 'Ordem atrasada',
      location: order.location
    }));

    return NextResponse.json({
      orders: formattedOrders,
      availableTechnicians: techniciansWithAvailability,
      summary: {
        totalOrders: formattedOrders.length,
        unassignedOrders: formattedOrders.filter(o => !o.currentTechnician).length,
        inactiveTechnicianOrders: formattedOrders.filter(o => o.currentTechnician && !o.currentTechnician.isActive).length,
        overdueOrders: formattedOrders.filter(o => o.reasonForReassignment === 'Ordem atrasada').length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar ordens para reatribuição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}