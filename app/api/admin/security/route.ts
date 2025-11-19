import { NextRequest, NextResponse } from 'next/server';

import { getRateLimitStats } from '@/lib/middleware/rate-limit';
import {
  getRecentSecurityEvents,
  getSecurityStats,
} from '@/lib/middleware/security-audit';
import { checkRolePermission } from '@/lib/auth/role-middleware';

/**
 * 🔍 API de Monitoramento de Segurança - InterAlpha App
 *
 * Endpoint para visualizar eventos de segurança e estatísticas
 * Acesso restrito apenas para administradores
 */

// Helper function para determinar status de segurança
function getSecurityStatus(
  criticalEventsCount: number,
  highSeverityEventsCount: number
): 'critical' | 'warning' | 'normal' {
  if (criticalEventsCount > 0) return 'critical';
  if (highSeverityEventsCount > 5) return 'warning';
  return 'normal';
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário é administrador
    const auth = await checkRolePermission(request);
    if (!auth.authenticated || !auth.user || auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const limit = Number.parseInt(searchParams.get('limit') || '100', 10);

    switch (action) {
      case 'events': {
        // Retorna eventos de segurança recentes
        const events = getRecentSecurityEvents(limit);
        return NextResponse.json({
          success: true,
          data: {
            events,
            total: events.length,
          },
        });
      }

      case 'stats': {
        // Retorna estatísticas de segurança
        const securityStats = getSecurityStats();
        const rateLimitStats = getRateLimitStats();

        return NextResponse.json({
          success: true,
          data: {
            security: securityStats,
            rateLimit: rateLimitStats,
            timestamp: new Date().toISOString(),
          },
        });
      }

      case 'dashboard': {
        // Retorna dados completos para dashboard
        const dashboardEvents = getRecentSecurityEvents(50);
        const dashboardStats = getSecurityStats();
        const dashboardRateLimit = getRateLimitStats();

        // Calcular métricas adicionais
        const now = new Date();
        const last24hMs = 24 * 60 * 60 * 1000;
        const lastHourMs = 60 * 60 * 1000;
        const lastHour = new Date(now.getTime() - lastHourMs);

        const recentEvents = dashboardEvents.filter(
          e => new Date(e.timestamp) > lastHour
        );
        const criticalEvents = dashboardEvents.filter(
          e => e.severity === 'critical'
        );
        const highSeverityEvents = dashboardEvents.filter(
          e => e.severity === 'high'
        );

        return NextResponse.json({
          success: true,
          data: {
            overview: {
              totalEvents: dashboardStats.totalEvents,
              events24h: dashboardStats.events24h,
              eventsLastHour: recentEvents.length,
              criticalEvents: criticalEvents.length,
              highSeverityEvents: highSeverityEvents.length,
              status: getSecurityStatus(
                criticalEvents.length,
                highSeverityEvents.length
              ),
            },
            recentEvents: recentEvents.slice(0, 10),
            topThreats: [
              {
                type: 'SQL Injection',
                count:
                  dashboardStats.eventsByType.sql_injection_attempt || 0,
                severity: 'high',
              },
              {
                type: 'XSS Attempts',
                count: dashboardStats.eventsByType.xss_attempt || 0,
                severity: 'high',
              },
              {
                type: 'Rate Limit Exceeded',
                count: dashboardStats.eventsByType.rate_limit_exceeded || 0,
                severity: 'medium',
              },
              {
                type: 'Invalid Tokens',
                count: dashboardStats.eventsByType.invalid_token || 0,
                severity: 'medium',
              },
              {
                type: 'Unauthorized Access',
                count: dashboardStats.eventsByType.unauthorized_access || 0,
                severity: 'medium',
              },
            ].sort((a, b) => b.count - a.count),
            topIPs: dashboardStats.topIPs,
            rateLimit: dashboardRateLimit,
          },
        });
      }

      default: {
        return NextResponse.json(
          {
            error: 'Ação inválida',
            availableActions: ['events', 'stats', 'dashboard'],
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Erro na API de segurança:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário é administrador
    const auth = await checkRolePermission(request);
    if (!auth.authenticated || !auth.user || auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'cleanup': {
        // Limpar eventos antigos
        const { daysToKeep = 30 } = body;
        const { cleanupOldEvents } = await import(
          '@/lib/middleware/security-audit'
        );
        const removedCount = cleanupOldEvents(daysToKeep);

        return NextResponse.json({
          success: true,
          message: `${removedCount} eventos antigos removidos`,
          data: { removedCount, daysToKeep },
        });
      }

      case 'reset-rate-limit': {
        // Resetar rate limit para um IP específico
        const { ip, endpoint } = body;
        if (!ip) {
          return NextResponse.json(
            {
              error: 'IP é obrigatório',
            },
            { status: 400 }
          );
        }

        const { resetRateLimit } = await import('@/lib/middleware/rate-limit');
        resetRateLimit(ip, endpoint);

        return NextResponse.json({
          success: true,
          message: `Rate limit resetado para IP ${ip}${endpoint ? ` no endpoint ${endpoint}` : ''}`,
        });
      }

      default: {
        return NextResponse.json(
          {
            error: 'Ação inválida',
            availableActions: ['cleanup', 'reset-rate-limit'],
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Erro na API de segurança (POST):', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
