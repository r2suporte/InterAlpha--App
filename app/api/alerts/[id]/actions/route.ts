import { NextRequest, NextResponse } from 'next/server';

import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';
import { withAuthenticatedApiMetrics } from '@/lib/middleware/metrics-middleware';
import { AlertService } from '@/lib/services/alert-service';

const alertService = new AlertService();

async function performAlertAction(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, acknowledged_by } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ação não especificada',
        },
        { status: 400 }
      );
    }

    let success = false;
    let message = '';

    switch (action) {
      case 'acknowledge':
        if (!acknowledged_by) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Campo acknowledged_by é obrigatório para ação acknowledge',
            },
            { status: 400 }
          );
        }
        success = await alertService.acknowledgeAlert(id, acknowledged_by);
        message = success
          ? 'Alerta reconhecido com sucesso'
          : 'Erro ao reconhecer alerta';
        break;

      case 'resolve':
        success = await alertService.resolveAlert(id);
        message = success
          ? 'Alerta resolvido com sucesso'
          : 'Erro ao resolver alerta';
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Ação inválida. Ações disponíveis: acknowledge, resolve',
          },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Erro ao executar ação no alerta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// Wrapper para compatibilidade com middleware
async function postWrapper(request: NextRequest) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 2]; // O ID está antes de 'actions'

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID não fornecido' },
      { status: 400 }
    );
  }

  return performAlertAction(request, { params: Promise.resolve({ id }) });
}

// Exportações com middleware aplicado
export const POST = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(postWrapper)
);
