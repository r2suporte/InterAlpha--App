import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const authResult = await authMiddleware(request, ['TECNICO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { orderId } = params;
    const { status } = await request.json();

    // Validar status
    const validStatuses = ['assigned', 'in_progress', 'completed', 'pending_parts'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Verificar se a ordem pertence ao técnico
    const existingOrder = await prisma.serviceOrder.findFirst({
      where: {
        id: orderId,
        assignedTechnicianId: userId
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada ou não atribuída a você' },
        { status: 404 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {
      status: status.toUpperCase()
    };

    // Definir timestamps baseado no status
    const now = new Date();
    switch (status) {
      case 'in_progress':
        if (!existingOrder.startedAt) {
          updateData.startedAt = now;
        }
        break;
      case 'completed':
        if (!existingOrder.startedAt) {
          updateData.startedAt = existingOrder.createdAt;
        }
        updateData.completedAt = now;
        break;
      case 'pending_parts':
        if (!existingOrder.startedAt) {
          updateData.startedAt = now;
        }
        break;
    }

    // Atualizar ordem
    const updatedOrder = await prisma.serviceOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    });

    // Log de auditoria
    await auditMiddleware({
      userId,
      action: 'UPDATE_ORDER_STATUS',
      resource: 'SERVICE_ORDER',
      resourceId: orderId,
      details: {
        previousStatus: existingOrder.status,
        newStatus: status.toUpperCase(),
        orderId,
        clientName: updatedOrder.client.name,
        serviceName: updatedOrder.service.name
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Notificar cliente sobre mudança de status (se necessário)
    if (status === 'completed') {
      // Aqui você pode adicionar lógica para notificar o cliente
      console.log(`Ordem ${orderId} concluída pelo técnico ${userId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso',
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status.toLowerCase(),
        startedAt: updatedOrder.startedAt?.toISOString(),
        completedAt: updatedOrder.completedAt?.toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar status da ordem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}