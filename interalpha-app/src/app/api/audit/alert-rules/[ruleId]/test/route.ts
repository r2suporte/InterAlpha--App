import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Testar regra de alerta
export async function POST(
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

    const { testData } = body

    if (!testData) {
      return NextResponse.json(
        { error: 'Dados de teste são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await auditService.testAlertRule(ruleId, testData)

    if (!result) {
      return NextResponse.json(
        { error: 'Regra de alerta não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Teste da regra de alerta executado com sucesso',
      data: result
    })

  } catch (error) {
    console.error('Error testing alert rule:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}