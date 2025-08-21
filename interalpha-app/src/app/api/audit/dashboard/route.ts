import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Obter dados do dashboard de auditoria
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

    const period = searchParams.get('period') || '24h' // 24h, 7d, 30d
    const includeCharts = searchParams.get('includeCharts') === 'true'
    const includeAlerts = searchParams.get('includeAlerts') === 'true'

    const dashboard = await auditService.getDashboardData({
      period,
      includeCharts,
      includeAlerts,
      userId: searchParams.get('userId') || undefined,
      userType: searchParams.get('userType') as 'client' | 'employee' || undefined
    })

    return NextResponse.json({
      success: true,
      data: dashboard
    })

  } catch (error) {
    console.error('Error getting dashboard data:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}