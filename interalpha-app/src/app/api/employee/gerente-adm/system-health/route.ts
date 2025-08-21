import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Verificar saúde do banco de dados
    let databaseHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      // Verificar se há muitas conexões ativas (simulado)
      const activeConnections = Math.floor(Math.random() * 100); // Em produção, usar métricas reais
      if (activeConnections > 80) {
        databaseHealth = 'warning';
      } else if (activeConnections > 95) {
        databaseHealth = 'critical';
      }
    } catch (error) {
      databaseHealth = 'critical';
    }

    // Verificar saúde das APIs
    let apisHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    try {
      // Verificar últimos erros de API
      const recentErrors = await prisma.auditEntry.count({
        where: {
          result: 'failure',
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // última hora
          }
        }
      });

      if (recentErrors > 10) {
        apisHealth = 'warning';
      } else if (recentErrors > 50) {
        apisHealth = 'critical';
      }
    } catch (error) {
      apisHealth = 'warning';
    }

    // Verificar saúde das integrações
    let integrationsHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    try {
      const [failedAccountingSync, failedCalendarSync] = await Promise.all([
        prisma.accountingSync.count({
          where: {
            status: 'failed',
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
            }
          }
        }),
        prisma.calendarEventSync.count({
          where: {
            status: 'failed',
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
            }
          }
        })
      ]);

      const totalFailures = failedAccountingSync + failedCalendarSync;
      if (totalFailures > 5) {
        integrationsHealth = 'warning';
      } else if (totalFailures > 20) {
        integrationsHealth = 'critical';
      }
    } catch (error) {
      integrationsHealth = 'warning';
    }

    // Verificar saúde do armazenamento (simulado)
    let storageHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    try {
      // Em produção, verificar espaço em disco, performance de I/O, etc.
      const storageUsage = Math.floor(Math.random() * 100); // Simulado
      if (storageUsage > 80) {
        storageHealth = 'warning';
      } else if (storageUsage > 95) {
        storageHealth = 'critical';
      }
    } catch (error) {
      storageHealth = 'warning';
    }

    const systemHealth = {
      database: databaseHealth,
      apis: apisHealth,
      integrations: integrationsHealth,
      storage: storageHealth,
      lastChecked: new Date().toISOString()
    };

    return NextResponse.json(systemHealth);

  } catch (error) {
    console.error('Erro ao verificar saúde do sistema:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}