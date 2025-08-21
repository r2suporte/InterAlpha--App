import { NextRequest, NextResponse } from 'next/server'
import { clientKeyService } from '@/services/client-access/client-key-service'
import { clientNotificationService } from '@/services/notifications/client-notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, generatedBy, customTTL } = body

    // Validar dados de entrada
    if (!clientId) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      )
    }

    if (!generatedBy) {
      return NextResponse.json(
        { error: 'Usuário que gerou a chave é obrigatório' },
        { status: 400 }
      )
    }

    // Obter metadados da requisição
    const metadata = {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || ''
    }

    // Gerar chave de acesso
    const accessKey = await clientKeyService.generateClientKey(
      clientId,
      generatedBy,
      {
        customTTL,
        metadata
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Chave de acesso gerada e enviada com sucesso',
      keyId: accessKey.key.substring(0, 8) + '...', // Mostrar apenas parte da chave
      expiresAt: accessKey.expiresAt,
      notificationSent: true
    })

  } catch (error) {
    console.error('Generate key error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Cliente não encontrado') {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        )
      }
      
      if (error.message === 'Limite de chaves ativas excedido') {
        return NextResponse.json(
          { error: 'Limite de chaves ativas excedido. Revogue chaves antigas primeiro.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para validar chave de acesso
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Chave de acesso é obrigatória' },
        { status: 400 }
      )
    }

    const validation = await clientKeyService.validateClientKey(key)

    if (!validation.valid) {
      return NextResponse.json(
        { error: getErrorMessage(validation.error) },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      clientId: validation.session!.clientId,
      clientData: validation.session!.clientData,
      permissions: validation.session!.permissions,
      expiresAt: validation.session!.expiresAt,
      keyStats: {
        usageCount: validation.keyData!.usageCount,
        lastUsed: validation.keyData!.lastUsed
      }
    })

  } catch (error) {
    console.error('Validate key error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getErrorMessage(errorCode?: string): string {
  switch (errorCode) {
    case 'INVALID_CLIENT_KEY':
      return 'Chave de acesso inválida'
    case 'KEY_EXPIRED':
      return 'Chave de acesso expirada. Solicite uma nova chave'
    default:
      return 'Erro de validação'
  }
}