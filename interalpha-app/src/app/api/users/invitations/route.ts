import { NextRequest, NextResponse } from 'next/server'
import { userManagementService } from '@/services/user-management/user-management-service'
import { EmployeeRole } from '@/types/auth'

// Convidar funcionário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const invitedBy = request.headers.get('x-user-id')

    if (!invitedBy) {
      return NextResponse.json(
        { error: 'Usuário autenticado requerido' },
        { status: 401 }
      )
    }

    const { email, role, metadata } = body

    // Validar dados obrigatórios
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: email, role' },
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

    // Validar role
    if (!Object.values(EmployeeRole).includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      )
    }

    const invitation = await userManagementService.inviteEmployee(
      email,
      role,
      invitedBy,
      metadata
    )

    return NextResponse.json({
      success: true,
      message: 'Convite enviado com sucesso',
      data: {
        ...invitation,
        // Não retornar token por segurança
        token: undefined
      }
    })

  } catch (error) {
    console.error('Error inviting employee:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('não tem permissão')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      
      if (error.message.includes('já está cadastrado') || error.message.includes('convite pendente')) {
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