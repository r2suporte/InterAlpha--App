import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Buscar atividades administrativas recentes
    const [auditEntries, securityEvents, employeeInvitations] = await Promise.all([
      // Ações de auditoria relacionadas a usuários e sistema
      prisma.auditEntry.findMany({
        where: {
          action: {
            in: ['CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'REMOVE_ROLE', 'SYSTEM_CONFIG']
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: Math.floor(limit / 3)
      }),

      // Eventos de segurança recentes
      prisma.securityEventEntry.findMany({
        where: {
          severity: {
            in: ['medium', 'high', 'critical']
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: Math.floor(limit / 3)
      }),

      // Convites de funcionários recentes
      prisma.employeeInvitation.findMany({
        include: {
          invitedBy: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.floor(limit / 3)
      })
    ]);

    // Combinar e formatar atividades
    const activities = [];

    // Adicionar entradas de auditoria
    auditEntries.forEach(entry => {
      let description = '';
      let type: 'user_created' | 'user_deactivated' | 'role_assigned' | 'integration_added' | 'security_event' = 'user_created';
      let severity: 'low' | 'medium' | 'high' = 'low';

      switch (entry.action) {
        case 'CREATE_USER':
          description = `Usuário criado: ${entry.resourceId}`;
          type = 'user_created';
          severity = 'low';
          break;
        case 'UPDATE_USER':
          description = `Usuário atualizado: ${entry.resourceId}`;
          type = 'user_created';
          severity = 'low';
          break;
        case 'DELETE_USER':
          description = `Usuário desativado: ${entry.resourceId}`;
          type = 'user_deactivated';
          severity = 'medium';
          break;
        case 'ASSIGN_ROLE':
          description = `Role atribuído ao usuário: ${entry.resourceId}`;
          type = 'role_assigned';
          severity = 'low';
          break;
        case 'REMOVE_ROLE':
          description = `Role removido do usuário: ${entry.resourceId}`;
          type = 'role_assigned';
          severity = 'medium';
          break;
        case 'SYSTEM_CONFIG':
          description = `Configuração do sistema alterada`;
          type = 'integration_added';
          severity = 'medium';
          break;
        default:
          description = `Ação: ${entry.action}`;
      }

      activities.push({
        id: entry.id,
        type,
        description,
        timestamp: entry.timestamp.toISOString(),
        severity
      });
    });

    // Adicionar eventos de segurança
    securityEvents.forEach(event => {
      activities.push({
        id: event.id,
        type: 'security_event' as const,
        description: event.description,
        timestamp: event.timestamp.toISOString(),
        severity: event.severity as 'low' | 'medium' | 'high'
      });
    });

    // Adicionar convites de funcionários
    employeeInvitations.forEach(invitation => {
      let description = '';
      let severity: 'low' | 'medium' | 'high' = 'low';

      switch (invitation.status) {
        case 'PENDING':
          description = `Convite enviado para ${invitation.name} (${invitation.email})`;
          severity = 'low';
          break;
        case 'ACCEPTED':
          description = `Convite aceito por ${invitation.name}`;
          severity = 'low';
          break;
        case 'EXPIRED':
          description = `Convite expirado para ${invitation.name}`;
          severity = 'medium';
          break;
        case 'CANCELLED':
          description = `Convite cancelado para ${invitation.name}`;
          severity = 'medium';
          break;
        default:
          description = `Convite para ${invitation.name}: ${invitation.status}`;
      }

      activities.push({
        id: invitation.id,
        type: 'user_created' as const,
        description,
        timestamp: invitation.createdAt.toISOString(),
        severity
      });
    });

    // Ordenar por timestamp (mais recente primeiro) e limitar
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json(limitedActivities);

  } catch (error) {
    console.error('Erro ao buscar atividade administrativa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}