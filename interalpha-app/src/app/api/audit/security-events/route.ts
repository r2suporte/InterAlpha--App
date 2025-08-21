import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'
import { SecurityEventType, SecuritySeverity } from '@/types/audit'

// Obter eventos de segurança
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      type: searchParams.get('type') as SecurityEventType,
      severity: searchParams.get('severity') as SecuritySeverity,
      userId: searchParams.get('userId'),
      resolved: searchParams.get('resolved') === 'true' ? true : searchParams.get('resolved') === 'false' ? false : undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    }

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === null || filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const result = await auditService.getSecurityEvents(filters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error getting security events:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Criar evento de segurança manual
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
      severity,
      description,
      userId,
      details,
      autoResolve
    } = body

    // Validar dados obrigatórios
    if (!type || !severity || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: type, severity, description' },
        { status: 400 }
      )
    }

    // Validar enums
    if (!Object.values(SecurityEventType).includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de evento de segurança inválido' },
        { status: 400 }
      )
    }

    if (!Object.values(SecuritySeverity).includes(severity)) {
      return NextResponse.json(
        { error: 'Severidade inválida' },
        { status: 400 }
      )
    }

    const entry = await auditService.logSecurityEvent(
      type,
      severity,
      description,
      {
        userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        userAgent: request.headers.get('user-agent') || '',
        details: {
          ...details,
          manualEntry: true,
          createdBy: currentUserId
        },
        autoResolve
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Evento de segurança criado com sucesso',
      data: entry
    })

  } catch (error) {
    console.error('Error creating security event:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}