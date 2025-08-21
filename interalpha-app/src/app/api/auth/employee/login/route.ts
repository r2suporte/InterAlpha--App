import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth/auth-service'
import { LoginCredentials } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const credentials: LoginCredentials = {
      email: body.email,
      password: body.password
    }

    // Validar dados de entrada
    if (!credentials.email || !credentials.password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter metadados da requisição
    const metadata = {
      ipAddress: request.ip || '',
      userAgent: request.headers.get('user-agent') || ''
    }

    // Autenticar funcionário
    const result = await authService.authenticateEmployee(credentials, metadata)

    if (!result.success) {
      return NextResponse.json(
        { error: getErrorMessage(result.error) },
        { status: 401 }
      )
    }

    // Retornar dados da sessão
    return NextResponse.json({
      success: true,
      token: result.token,
      user: {
        id: result.session!.userId,
        role: result.session!.role,
        permissions: result.session!.permissions,
        expiresAt: result.session!.expiresAt
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getErrorMessage(errorCode?: string): string {
  switch (errorCode) {
    case 'INVALID_CREDENTIALS':
      return 'Email ou senha incorretos'
    case 'ACCOUNT_DISABLED':
      return 'Conta desativada. Entre em contato com o administrador'
    case 'RATE_LIMIT_EXCEEDED':
      return 'Muitas tentativas de login. Tente novamente em alguns minutos'
    default:
      return 'Erro de autenticação'
  }
}