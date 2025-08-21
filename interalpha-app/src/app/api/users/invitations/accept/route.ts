import { NextRequest, NextResponse } from 'next/server'
import { userManagementService } from '@/services/user-management/user-management-service'

// Aceitar convite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, phone, password } = body

    // Validar dados obrigatórios
    if (!token || !name || !phone || !password) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: token, name, phone, password' },
        { status: 400 }
      )
    }

    // Validar senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Validar telefone (formato básico)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Formato de telefone inválido' },
        { status: 400 }
      )
    }

    const employee = await userManagementService.acceptInvitation(token, {
      name,
      phone,
      password
    })

    return NextResponse.json({
      success: true,
      message: 'Convite aceito com sucesso. Bem-vindo à equipe!',
      data: {
        ...employee,
        // Não retornar dados sensíveis
        passwordHash: undefined
      }
    })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          { error: 'Convite não encontrado ou inválido' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('já foi processado')) {
        return NextResponse.json(
          { error: 'Este convite já foi processado' },
          { status: 409 }
        )
      }
      
      if (error.message.includes('expirado')) {
        return NextResponse.json(
          { error: 'Convite expirado. Solicite um novo convite' },
          { status: 410 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}