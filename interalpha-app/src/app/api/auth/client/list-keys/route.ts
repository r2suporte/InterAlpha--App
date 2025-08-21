import { NextRequest, NextResponse } from 'next/server'
import { clientKeyService } from '@/services/client-access/client-key-service'

// Listar chaves ativas de um cliente
export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      )
    }

    const activeKeys = await clientKeyService.getClientActiveKeys(clientId)

    // Não retornar as chaves reais, apenas metadados
    const keysSummary = activeKeys.map(key => ({
      id: key.id,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      generatedBy: key.generatedBy,
      ipAddress: key.ipAddress,
      keyPreview: key.keyHash.substring(0, 8) + '...'
    }))

    return NextResponse.json({
      success: true,
      clientId,
      activeKeysCount: keysSummary.length,
      keys: keysSummary
    })

  } catch (error) {
    console.error('List keys error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Obter estatísticas de uso de uma chave específica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyId } = body

    if (!keyId) {
      return NextResponse.json(
        { error: 'ID da chave é obrigatório' },
        { status: 400 }
      )
    }

    const stats = await clientKeyService.getKeyUsageStats(keyId)

    if (!stats) {
      return NextResponse.json(
        { error: 'Chave não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      keyId,
      stats
    })

  } catch (error) {
    console.error('Get key stats error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}