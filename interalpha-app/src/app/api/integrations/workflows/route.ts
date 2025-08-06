import { NextRequest, NextResponse } from 'next/server';
import { workflowEngine } from '@/services/workflow/workflow-engine';
import { workflowTriggers } from '@/services/workflow/workflow-triggers';

// GET - Listar todas as regras de workflow
export async function GET() {
  try {
    const rules = workflowEngine.getRules();
    
    return NextResponse.json({
      rules: rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        trigger: rule.trigger,
        actions: rule.actions.map(action => ({
          type: action.type,
          config: action.config,
        })),
        isActive: rule.isActive,
        priority: rule.priority,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      })),
      totalRules: rules.length,
      activeRules: rules.filter(r => r.isActive).length,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao listar regras de workflow',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova regra ou testar workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_rule':
        const newRule = {
          id: data.id || `rule-${Date.now()}`,
          name: data.name,
          description: data.description,
          trigger: data.trigger,
          actions: data.actions,
          isActive: data.isActive ?? true,
          priority: data.priority ?? 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        workflowEngine.addRule(newRule);

        return NextResponse.json({
          message: 'Regra criada com sucesso',
          rule: newRule,
        });

      case 'test_workflow':
        const { triggerType, testData } = data;
        
        if (!triggerType) {
          return NextResponse.json(
            { error: 'Tipo de trigger é obrigatório para teste' },
            { status: 400 }
          );
        }

        await workflowTriggers.testWorkflow(triggerType, testData || {});

        return NextResponse.json({
          message: `Workflow ${triggerType} testado com sucesso`,
          triggerType,
          testData,
        });

      default:
        return NextResponse.json(
          { error: 'Ação não suportada' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao processar requisição',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}