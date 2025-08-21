import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Exportar dados de auditoria
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
      dataTypes = ['audit_logs'], // audit_logs, access_logs, security_events
      format = 'json', // json, csv, xlsx
      filters = {},
      includeMetadata = true,
      compression = false
    } = body

    // Validar tipos de dados
    const validDataTypes = ['audit_logs', 'access_logs', 'security_events']
    const invalidTypes = dataTypes.filter((type: string) => !validDataTypes.includes(type))
    
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Tipos de dados inválidos: ${invalidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar formato
    if (!['json', 'csv', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use: json, csv ou xlsx' },
        { status: 400 }
      )
    }

    // Converter datas se fornecidas
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined
    }

    const exportResult = await auditService.exportAuditData({
      dataTypes,
      format,
      filters: processedFilters,
      includeMetadata,
      compression,
      requestedBy: currentUserId
    })

    return NextResponse.json({
      success: true,
      message: 'Exportação iniciada com sucesso',
      data: exportResult
    })

  } catch (error) {
    console.error('Error exporting audit data:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Obter status de exportações
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
      requestedBy: searchParams.get('requestedBy') || currentUserId,
      status: searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === null || filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const result = await auditService.getExportStatus(filters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error getting export status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}