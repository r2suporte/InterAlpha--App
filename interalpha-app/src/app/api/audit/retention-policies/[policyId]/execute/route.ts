import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Executar política de retenção
export async function POST(
  request: NextRequest,
  { params }: { params: { policyId: string } }
) {
  try {
    const { policyId } = params
    const body = await request.json()
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const { dryRun = false } = body

    const result = await auditService.executeRetentionPolicy(policyId, {
      dryRun,
      executedBy: currentUserId
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Política de retenção não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? 'Simulação da política de retenção executada com sucesso'
        : 'Política de retenção executada com sucesso',
      data: result
    })

  } catch (error) {
    console.error('Error executing retention policy:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}