import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Obter relatório específico
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const report = await auditService.getAuditReport(reportId)

    if (!report) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error('Error getting audit report:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Deletar relatório
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const success = await auditService.deleteAuditReport(reportId, currentUserId)

    if (!success) {
      return NextResponse.json(
        { error: 'Relatório não encontrado ou sem permissão' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório deletado com sucesso'
    })

  } catch (error) {
    console.error('Error deleting audit report:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}