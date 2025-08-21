import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Criar regra de alerta
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
      conditions,
      actions,
      cooldownMinutes = 60,
      enabled = true
    } = body

    // Validar dados obrigatórios
    if (!name || !description || !conditions || !actions) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, description, conditions, actions' },
        { status: 400 }
      )
    }

    // Validar condições
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos uma condição deve ser fornecida' },
        { status: 400 }
      )
    }

    // Validar ações
    if (!Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos uma ação deve ser fornecida' },
        { status: 400 }
      )
    }

    const rule = await auditService.createAlertRule({
      name,
      description,
      conditions,
      actions,
      cooldownMinutes,
      enabled,
      createdBy: currentUserId
    })

    return NextResponse.json({
      success: true,
      message: 'Regra de alerta criada com sucesso',
      data: rule
    })

  } catch (error) {
    console.error('Error creating alert rule:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar regras de alerta
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

    const result = await auditService.getAlertRules(filters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error getting alert rules:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}