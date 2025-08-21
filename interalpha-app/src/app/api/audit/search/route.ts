import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Busca avançada em logs de auditoria
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
      query,
      dataTypes = ['audit_logs'], // audit_logs, access_logs, security_events
      filters = {},
      sortBy = 'timestamp',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = body

    // Validar query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query de busca é obrigatória' },
        { status: 400 }
      )
    }

    // Validar tipos de dados
    const validDataTypes = ['audit_logs', 'access_logs', 'security_events']
    const invalidTypes = dataTypes.filter((type: string) => !validDataTypes.includes(type))
    
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Tipos de dados inválidos: ${invalidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar ordenação
    const validSortFields = ['timestamp', 'userId', 'action', 'resource', 'result']
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: `Campo de ordenação inválido. Use: ${validSortFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        { error: 'Ordem de classificação inválida. Use: asc ou desc' },
        { status: 400 }
      )
    }

    // Converter datas se fornecidas
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined
    }

    const result = await auditService.searchAuditData({
      query,
      dataTypes,
      filters: processedFilters,
      sortBy,
      sortOrder,
      page,
      limit
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error searching audit data:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}