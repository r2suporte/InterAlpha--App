import { NextRequest, NextResponse } from 'next/server'
import { userManagementService } from '@/services/user-management/user-management-service'

// Obter funcionário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const employee = await userManagementService.getEmployee(id)

    if (!employee) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee
    })

  } catch (error) {
    console.error('Error getting employee:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Atualizar funcionário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const updatedBy = request.headers.get('x-user-id')

    if (!updatedBy) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    // Validar email se fornecido
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }
    }

    const updatedEmployee = await userManagementService.updateEmployee(
      id,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        department: body.department,
        customPermissions: body.customPermissions,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
        notificationPreferences: body.notificationPreferences,
        metadata: body.metadata
      },
      updatedBy
    )

    return NextResponse.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      data: updatedEmployee
    })

  } catch (error) {
    console.error('Error updating employee:', error)
    
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

// Desativar funcionário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const deactivatedBy = request.headers.get('x-user-id')

    if (!deactivatedBy) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const { transferTo } = body

    await userManagementService.deactivateEmployee(id, deactivatedBy, transferTo)

    return NextResponse.json({
      success: true,
      message: 'Funcionário desativado com sucesso'
    })

  } catch (error) {
    console.error('Error deactivating employee:', error)
    
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