import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Obter política de retenção específica
export async function GET(
  request: NextRequest,
  { params }: { params: { policyId: string } }
) {
  try {
    const { policyId } = params
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const policy = await auditService.getRetentionPolicy(policyId)

    if (!policy) {
      return NextResponse.json(
        { error: 'Política de retenção não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: policy
    })

  } catch (error) {
    console.error('Error getting retention policy:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Atualizar política de retenção
export async function PUT(
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

    const {
      name,
      description,
      retentionDays,
      archiveAfterDays,
      deleteAfterDays,
      enabled
    } = body

    // Validar períodos se fornecidos
    if (retentionDays !== undefined && retentionDays <= 0) {
      return NextResponse.json(
        { error: 'Período de retenção deve ser maior que zero' },
        { status: 400 }
      )
    }

    if (deleteAfterDays !== undefined && deleteAfterDays <= 0) {
      return NextResponse.json(
        { error: 'Período de exclusão deve ser maior que zero' },
        { status: 400 }
      )
    }

    if (archiveAfterDays && deleteAfterDays && archiveAfterDays >= deleteAfterDays) {
      return NextResponse.json(
        { error: 'Período de arquivamento deve ser menor que o período de exclusão' },
        { status: 400 }
      )
    }

    const updatedPolicy = await auditService.updateRetentionPolicy(policyId, {
      name,
      description,
      retentionDays,
      archiveAfterDays,
      deleteAfterDays,
      enabled
    })

    if (!updatedPolicy) {
      return NextResponse.json(
        { error: 'Política de retenção não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Política de retenção atualizada com sucesso',
      data: updatedPolicy
    })

  } catch (error) {
    console.error('Error updating retention policy:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Deletar política de retenção
export async function DELETE(
  request: NextRequest,
  { params }: { params: { policyId: string } }
) {
  try {
    const { policyId } = params
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const success = await auditService.deleteRetentionPolicy(policyId)

    if (!success) {
      return NextResponse.json(
        { error: 'Política de retenção não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Política de retenção deletada com sucesso'
    })

  } catch (error) {
    console.error('Error deleting retention policy:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}