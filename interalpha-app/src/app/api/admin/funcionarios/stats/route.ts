import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { employeeService } from '@/lib/services/employee-service'

// GET - Obter estatísticas dos funcionários
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão
    const hasPermission = await employeeService.hasPermission(userId, 'funcionarios')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para acessar estatísticas' },
        { status: 403 }
      )
    }

    const result = await employeeService.getEmployeeStats()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}