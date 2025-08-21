import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/services/audit/audit-service'

// Obter estatísticas de auditoria
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

    const period = searchParams.get('period') || '30d' // 24h, 7d, 30d, 90d, 1y
    const includeDetails = searchParams.get('includeDetails') === 'true'

    const stats = await auditService.getAuditStatistics(period, {
      includeDetails,
      userId: searchParams.get('userId') || undefined,
      userType: searchParams.get('userType') as 'client' | 'employee' || undefined
    })

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error getting audit statistics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}