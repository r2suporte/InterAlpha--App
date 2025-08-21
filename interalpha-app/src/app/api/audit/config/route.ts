import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Obter configurações de auditoria
export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const config = await auditService.getAuditConfig()

    return NextResponse.json({
      success: true,
      data: config
    })

  } catch (error) {
    console.error('Error getting audit config:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Atualizar configurações de auditoria
export async function PUT(request: NextRequest) {
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
      enableAuditLogging = true,
      enableAccessLogging = true,
      enableSecurityEvents = true,
      logRetentionDays = 365,
      enableRealTimeAlerts = true,
      alertCooldownMinutes = 60,
      enableAutoArchiving = false,
      archiveAfterDays = 90,
      enableCompliance = true,
      complianceTypes = ['lgpd'],
      enableExport = true,
      maxExportRecords = 100000,
      enableAnonymization = false,
      anonymizeAfterDays = 730
    } = body

    // Validar configurações
    if (logRetentionDays < 30) {
      return NextResponse.json(
        { error: 'Período de retenção deve ser de pelo menos 30 dias' },
        { status: 400 }
      )
    }

    if (alertCooldownMinutes < 1) {
      return NextResponse.json(
        { error: 'Cooldown de alertas deve ser de pelo menos 1 minuto' },
        { status: 400 }
      )
    }

    if (enableAutoArchiving && archiveAfterDays >= logRetentionDays) {
      return NextResponse.json(
        { error: 'Período de arquivamento deve ser menor que o período de retenção' },
        { status: 400 }
      )
    }

    const updatedConfig = await auditService.updateAuditConfig({
      enableAuditLogging,
      enableAccessLogging,
      enableSecurityEvents,
      logRetentionDays,
      enableRealTimeAlerts,
      alertCooldownMinutes,
      enableAutoArchiving,
      archiveAfterDays,
      enableCompliance,
      complianceTypes,
      enableExport,
      maxExportRecords,
      enableAnonymization,
      anonymizeAfterDays,
      updatedBy: currentUserId,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Configurações de auditoria atualizadas com sucesso',
      data: updatedConfig
    })

  } catch (error) {
    console.error('Error updating audit config:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}