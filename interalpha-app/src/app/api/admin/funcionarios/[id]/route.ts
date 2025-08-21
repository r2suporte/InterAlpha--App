import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { employeeService } from '@/lib/services/employee-service'

// GET - Buscar funcionário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'Sem permissão para acessar funcionários' },
        { status: 403 }
      )
    }

    const result = await employeeService.getEmployeeById(params.id)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao buscar funcionário:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar funcionário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'Sem permissão para editar funcionários' },
        { status: 403 }
      )
    }

    const { name, email, phone, role, department, permissions } = await request.json()

    // Validações
    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: nome, email e cargo' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    const result = await employeeService.updateEmployee(params.id, {
      name,
      email,
      phone,
      role,
      department,
      permissions
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir funcionário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'Sem permissão para excluir funcionários' },
        { status: 403 }
      )
    }

    const result = await employeeService.deleteEmployee(params.id)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao excluir funcionário:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}