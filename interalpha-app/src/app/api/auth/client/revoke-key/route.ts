import { NextRequest, NextResponse } from 'next/server'
import { clientKeyService } from '@/services/client-access/client-key-service'

// Revogar chave específica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, revokedBy } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Chave é obrigatória' },
        { status: 400 }
      )
    }

    const success = await clientKeyService.revokeClientKey(key, revokedBy)

    if (!success) {
      return NextResponse.json(
        { error: 'Chave não encontrada ou já revogada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Chave revogada com sucesso'
    })

  } catch (error) {
    console.error('Revoke key error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Revogar todas as chaves de um cliente
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, revokedBy } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      )
    }

    if (!revokedBy) {
      return NextResponse.json(
        { error: 'Usuário que revogou é obrigatório' },
        { status: 400 }
      )
    }

    const revokedCount = await clientKeyService.revokeAllClientKeys(clientId, revokedBy)

    return NextResponse.json({
      success: true,
      message: `${revokedCount} chave(s) revogada(s) com sucesso`,
      revokedCount
    })

  } catch (error) {
    console.error('Revoke all keys error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}