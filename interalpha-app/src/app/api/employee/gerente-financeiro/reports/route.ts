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
    const reportType = searchParams.get('type') || 'revenue';
    const period = parseInt(searchParams.get('period') || '30');
    const format = searchParams.get('format') || 'json';

    // Calcular datas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    switch (reportType) {
      case 'revenue':
        return await generateRevenueReport(startDate, endDate, format);
      
      case 'expenses':
        return await generateExpensesReport(startDate, endDate, format);
      
      case 'cashflow':
        return await generateCashFlowReport(startDate, endDate, format);
      
      case 'clients':
        return await generateClientsReport(startDate, endDate, format);
      
      default:
        return NextResponse.json(
          { error: 'Tipo de relatório inválido' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function generateRevenueReport(startDate: Date, endDate: Date, format: string) {
  // Buscar receitas por período
  const payments = await prisma.pagamento.findMany({
    where: {
      dataPagamento: {
        gte: startDate,
        lte: endDate
      },
      status: 'PAGO',
      valor: {
        gt: 0 // Apenas receitas
      }
    },
    include: {
      ordemServico: {
        include: {
          cliente: {
            select: {
              nome: true,
              documento: true
            }
          },
          service: {
            select: {
              name: true,
              category: true
            }
          }
        }
      }
    },
    orderBy: {
      dataPagamento: 'desc'
    }
  });

  // Agrupar por mês
  const monthlyRevenue = payments.reduce((acc, payment) => {
    const month = payment.dataPagamento?.toISOString().substring(0, 7) || 'unknown';
    if (!acc[month]) {
      acc[month] = {
        month,
        totalRevenue: 0,
        transactionCount: 0,
        averageTicket: 0
      };
    }
    acc[month].totalRevenue += payment.valor;
    acc[month].transactionCount += 1;
    acc[month].averageTicket = acc[month].totalRevenue / acc[month].transactionCount;
    return acc;
  }, {} as any);

  // Agrupar por categoria de serviço
  const categoryRevenue = payments.reduce((acc, payment) => {
    const category = payment.ordemServico?.service?.category || 'Outros';
    if (!acc[category]) {
      acc[category] = {
        category,
        totalRevenue: 0,
        transactionCount: 0
      };
    }
    acc[category].totalRevenue += payment.valor;
    acc[category].transactionCount += 1;
    return acc;
  }, {} as any);

  // Top clientes
  const clientRevenue = payments.reduce((acc, payment) => {
    const clientName = payment.ordemServico?.cliente?.nome || 'Cliente não informado';
    if (!acc[clientName]) {
      acc[clientName] = {
        clientName,
        totalRevenue: 0,
        transactionCount: 0
      };
    }
    acc[clientName].totalRevenue += payment.valor;
    acc[clientName].transactionCount += 1;
    return acc;
  }, {} as any);

  const topClients = Object.values(clientRevenue)
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  const report = {
    reportType: 'revenue',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    summary: {
      totalRevenue: payments.reduce((sum, p) => sum + p.valor, 0),
      transactionCount: payments.length,
      averageTicket: payments.length > 0 ? payments.reduce((sum, p) => sum + p.valor, 0) / payments.length : 0
    },
    monthlyRevenue: Object.values(monthlyRevenue),
    categoryRevenue: Object.values(categoryRevenue),
    topClients,
    generatedAt: new Date().toISOString()
  };

  return NextResponse.json(report);
}

async function generateExpensesReport(startDate: Date, endDate: Date, format: string) {
  // Buscar despesas (valores negativos ou categorias específicas)
  const expenses = await prisma.pagamento.findMany({
    where: {
      dataPagamento: {
        gte: startDate,
        lte: endDate
      },
      status: 'PAGO',
      OR: [
        { valor: { lt: 0 } },
        { descricao: { contains: 'despesa', mode: 'insensitive' } },
        { descricao: { contains: 'custo', mode: 'insensitive' } }
      ]
    },
    include: {
      user: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      dataPagamento: 'desc'
    }
  });

  const report = {
    reportType: 'expenses',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    summary: {
      totalExpenses: Math.abs(expenses.reduce((sum, e) => sum + e.valor, 0)),
      transactionCount: expenses.length
    },
    expenses: expenses.map(expense => ({
      id: expense.id,
      description: expense.descricao,
      amount: Math.abs(expense.valor),
      date: expense.dataPagamento?.toISOString(),
      method: expense.metodo,
      approvedBy: expense.user.name
    })),
    generatedAt: new Date().toISOString()
  };

  return NextResponse.json(report);
}

async function generateCashFlowReport(startDate: Date, endDate: Date, format: string) {
  // Buscar todos os pagamentos do período
  const allPayments = await prisma.pagamento.findMany({
    where: {
      dataPagamento: {
        gte: startDate,
        lte: endDate
      },
      status: 'PAGO'
    },
    orderBy: {
      dataPagamento: 'asc'
    }
  });

  // Calcular fluxo de caixa diário
  const dailyCashFlow = allPayments.reduce((acc, payment) => {
    const date = payment.dataPagamento?.toISOString().substring(0, 10) || 'unknown';
    if (!acc[date]) {
      acc[date] = {
        date,
        inflow: 0,
        outflow: 0,
        netFlow: 0
      };
    }
    
    if (payment.valor > 0) {
      acc[date].inflow += payment.valor;
    } else {
      acc[date].outflow += Math.abs(payment.valor);
    }
    
    acc[date].netFlow = acc[date].inflow - acc[date].outflow;
    return acc;
  }, {} as any);

  const report = {
    reportType: 'cashflow',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    summary: {
      totalInflow: allPayments.filter(p => p.valor > 0).reduce((sum, p) => sum + p.valor, 0),
      totalOutflow: Math.abs(allPayments.filter(p => p.valor < 0).reduce((sum, p) => sum + p.valor, 0)),
      netCashFlow: allPayments.reduce((sum, p) => sum + p.valor, 0)
    },
    dailyCashFlow: Object.values(dailyCashFlow),
    generatedAt: new Date().toISOString()
  };

  return NextResponse.json(report);
}

async function generateClientsReport(startDate: Date, endDate: Date, format: string) {
  // Buscar pagamentos de clientes no período
  const clientPayments = await prisma.pagamento.findMany({
    where: {
      dataPagamento: {
        gte: startDate,
        lte: endDate
      },
      status: 'PAGO',
      valor: { gt: 0 },
      ordemServico: {
        isNot: null
      }
    },
    include: {
      ordemServico: {
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              documento: true,
              cidade: true,
              estado: true
            }
          }
        }
      }
    }
  });

  // Agrupar por cliente
  const clientAnalysis = clientPayments.reduce((acc, payment) => {
    const client = payment.ordemServico?.cliente;
    if (!client) return acc;

    if (!acc[client.id]) {
      acc[client.id] = {
        clientId: client.id,
        clientName: client.nome,
        clientEmail: client.email,
        clientDocument: client.documento,
        location: `${client.cidade || ''}, ${client.estado || ''}`.trim(),
        totalRevenue: 0,
        transactionCount: 0,
        averageTicket: 0,
        firstPayment: payment.dataPagamento,
        lastPayment: payment.dataPagamento
      };
    }

    acc[client.id].totalRevenue += payment.valor;
    acc[client.id].transactionCount += 1;
    acc[client.id].averageTicket = acc[client.id].totalRevenue / acc[client.id].transactionCount;

    if (payment.dataPagamento && payment.dataPagamento < acc[client.id].firstPayment!) {
      acc[client.id].firstPayment = payment.dataPagamento;
    }
    if (payment.dataPagamento && payment.dataPagamento > acc[client.id].lastPayment!) {
      acc[client.id].lastPayment = payment.dataPagamento;
    }

    return acc;
  }, {} as any);

  const topClients = Object.values(clientAnalysis)
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

  const report = {
    reportType: 'clients',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    summary: {
      totalClients: Object.keys(clientAnalysis).length,
      totalRevenue: Object.values(clientAnalysis).reduce((sum: number, client: any) => sum + client.totalRevenue, 0),
      averageRevenuePerClient: Object.keys(clientAnalysis).length > 0 
        ? Object.values(clientAnalysis).reduce((sum: number, client: any) => sum + client.totalRevenue, 0) / Object.keys(clientAnalysis).length
        : 0
    },
    clients: topClients.map((client: any) => ({
      ...client,
      firstPayment: client.firstPayment?.toISOString(),
      lastPayment: client.lastPayment?.toISOString()
    })),
    generatedAt: new Date().toISOString()
  };

  return NextResponse.json(report);
}