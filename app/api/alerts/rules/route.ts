import { NextRequest, NextResponse } from 'next/server';

import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';
import { withAuthenticatedApiMetrics } from '@/lib/middleware/metrics-middleware';
import { AlertService } from '@/lib/services/alert-service';

const alertService = new AlertService();

async function getRules(request: NextRequest) {
  try {
    const rules = await alertService.getRules();

    return NextResponse.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error('Erro ao buscar regras de alerta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

async function initializeDefaultRules(request: NextRequest) {
  try {
    await alertService.initializeDefaultRules();

    return NextResponse.json({
      success: true,
      message: 'Regras padrão inicializadas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao inicializar regras padrão:', error);
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
  withAuthenticatedApiLogging(getRules)
);

export const POST = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(initializeDefaultRules)
);
