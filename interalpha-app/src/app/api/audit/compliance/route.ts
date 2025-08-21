import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'
import { ComplianceType } from '@/types/audit'

// Gerar relatório de compliance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const {
      type,
      startDate,
      endDate,
      includeRecommendations = true
    } = body

    // Validar dados obrigatórios
    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: type, startDate, endDate' },
        { status: 400 }
      )
    }

    // Validar tipo de compliance
    if (!Object.values(ComplianceType).includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de compliance inválido' },
        { status: 400 }
      )
    }

    const report = await auditService.generateComplianceReport(
      type,
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      currentUserId,
      { includeRecommendations }
    )

    return NextResponse.json({
      success: true,
      message: 'Relatório de compliance gerado com sucesso',
      data: report
    })

  } catch (error) {
    console.error('Error generating compliance report:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar relatórios de compliance
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const filters = {
      type: searchParams.get('type') as ComplianceType,
      status: searchParams.get('status') as 'compliant' | 'non_compliant' | 'partial',
      generatedBy: searchParams.get('generatedBy'),
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === null || filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const result = await auditService.getComplianceReports(filters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error getting compliance reports:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}