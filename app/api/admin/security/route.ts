import { NextRequest, NextResponse } from 'next/server';

import { getRateLimitStats } from '@/lib/middleware/rate-limit';
import {
  getRecentSecurityEvents,
  getSecurityStats,
} from '@/lib/middleware/security-audit';

/**
 * 🔍 API de Monitoramento de Segurança - InterAlpha App
 *
 * Endpoint para visualizar eventos de segurança e estatísticas
 * Acesso restrito apenas para administradores
 */

export async function GET(request: NextRequest) {
  try {
    // TODO: Verificar se o usuário é administrador
    // const user = await getCurrentUser(request)
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    // }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const limit = parseInt(searchParams.get('limit') || '100');

    switch (action) {
      case 'events':
        // Retorna eventos de segurança recentes
        const events = getRecentSecurityEvents(limit);
        return NextResponse.json({
          success: true,
          data: {
            events,
            total: events.length,
          },
        });

      case 'stats':
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

      case 'dashboard':
        // Retorna dados completos para dashboard
        const dashboardEvents = getRecentSecurityEvents(50);
        const dashboardStats = getSecurityStats();
        const dashboardRateLimit = getRateLimitStats();

        // Calcular métricas adicionais
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

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
              status:
                criticalEvents.length > 0
                  ? 'critical'
                  : highSeverityEvents.length > 5
                    ? 'warning'
                    : 'normal',
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

      default:
        return NextResponse.json(
          {
            error: 'Ação inválida',
            availableActions: ['events', 'stats', 'dashboard'],
          },
          { status: 400 }
        );
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
    // TODO: Verificar se o usuário é administrador

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'cleanup':
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

      case 'reset-rate-limit':
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

      default:
        return NextResponse.json(
          {
            error: 'Ação inválida',
            availableActions: ['cleanup', 'reset-rate-limit'],
          },
          { status: 400 }
        );
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
