import { NextRequest, NextResponse } from 'next/server'
import { roleManagementService } from '@/services/rbac/role-management-service'
import { EmployeeRole } from '@/types/auth'

// Obter role específico
export async function GET(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const { roleId } = params

    // Verificar se é role padrão
    if (Object.values(EmployeeRole).includes(roleId as EmployeeRole)) {
      const standardRole = await roleManagementService.getStandardRole(roleId as EmployeeRole)
      if (standardRole) {
        return NextResponse.json({
          success: true,
          data: {
            ...standardRole,
            type: 'standard'
          }
        })
      }
    }

    // Buscar role customizado
    const customRoles = await roleManagementService.getCustomRoles()
    const customRole = customRoles.find(r => r.id === roleId)

    if (!customRole) {
      return NextResponse.json(
        { error: 'Role não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...customRole,
        type: 'custom'
      }
    })

  } catch (error) {
    console.error('Error getting role:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Atualizar role customizado
export async function PUT(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const { roleId } = params
    const body = await request.json()
    const { updatedBy, ...updates } = body

    if (!updatedBy) {
      return NextResponse.json(
        { error: 'updatedBy é obrigatório' },
        { status: 400 }
      )
    }

    // Não permitir atualização de roles padrão
    if (Object.values(EmployeeRole).includes(roleId as EmployeeRole)) {
      return NextResponse.json(
        { error: 'Não é possível atualizar roles padrão' },
        { status: 400 }
      )
    }

    const updatedRole = await roleManagementService.updateCustomRole(
      roleId,
      updates,
      updatedBy
    )

    return NextResponse.json({
      success: true,
      message: 'Role atualizado com sucesso',
      data: updatedRole
    })

  } catch (error) {
    console.error('Error updating role:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      
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

// Deletar role customizado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const { roleId } = params
    const body = await request.json()
    const { deletedBy } = body

    if (!deletedBy) {
      return NextResponse.json(
        { error: 'deletedBy é obrigatório' },
        { status: 400 }
      )
    }

    // Não permitir deleção de roles padrão
    if (Object.values(EmployeeRole).includes(roleId as EmployeeRole)) {
      return NextResponse.json(
        { error: 'Não é possível deletar roles padrão' },
        { status: 400 }
      )
    }

    const success = await roleManagementService.deleteCustomRole(roleId, deletedBy)

    if (!success) {
      return NextResponse.json(
        { error: 'Role não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role deletado com sucesso'
    })

  } catch (error) {
    console.error('Error deleting role:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('em uso')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
      
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