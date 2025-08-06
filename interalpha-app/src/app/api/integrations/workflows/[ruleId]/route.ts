import { NextRequest, NextResponse } from 'next/server';
import { workflowEngine } from '@/services/workflow/workflow-engine';

// GET - Obter regra específica
export async function GET(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const rule = workflowEngine.getRule(params.ruleId);
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Regra não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ rule });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao buscar regra',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar regra
export async function PUT(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const updates = await request.json();
    
    const success = workflowEngine.updateRule(params.ruleId, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Regra não encontrada' },
        { status: 404 }
      );
    }

    const updatedRule = workflowEngine.getRule(params.ruleId);

    return NextResponse.json({
      message: 'Regra atualizada com sucesso',
      rule: updatedRule,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar regra',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remover regra
export async function DELETE(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const success = workflowEngine.removeRule(params.ruleId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Regra não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Regra removida com sucesso',
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao remover regra',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}