import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Obter logs de acesso
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      userId: searchParams.get('userId'),
      userType: searchParams.get('userType') as 'client' | 'employee',
      action: searchParams.get('action'),
      success: searchParams.get('success') === 'true' ? true : searchParams.get('success') === 'false' ? false : undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      ipAddress: searchParams.get('ipAddress'),
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    }

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === null || filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const result = await auditService.getAccessLogs(filters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error getting access logs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Criar entrada de log de acesso manual
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
      userId,
      userType,
      action,
      success,
      failureReason,
      sessionDuration,
      location,
      metadata
    } = body

    // Validar dados obrigatórios
    if (!userId || !userType || !action || success === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, userType, action, success' },
        { status: 400 }
      )
    }

    const entry = await auditService.logAccess(
      userId,
      userType,
      action,
      {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        userAgent: request.headers.get('user-agent') || '',
        location,
        success,
        failureReason,
        sessionDuration,
        metadata: {
          ...metadata,
          manualEntry: true,
          createdBy: currentUserId
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Log de acesso criado com sucesso',
      data: entry
    })

  } catch (error) {
    console.error('Error creating access log:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}