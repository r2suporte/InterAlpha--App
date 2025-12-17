import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        // Protect route with Clerk if needed (usually dashboard is protected)
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Total Clientes
        const totalClientes = await prisma.cliente.count();

        // 2. Total Ordens
        const totalOrdens = await prisma.ordemServico.count();

        // 3. Ordens Abertas
        const ordensAbertas = await prisma.ordemServico.count({
            where: { status: 'aberta' }
        });

        // 4. Faturamento Total
        // Assuming 'valorTotal' is Decimal or Float. Prisma aggregate.
        const faturamentoAgg = await prisma.ordemServico.aggregate({
            _sum: { valorTotal: true }
        });
        const faturamentoTotal = Number(faturamentoAgg._sum.valorTotal || 0);

        // 5. Faturamento Mês
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const faturamentoMesAgg = await prisma.ordemServico.aggregate({
            where: {
                createdAt: { gte: startOfMonth }
            },
            _sum: { valorTotal: true }
        });
        const faturamentoMes = Number(faturamentoMesAgg._sum.valorTotal || 0);

        // 6. Ticket Médio
        const ticketMedio = totalOrdens > 0 ? faturamentoTotal / totalOrdens : 0;

        return NextResponse.json({
            totalClientes,
            totalOrdens,
            ordensAbertas,
            faturamentoTotal,
            faturamentoMes,
            ticketMedio
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
