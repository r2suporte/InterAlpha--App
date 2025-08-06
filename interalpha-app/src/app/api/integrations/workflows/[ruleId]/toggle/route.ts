import { NextRequest, NextResponse } from 'next/server';
import { workflowEngine } from '@/services/workflow/workflow-engine';

// POST - Ativar/desativar regra
export async function POST(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const success = workflowEngine.toggleRule(params.ruleId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Regra não encontrada' },
        { status: 404 }
      );
    }

    const rule = workflowEngine.getRule(params.ruleId);

    return NextResponse.json({
      message: `Regra ${rule?.isActive ? 'ativada' : 'desativada'} com sucesso`,
      rule: {
        id: rule?.id,
        name: rule?.name,
        isActive: rule?.isActive,
        updatedAt: rule?.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao alterar status da regra',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}