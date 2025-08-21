import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'
import { AuditFilters } from '@/types/audit'

// Gerar relatório de auditoria
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
      title,
      description,
      filters,
      format = 'json'
    } = body

    // Validar dados obrigatórios
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, description' },
        { status: 400 }
      )
    }

    // Validar formato
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use: json, csv ou pdf' },
        { status: 400 }
      )
    }

    // Converter datas se fornecidas
    const auditFilters: AuditFilters = {
      ...filters,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined
    }

    const report = await auditService.generateAuditReport(
      title,
      description,
      auditFilters,
      currentUserId,
      format
    )

    return NextResponse.json({
      success: true,
      message: 'Relatório gerado com sucesso',
      data: report
    })

  } catch (error) {
    console.error('Error generating audit report:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar relatórios de auditoria
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
      generatedBy: searchParams.get('generatedBy'),
      format: searchParams.get('format') as 'json' | 'csv' | 'pdf',
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

    const result = await auditService.getAuditReports(filters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error getting audit reports:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}