import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    let daysToSubtract = 30;
    if (range === '7d') daysToSubtract = 7;
    if (range === '90d') daysToSubtract = 90;

    const startDate = startOfDay(subDays(new Date(), daysToSubtract));

    try {
        const payments = await prisma.pagamento.findMany({
            where: {
                status: 'aprovado',
                dataPagamento: {
                    gte: startDate,
                },
            },
            select: {
                dataPagamento: true,
                valor: true,
            },
            orderBy: {
                dataPagamento: 'asc',
            },
        });

        // Group by date
        const groupedData: Record<string, number> = {};

        // Initialize all days in range with 0
        for (let i = 0; i <= daysToSubtract; i++) {
            const d = subDays(new Date(), daysToSubtract - i);
            const dateKey = format(d, 'yyyy-MM-dd');
            groupedData[dateKey] = 0;
        }

        payments.forEach(payment => {
            if (payment.dataPagamento) {
                const dateKey = format(payment.dataPagamento, 'yyyy-MM-dd');
                if (groupedData[dateKey] !== undefined) {
                    groupedData[dateKey] += Number(payment.valor);
                }
            }
        });

        const chartData = Object.entries(groupedData).map(([date, value]) => ({
            date,
            revenue: value,
        }));

        return NextResponse.json(chartData);

    } catch (error) {
        console.error('Error fetching revenue chart data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
