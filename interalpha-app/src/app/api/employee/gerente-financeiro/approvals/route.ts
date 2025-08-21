import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_FINANCEIRO']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const priority = searchParams.get('priority');

    // Construir filtros
    const where: any = {
      status: 'PENDENTE'
    };

    // Buscar pagamentos pendentes de aprovação
    let pendingPayments = await prisma.pagamento.findMany({
      where,
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
      },
      orderBy: [
        { dataVencimento: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Simular dados de aprovação (em produção, isso viria de uma tabela específica)
    const approvals = pendingPayments.map(payment => {
      // Determinar prioridade baseada no valor e vencimento
      let priority: 'low' | 'medium' | 'high' = 'medium';
      const daysUntilDue = payment.dataVencimento 
        ? Math.ceil((payment.dataVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30;

      if (payment.valor > 5000 || daysUntilDue < 3) {
        priority = 'high';
      } else if (payment.valor > 1000 || daysUntilDue < 7) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      // Determinar tipo baseado no valor
      let type: 'service' | 'expense' | 'refund' = 'service';
      if (payment.valor < 0) {
        type = 'expense';
      } else if (payment.descricao?.toLowerCase().includes('reembolso') || 
                 payment.descricao?.toLowerCase().includes('estorno')) {
        type = 'refund';
      }

      return {
        id: payment.id,
        clientName: payment.ordemServico?.cliente?.nome || 'Cliente não informado',
        amount: Math.abs(payment.valor),
        description: payment.descricao || `Pagamento - ${payment.metodo}`,
        dueDate: payment.dataVencimento?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        priority,
        type,
        requestedBy: payment.user.name,
        requestedAt: payment.createdAt.toISOString()
      };
    });

    // Filtrar por prioridade se especificado
    const filteredApprovals = priority 
      ? approvals.filter(approval => approval.priority === priority)
      : approvals;

    return NextResponse.json(filteredApprovals);

  } catch (error) {
    console.error('Erro ao buscar aprovações financeiras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}