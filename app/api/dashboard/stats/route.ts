import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

export async function GET() {
    try {
        const now = new Date();
        const firstDayCurrentMonth = startOfMonth(now);
        const lastDayCurrentMonth = endOfMonth(now);
        const firstDayLastMonth = startOfMonth(subMonths(now, 1));
        const lastDayLastMonth = endOfMonth(subMonths(now, 1));

        // 1. Total Orders (All time)
        const totalOrders = await prisma.ordemServico.count();

        // Total Orders Last Month (for comparison, simplified for now just using total count vs previous month created)
        // Actually, let's use "Orders Created This Month" vs "Last Month" for a trend? 
        // The design shows "Total Orders" +8.2%. Let's assume +8.2% is growth of *total* base or *new orders this month*?
        // Usually "Total Orders" implies all time. But +8.2% implies growth rate. 
        // Let's return "New Orders This Month" count and growth comparison?
        // The UI says "247" and "+18 este mês". 
        // So main number is "Total Orders". 
        // Reference: "Total de ordens abertas" -> Wait, UI says "Total de ordens *abertas*".
        // Let's match the UI intent: Active Orders.
        // Card 1: "Ordens de Serviço". Count: 247. Sub: "+18 este mês". Text: "Total de ordens abertas".
        // This is conflicting. 247 orders "open" is a lot. maybe it means "Active"?
        // Let's fetch:
        // - countOpen: status in ['aberta', 'em_andamento', 'aguardando_peca']
        // - countCreatedThisMonth: created_at >= firstDayCurrentMonth
        // - countCreatedLastMonth: created_at >= firstDayLastMonth && <= lastDayLastMonth

        const [
            countTotal,
            countOpen,
            countCreatedThisMonth,
            countCreatedLastMonth
        ] = await Promise.all([
            prisma.ordemServico.count(),
            prisma.ordemServico.count({
                where: {
                    status: { in: ['aberta', 'em_andamento', 'aguardando_peca'] }
                }
            }),
            prisma.ordemServico.count({
                where: {
                    createdAt: { gte: firstDayCurrentMonth, lte: lastDayCurrentMonth }
                }
            }),
            prisma.ordemServico.count({
                where: {
                    createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth }
                }
            })
        ]);

        const orderGrowth = countCreatedLastMonth === 0
            ? 100
            : ((countCreatedThisMonth - countCreatedLastMonth) / countCreatedLastMonth) * 100;

        // 2. Active Clients
        // UI: "Clientes Ativos", Main: 1234, Sub: "+142 novos clientes".
        const [activeClients, newClientsThisMonth, newClientsLastMonth] = await Promise.all([
            prisma.cliente.count({ where: { isActive: true } }),
            prisma.cliente.count({
                where: {
                    isActive: true,
                    createdAt: { gte: firstDayCurrentMonth, lte: lastDayCurrentMonth }
                }
            }),
            prisma.cliente.count({
                where: {
                    isActive: true,
                    createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth }
                }
            })
        ]);

        const clientGrowth = newClientsLastMonth === 0
            ? 100
            : ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100;

        // 3. Em Andamento (In Progress)
        // UI: "Em Andamento", Main: 89, Sub: "Tempo médio: 3.2 dias".
        // We can just count status = 'em_andamento'.
        const inProgressCount = await prisma.ordemServico.count({
            where: { status: 'em_andamento' }
        });

        // Calculate average time for In Progress orders? Or just mock for now as it's complex calc?
        // Let's stick to count for now.
        // Trend: Let's compare with last month's *active* count? Hard to track historically without snapshots.
        // We'll return 0 trend for now or just compare with previous month created orders that are still in progress (too complex).
        // Let's just compare "Orders moved to in_progress this month" (via StatusHistorico)?
        // For simplicity, let's just return the count.

        // 4. Receita Mensal
        // UI: "Receita Mensal", Main: R$ 45.2K, Sub: "Meta: R$ 50K".
        const [revenueThisMonth, revenueLastMonth] = await Promise.all([
            prisma.pagamento.aggregate({
                _sum: { valor: true },
                where: {
                    status: 'aprovado',
                    dataPagamento: { gte: firstDayCurrentMonth, lte: lastDayCurrentMonth }
                }
            }),
            prisma.pagamento.aggregate({
                _sum: { valor: true },
                where: {
                    status: 'aprovado',
                    dataPagamento: { gte: firstDayLastMonth, lte: lastDayLastMonth }
                }
            })
        ]);

        const currentRevenue = Number(revenueThisMonth._sum.valor || 0);
        const lastRevenue = Number(revenueLastMonth._sum.valor || 0);

        const revenueGrowth = lastRevenue === 0
            ? 100
            : ((currentRevenue - lastRevenue) / lastRevenue) * 100;

        return NextResponse.json({
            orders: {
                total: countTotal,
                open: countOpen,
                newThisMonth: countCreatedThisMonth,
                growth: orderGrowth
            },
            clients: {
                active: activeClients,
                newThisMonth: newClientsThisMonth,
                growth: clientGrowth
            },
            inProgress: {
                count: inProgressCount,
                // averageTime: "3.2 dias" // Placeholder or calc later
            },
            revenue: {
                current: currentRevenue,
                growth: revenueGrowth
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
