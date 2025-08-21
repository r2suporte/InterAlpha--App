import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_FINANCEIRO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const managerId = authResult.user.id;
    const { paymentId, approved, reason } = await request.json();

    // Validar dados de entrada
    if (!paymentId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'ID do pagamento e status de aprovação são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o pagamento existe e está pendente
    const existingPayment = await prisma.pagamento.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        ordemServico: {
          include: {
            cliente: {
              select: {
                nome: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    if (existingPayment.status !== 'PENDENTE') {
      return NextResponse.json(
        { error: 'Pagamento já foi processado' },
        { status: 400 }
      );
    }

    // Atualizar status do pagamento
    const newStatus = approved ? 'APROVADO' : 'REJEITADO';
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date()
    };

    // Se aprovado, definir data de pagamento
    if (approved) {
      updateData.dataPagamento = new Date();
      updateData.status = 'PAGO'; // Assumindo que aprovação = pagamento imediato
    }

    const updatedPayment = await prisma.pagamento.update({
      where: { id: paymentId },
      data: updateData
    });

    // Log de auditoria
    await auditMiddleware({
      userId: managerId,
      action: approved ? 'APPROVE_PAYMENT' : 'REJECT_PAYMENT',
      resource: 'PAYMENT',
      resourceId: paymentId,
      details: {
        paymentId,
        amount: existingPayment.valor,
        clientName: existingPayment.ordemServico?.cliente?.nome,
        requestedBy: existingPayment.user.name,
        reason: reason || (approved ? 'Aprovado pelo gerente financeiro' : 'Rejeitado pelo gerente financeiro'),
        previousStatus: existingPayment.status,
        newStatus
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Notificar usuário sobre a decisão (implementar conforme necessário)
    console.log(`Pagamento ${paymentId} ${approved ? 'aprovado' : 'rejeitado'} por ${managerId}`);

    // Se aprovado, processar integração contábil
    if (approved) {
      try {
        // Criar registro de sincronização contábil
        const activeSystems = await prisma.accountingSystem.findMany({
          where: { isActive: true }
        });

        for (const system of activeSystems) {
          await prisma.accountingSync.create({
            data: {
              entityType: 'payment',
              entityId: paymentId,
              systemId: system.id,
              status: 'pending'
            }
          });
        }
      } catch (syncError) {
        console.error('Erro ao criar sincronização contábil:', syncError);
        // Não falhar a aprovação por erro de sincronização
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pagamento ${approved ? 'aprovado' : 'rejeitado'} com sucesso`,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.valor,
        approvedAt: updatedPayment.dataPagamento?.toISOString(),
        approvedBy: managerId
      }
    });

  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}