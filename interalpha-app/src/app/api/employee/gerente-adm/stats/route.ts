import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Buscar estatísticas administrativas
    const [totalEmployees, activeEmployees, pendingInvitations, systemIntegrations, securityAlerts] = await Promise.all([
      // Total de funcionários
      prisma.employee.count(),

      // Funcionários ativos
      prisma.employee.count({
        where: {
          isActive: true
        }
      }),

      // Convites pendentes
      prisma.employeeInvitation.count({
        where: {
          status: 'PENDING',
          expiresAt: {
            gt: new Date()
          }
        }
      }),

      // Integrações ativas (contábeis + calendário)
      Promise.all([
        prisma.accountingSystem.count({
          where: { isActive: true }
        }),
        prisma.calendarIntegration.count({
          where: { isActive: true }
        })
      ]).then(([accounting, calendar]) => accounting + calendar),

      // Alertas de segurança não resolvidos
      prisma.securityEventEntry.count({
        where: {
          resolved: false,
          severity: {
            in: ['high', 'critical']
          }
        }
      })
    ]);

    // Calcular uptime do sistema (simulado - em produção seria baseado em métricas reais)
    const systemUptime = 99.8; // Placeholder

    const stats = {
      totalEmployees,
      activeEmployees,
      pendingInvitations,
      systemIntegrations,
      securityAlerts,
      systemUptime
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas do gerente ADM:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}