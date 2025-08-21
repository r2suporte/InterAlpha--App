import { NextRequest, NextResponse } from 'next/server'
import { userManagementService } from '@/services/user-management/user-management-service'

// Obter atividades do usuário
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const searchParams = request.nextUrl.searchParams

    const filters = {
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      actions: searchParams.get('actions')?.split(','),
      limit: parseInt(searchParams.get('limit') || '50')
    }

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === null || filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const activities = await userManagementService.getUserActivity(id, filters)

    return NextResponse.json({
      success: true,
      data: activities
    })

  } catch (error) {
    console.error('Error getting user activity:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}