import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
    try {
        const authResult = await authMiddleware(request, ['SUPERVISOR_TECNICO']);
        if (!authResult.success) {
            return NextResponse.json({ error: authResult.error }, { status: 401 });
        }

        // Buscar estatísticas da equipe técnica
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [totalTechnicians, activeOrders, completedToday, allOrders, pendingReassignments] = await Promise.all([
            // Total de técnicos ativos
            prisma.employee.count({
                where: {
                    role: 'TECNICO',
                    isActive: true
                }
            }),

            // Ordens ativas (assigned + in_progress + pending_parts)
            prisma.serviceOrder.count({
                where: {
                    status: {
                        in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS']
                    },
                    assignedTechnician: {
                        role: 'TECNICO'
                    }
                }
            }),

            // Ordens concluídas hoje
            prisma.serviceOrder.count({
                where: {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: today,
                        lt: tomorrow
                    },
                    assignedTechnician: {
                        role: 'TECNICO'
                    }
                }
            }),

            // Todas as ordens para calcular eficiência
            prisma.serviceOrder.findMany({
                where: {
                    assignedTechnician: {
                        role: 'TECNICO'
                    },
                    startedAt: { not: null },
                    completedAt: { not: null }
                },
                select: {
                    startedAt: true,
                    completedAt: true,
                    scheduledDate: true
                }
            }),

            // Ordens que precisam de reatribuição (sem técnico ou técnico inativo)
            prisma.serviceOrder.count({
                where: {
                    OR: [
                        { assignedTechnicianId: null },
                        {
                            assignedTechnician: {
                                isActive: false
                            }
                        }
                    ],
                    status: {
                        in: ['ASSIGNED', 'IN_PROGRESS']
                    }
                }
            })
        ]);

        // Calcular eficiência da equipe
        let teamEfficiency = 0;
        if (allOrders.length > 0) {
            const onTimeOrders = allOrders.filter(order => {
                if (!order.completedAt || !order.scheduledDate) return false;
                return order.completedAt <= order.scheduledDate;
            });
            teamEfficiency = Math.round((onTimeOrders.length / allOrders.length) * 100);
        }

        const stats = {
            totalTechnicians,
            activeOrders,
            completedToday,
            teamEfficiency,
            pendingReassignments
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Erro ao buscar estatísticas do supervisor:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}