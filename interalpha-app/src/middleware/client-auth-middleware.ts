'use client'

// Middleware para autenticação de clientes

import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

interface ClientTokenPayload {
  clientId: string
  type: string
  accessKeyId: string
}

export function withClientAuth(handler: (request: NextRequest, payload: ClientTokenPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      // Verificar token de autorização
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Token de autorização necessário' },
          { status: 401 }
        )
      }

      const token = authHeader.substring(7)
      
      let payload: ClientTokenPayload
      try {
        payload = verify(token, process.env.JWT_SECRET || 'fallback-secret') as ClientTokenPayload
      } catch (error) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 401 }
        )
      }

      if (payload.type !== 'client') {
        return NextResponse.json(
          { error: 'Tipo de token inválido' },
          { status: 401 }
        )
      }

      // Verificar se a chave de acesso ainda é válida
      // (opcional - pode ser implementado se necessário)

      return await handler(request, payload)

    } catch (error) {
      console.error('Erro no middleware de autenticação do cliente:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
}

// Hook para usar em componentes React
export function useClientAuth() {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem('client_token')
  const clientData = localStorage.getItem('client_data')

  if (!token || !clientData) return null

  try {
    const payload = verify(token, process.env.JWT_SECRET || 'fallback-secret') as ClientTokenPayload
    return {
      token,
      clientData: JSON.parse(clientData),
      payload
    }
  } catch (error) {
    // Token inválido - limpar localStorage
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_data')
    return null
  }
}