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

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - period);
    const previousEndDate = new Date(startDate);

    // Buscar estatísticas financeiras
    const [currentPeriodPayments, previousPeriodPayments, pendingPayments, overduePayments, approvedPayments] = await Promise.all([
      // Pagamentos do período atual
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

      // Pagamentos do período anterior (para calcular crescimento)
      prisma.pagamento.findMany({
        where: {
          dataPagamento: {
            gte: previousStartDate,
            lt: previousEndDate
          },
          status: 'PAGO'
        },
        select: {
          valor: true
        }
      }),

      // Pagamentos pendentes
      prisma.pagamento.count({
        where: {
          status: 'PENDENTE'
        }
      }),

      // Pagamentos em atraso
      prisma.pagamento.count({
        where: {
          status: 'PENDENTE',
          dataVencimento: {
            lt: new Date()
          }
        }
      }),

      // Pagamentos aprovados no período
      prisma.pagamento.count({
        where: {
          status: 'PAGO',
          dataPagamento: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    // Calcular receita total do período atual
    const totalRevenue = currentPeriodPayments.reduce((sum, payment) => sum + payment.valor, 0);

    // Calcular receita do período anterior
    const previousRevenue = previousPeriodPayments.reduce((sum, payment) => sum + payment.valor, 0);

    // Calcular crescimento da receita
    const revenueGrowth = previousRevenue > 0 
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    // Calcular receita mensal (últimos 30 dias)
    const monthStartDate = new Date();
    monthStartDate.setDate(monthStartDate.getDate() - 30);

    const monthlyPayments = await prisma.pagamento.findMany({
      where: {
        dataPagamento: {
          gte: monthStartDate,
          lte: endDate
        },
        status: 'PAGO'
      },
      select: {
        valor: true
      }
    });

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.valor, 0);

    // Calcular ticket médio
    const averageTicket = approvedPayments > 0 ? totalRevenue / approvedPayments : 0;

    const stats = {
      totalRevenue,
      monthlyRevenue,
      pendingPayments,
      overduePayments,
      approvedPayments,
      revenueGrowth,
      averageTicket
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas financeiras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}