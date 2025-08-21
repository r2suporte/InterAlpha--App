import { NextRequest, NextResponse } from 'next/server'
import { userManagementService } from '@/services/user-management/user-management-service'

// Obter estatísticas do usuário
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const stats = await userManagementService.getUserStats(id)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error getting user stats:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}