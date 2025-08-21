import { NextRequest, NextResponse } from 'next/server'
import { userManagementService } from '@/services/user-management/user-management-service'
import { EmployeeRole } from '@/types/auth'

// Listar funcionários
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      role: searchParams.get('role') as EmployeeRole,
      department: searchParams.get('department'),
      isActive: searchParams.get('isActive') === 'true',
      createdBy: searchParams.get('createdBy'),
      search: searchParams.get('search'),
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === null || filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const result = await userManagementService.listEmployees(filters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error listing employees:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Criar funcionário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const createdBy = request.headers.get('x-user-id')

    if (!createdBy) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    // Validar dados obrigatórios
    const { name, email, phone, role } = body
    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email, phone, role' },
        { status: 400 }
      )
    }

    // Validar role
    if (!Object.values(EmployeeRole).includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const employee = await userManagementService.createEmployee(
      {
        name,
        email,
        phone,
        role,
        department: body.department,
        customPermissions: body.customPermissions,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
        notificationPreferences: body.notificationPreferences || {
          email: true,
          sms: false,
          push: true,
          channels: ['email', 'push']
        },
        metadata: body.metadata
      },
      createdBy
    )

    return NextResponse.json({
      success: true,
      message: 'Funcionário criado com sucesso',
      data: {
        ...employee,
        // Não retornar dados sensíveis
        passwordHash: undefined
      }
    })

  } catch (error) {
    console.error('Error creating employee:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('não tem permissão')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      
      if (error.message.includes('já está em uso')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}