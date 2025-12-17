import { NextRequest, NextResponse } from 'next/server';

import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';
import { withAuthenticatedApiMetrics } from '@/lib/middleware/metrics-middleware';
import { AlertService } from '@/lib/services/alert-service';

const alertService = new AlertService();

async function getAlerts(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    let alerts;

    if (status === 'active') {
      alerts = await alertService.getActiveAlerts();
    } else {
      // Para outros status, precisaríamos implementar um método mais genérico
      alerts = await alertService.getActiveAlerts();
    }

    // Filtrar por severidade se especificado
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    const stats = await alertService.getAlertStats();

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        stats,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

async function createAlert(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos obrigatórios
    const requiredFields = [
      'name',
      'description',
      'metric',
      'condition',
      'threshold',
      'severity',
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Campo obrigatório: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Validar valores
    if (
      !['greater_than', 'less_than', 'equals', 'not_equals'].includes(
        body.condition
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Condição inválida',
        },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high', 'critical'].includes(body.severity)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Severidade inválida',
        },
        { status: 400 }
      );
    }

    if (typeof body.threshold !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Threshold deve ser um número',
        },
        { status: 400 }
      );
    }

    const rule = await alertService.createRule({
      name: body.name,
      description: body.description,
      metric: body.metric,
      condition: body.condition,
      threshold: body.threshold,
      severity: body.severity,
      enabled: body.enabled ?? true,
      cooldownMinutes: body.cooldown_minutes ?? 15,
    });

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao criar regra de alerta',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: rule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar regra de alerta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

async function checkAlerts(_request: NextRequest) {
  try {
    const triggeredAlerts = await alertService.checkAlerts();

    return NextResponse.json({
      success: true,
      data: {
        triggered_alerts: triggeredAlerts,
        count: triggeredAlerts.length,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// Exportações com middleware aplicado
export const GET = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(getAlerts)
);

export const POST = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(createAlert)
);

// Endpoint específico para verificar alertas
export const PUT = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(checkAlerts)
);
