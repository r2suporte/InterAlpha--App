import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Obter regra de alerta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const { ruleId } = params
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const rule = await auditService.getAlertRule(ruleId)

    if (!rule) {
      return NextResponse.json(
        { error: 'Regra de alerta não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rule
    })

  } catch (error) {
    console.error('Error getting alert rule:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Atualizar regra de alerta
export async function PUT(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const { ruleId } = params
    const body = await request.json()
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const {
      name,
      description,
      conditions,
      actions,
      cooldownMinutes,
      enabled
    } = body

    const updatedRule = await auditService.updateAlertRule(ruleId, {
      name,
      description,
      conditions,
      actions,
      cooldownMinutes,
      enabled
    })

    if (!updatedRule) {
      return NextResponse.json(
        { error: 'Regra de alerta não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Regra de alerta atualizada com sucesso',
      data: updatedRule
    })

  } catch (error) {
    console.error('Error updating alert rule:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Deletar regra de alerta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const { ruleId } = params
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const success = await auditService.deleteAlertRule(ruleId)

    if (!success) {
      return NextResponse.json(
        { error: 'Regra de alerta não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Regra de alerta deletada com sucesso'
    })

  } catch (error) {
    console.error('Error deleting alert rule:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}