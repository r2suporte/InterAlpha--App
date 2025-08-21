import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { employeeService } from '@/lib/services/employee-service'

// GET - Listar funcionários
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão de admin
    const hasPermission = await employeeService.hasPermission(userId, 'funcionarios')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para acessar funcionários' },
        { status: 403 }
      )
    }
    
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || undefined
    const role = url.searchParams.get('role') || undefined
    const status = url.searchParams.get('status') as 'active' | 'inactive' | undefined
    const department = url.searchParams.get('department') || undefined
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const result = await employeeService.listEmployees({
      search,
      role,
      status,
      department,
      page,
      limit
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao buscar funcionários:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar funcionário
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão de admin
    const hasPermission = await employeeService.hasPermission(userId, 'funcionarios')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar funcionários' },
        { status: 403 }
      )
    }

    const { name, email, phone, role, department, password, permissions } = await request.json()

    // Validações
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: nome, email, cargo e senha' },
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

    // Validar senha (mínimo 8 caracteres)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    const result = await employeeService.createEmployee({
      name,
      email,
      phone,
      role,
      department,
      password,
      permissions
    }, userId)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao criar funcionário:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}