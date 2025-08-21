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
    const period = parseInt(searchParams.get('period') || '30'); // dias

    // Calcular datas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Buscar métricas financeiras
    const [receivedPayments, paidPayments, pendingReceivables, pendingPayables] = await Promise.all([
      // Pagamentos recebidos no período
      prisma.pagamento.findMany({
        where: {
          dataPagamento: {
            gte: startDate,
            lte: endDate
          },
          status: 'PAGO'
        },
        select: {
          valor: true
        }
      }),

      // Pagamentos realizados no período (despesas)
      prisma.pagamento.findMany({
        where: {
          dataPagamento: {
            gte: startDate,
            lte: endDate
          },
          status: 'PAGO',
          valor: {
            lt: 0 // Assumindo que despesas são valores negativos
          }
        },
        select: {
          valor: true
        }
      }),

      // Contas a receber (pagamentos pendentes de clientes)
      prisma.pagamento.findMany({
        where: {
          status: 'PENDENTE',
          valor: {
            gt: 0 // Receitas
          }
        },
        select: {
          valor: true
        }
      }),

      // Contas a pagar (despesas pendentes)
      prisma.pagamento.findMany({
        where: {
          status: 'PENDENTE',
          valor: {
            lt: 0 // Despesas
          }
        },
        select: {
          valor: true
        }
      })
    ]);

    // Calcular receitas e despesas
    const totalReceived = receivedPayments.reduce((sum, payment) => sum + payment.valor, 0);
    const totalPaid = Math.abs(paidPayments.reduce((sum, payment) => sum + payment.valor, 0));

    // Calcular fluxo de caixa
    const cashFlow = totalReceived - totalPaid;

    // Calcular contas a receber
    const accountsReceivable = pendingReceivables.reduce((sum, payment) => sum + payment.valor, 0);

    // Calcular contas a pagar
    const accountsPayable = Math.abs(pendingPayables.reduce((sum, payment) => sum + payment.valor, 0));

    // Calcular margem de lucro
    const profitMargin = totalReceived > 0 ? Math.round(((totalReceived - totalPaid) / totalReceived) * 100) : 0;

    // Calcular despesas operacionais (simulado - em produção seria baseado em categorias específicas)
    const operatingExpenses = totalPaid * 0.7; // Assumindo 70% das despesas são operacionais

    const metrics = {
      cashFlow,
      accountsReceivable,
      accountsPayable,
      profitMargin,
      operatingExpenses
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Erro ao buscar métricas financeiras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}