import { NextRequest, NextResponse } from 'next/server'
import { roleManagementService } from '@/services/rbac/role-management-service'
import { EmployeeRole } from '@/types/auth'

// Listar todos os roles (padrão + customizados)
export async function GET(request: NextRequest) {
  try {
    const includeCustom = request.nextUrl.searchParams.get('includeCustom') === 'true'
    const baseRole = request.nextUrl.searchParams.get('baseRole') as EmployeeRole
    const createdBy = request.nextUrl.searchParams.get('createdBy')

    // Obter roles padrão
    const standardRoles = await roleManagementService.getAllStandardRoles()

    let customRoles: any[] = []
    if (includeCustom) {
      customRoles = await roleManagementService.getCustomRoles({
        baseRole,
        createdBy: createdBy || undefined,
        isActive: true
      })
    }

    // Obter hierarquia
    const hierarchy = await roleManagementService.getRoleHierarchy()

    return NextResponse.json({
      success: true,
      data: {
        standardRoles: standardRoles.map(role => ({
          ...role,
          type: 'standard'
        })),
        customRoles: customRoles.map(role => ({
          ...role,
          type: 'custom'
        })),
        hierarchy
      }
    })

  } catch (error) {
    console.error('Error listing roles:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Criar role customizado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      baseRole,
      customPermissions,
      dashboardConfig,
      createdBy
    } = body

    // Validar dados obrigatórios
    if (!name || !description || !baseRole || !createdBy) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, description, baseRole, createdBy' },
        { status: 400 }
      )
    }

    // Validar baseRole
    if (!Object.values(EmployeeRole).includes(baseRole)) {
      return NextResponse.json(
        { error: 'baseRole inválido' },
        { status: 400 }
      )
    }

    const customRole = await roleManagementService.createCustomRole(
      {
        name,
        description,
        baseRole,
        customPermissions: customPermissions || [],
        dashboardConfig
      },
      createdBy
    )

    return NextResponse.json({
      success: true,
      message: 'Role customizado criado com sucesso',
      data: customRole
    })

  } catch (error) {
    console.error('Error creating custom role:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('não tem permissão')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}