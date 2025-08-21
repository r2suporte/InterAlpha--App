import { NextRequest, NextResponse } from 'next/server'

// Chaves de teste para demonstração (em produção, usar banco de dados)
const DEMO_KEYS = {
  'DEMO-CLIENT-2024': {
    clientId: 'client-demo-001',
    clientName: 'Cliente Demonstração',
    email: 'cliente@demo.com',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    permissions: {
      canViewOrders: true,
      canViewPayments: true,
      canViewDocuments: true,
      canChat: true
    }
  },
  'TEST-KEY-123456': {
    clientId: 'client-test-001',
    clientName: 'Cliente Teste',
    email: 'teste@cliente.com',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    permissions: {
      canViewOrders: true,
      canViewPayments: false,
      canViewDocuments: true,
      canChat: false
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessKey, key } = body
    const clientKey = accessKey || key

    if (!clientKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chave de acesso é obrigatória' 
        },
        { status: 400 }
      )
    }

    // Validar chave de demonstração
    const keyData = DEMO_KEYS[clientKey as keyof typeof DEMO_KEYS]

    if (!keyData) {
      return NextResponse.json({
        success: false,
        error: 'Chave de acesso inválida'
      }, { status: 401 })
    }

    // Verificar se a chave não expirou
    if (new Date() > keyData.expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Chave de acesso expirada'
      }, { status: 401 })
    }

    // Retornar dados da sessão válida
    return NextResponse.json({
      success: true,
      data: {
        clientId: keyData.clientId,
        clientName: keyData.clientName,
        email: keyData.email,
        permissions: keyData.permissions,
        expiresAt: keyData.expiresAt
      }
    })

  } catch (error) {
    console.error('Erro na validação da chave:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}