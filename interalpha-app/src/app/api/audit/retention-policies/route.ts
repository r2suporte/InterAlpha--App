import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Criar política de retenção
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
      name,
      description,
      dataType,
      retentionDays,
      archiveAfterDays,
      deleteAfterDays,
      enabled = true
    } = body

    // Validar dados obrigatórios
    if (!name || !description || !dataType || !retentionDays || !deleteAfterDays) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, description, dataType, retentionDays, deleteAfterDays' },
        { status: 400 }
      )
    }

    // Validar tipo de dados
    const validDataTypes = ['audit_logs', 'access_logs', 'security_events']
    if (!validDataTypes.includes(dataType)) {
      return NextResponse.json(
        { error: 'Tipo de dados inválido. Use: audit_logs, access_logs ou security_events' },
        { status: 400 }
      )
    }

    // Validar períodos
    if (retentionDays <= 0 || deleteAfterDays <= 0) {
      return NextResponse.json(
        { error: 'Períodos de retenção devem ser maiores que zero' },
        { status: 400 }
      )
    }

    if (archiveAfterDays && archiveAfterDays >= deleteAfterDays) {
      return NextResponse.json(
        { error: 'Período de arquivamento deve ser menor que o período de exclusão' },
        { status: 400 }
      )
    }

    const policy = await auditService.createRetentionPolicy({
      name,
      description,
      dataType,
      retentionDays,
      archiveAfterDays,
      deleteAfterDays,
      enabled,
      createdBy: currentUserId
    })

    return NextResponse.json({
      success: true,
      message: 'Política de retenção criada com sucesso',
      data: policy
    })

  } catch (error) {
    console.error('Error creating retention policy:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar políticas de retenção
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
      dataType: searchParams.get('dataType') as 'audit_logs' | 'access_logs' | 'security_events',
      enabled: searchParams.get('enabled') === 'true' ? true : searchParams.get('enabled') === 'false' ? false : undefined,
      createdBy: searchParams.get('createdBy'),
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === null || filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const result = await auditService.getRetentionPolicies(filters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error getting retention policies:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}