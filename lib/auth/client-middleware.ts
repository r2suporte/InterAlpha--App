import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createClient } from '@/lib/supabase/server'

export interface ClienteAuth {
  clienteId: string
  login: string
  email: string
  tipo: 'cliente'
}

export async function verifyClienteToken(request: NextRequest): Promise<ClienteAuth | null> {
  try {
    const token = request.cookies.get('cliente-token')?.value

    if (!token) {
      return null
    }

    // Verificar JWT
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as ClienteAuth

    if (decoded.tipo !== 'cliente') {
      return null
    }

    // Verificar se a sessão ainda é válida no banco
    const supabase = await createClient()
    const { data: sessao, error } = await supabase
      .from('cliente_portal_sessoes')
      .select('*')
      .eq('token_sessao', token)
      .eq('ativo', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (error || !sessao) {
      return null
    }

    return decoded

  } catch (error) {
    console.error('Erro ao verificar token do cliente:', error)
    return null
  }
}

export async function requireClienteAuth(request: NextRequest): Promise<NextResponse | ClienteAuth> {
  const cliente = await verifyClienteToken(request)
  
  if (!cliente) {
    return NextResponse.json(
      { error: 'Acesso não autorizado' },
      { status: 401 }
    )
  }

  return cliente
}