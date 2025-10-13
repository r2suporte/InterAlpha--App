import { NextRequest, NextResponse } from 'next/server';

import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';
import { withAuthenticatedApiMetrics } from '@/lib/middleware/metrics-middleware';
import { AlertService } from '@/lib/services/alert-service';

const alertService = new AlertService();

async function updateRule(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validar campos se fornecidos
    if (
      body.condition &&
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

    if (
      body.severity &&
      !['low', 'medium', 'high', 'critical'].includes(body.severity)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Severidade inválida',
        },
        { status: 400 }
      );
    }

    if (body.threshold !== undefined && typeof body.threshold !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Threshold deve ser um número',
        },
        { status: 400 }
      );
    }

    const rule = await alertService.updateRule(id, body);

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Regra não encontrada ou erro ao atualizar',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Erro ao atualizar regra de alerta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

async function deleteRule(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const success = await alertService.deleteRule(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Regra não encontrada ou erro ao deletar',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Regra deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar regra de alerta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// Wrappers para compatibilidade com middleware
async function putWrapper(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID não fornecido' },
      { status: 400 }
    );
  }
  return updateRule(request, { params: Promise.resolve({ id }) });
}

async function deleteWrapper(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID não fornecido' },
      { status: 400 }
    );
  }
  return deleteRule(request, { params: Promise.resolve({ id }) });
}

// Exportações com middleware aplicado
export const PUT = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(putWrapper)
);

export const DELETE = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(deleteWrapper)
);
