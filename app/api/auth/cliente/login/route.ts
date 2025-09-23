import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/client-auth'
import { sign } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { login, senha } = await request.json()

    if (!login || !senha) {
      return NextResponse.json(
        { error: 'Login e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar cliente pelo login
    const { data: cliente, error: errorBusca } = await supabase
      .from('clientes_portal')
      .select('*')
      .eq('login', login)
      .eq('ativo', true)
      .single()

    if (errorBusca || !cliente) {
      return NextResponse.json(
        { error: 'Login ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar senha
    const senhaValida = await verifyPassword(senha, cliente.senha_hash)
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Login ou senha incorretos' },
        { status: 401 }
      )
    }

    // Gerar token JWT
    const token = sign(
      { 
        clienteId: cliente.id,
        login: cliente.login,
        email: cliente.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    // Atualizar último acesso
    await supabase
      .from('clientes_portal')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', cliente.id)

    // Criar sessão no banco
    const { error: sessaoError } = await supabase
      .from('cliente_portal_sessoes')
      .insert({
        cliente_portal_id: cliente.id,
        token_sessao: token,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '::1',
        user_agent: request.headers.get('user-agent') || '',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      })

    if (sessaoError) {
      console.error('Erro ao criar sessão:', sessaoError)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Buscar ordens de serviço do cliente
    const { data: ordensServico, error: errorOS } = await supabase
      .from('ordens_servico')
      .select(`
        id,
        numero_os,
        status,
        descricao,
        valor,
        data_inicio,
        data_fim,
        created_at
      `)
      .eq('cliente_portal_id', cliente.id)
      .order('created_at', { ascending: false })

    const response = NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        login: cliente.login,
        primeiro_acesso: cliente.primeiro_acesso
      },
      token,
      ordens_servico: ordensServico || []
    })

    // Definir cookie com o token
    response.cookies.set('cliente-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24h
    })

    return response

  } catch (error) {
    console.error('Erro no login do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('cliente-token')?.value

    if (token) {
      const supabase = await createClient()
      
      // Remover sessão
      await supabase
        .from('cliente_portal_sessoes')
        .delete()
        .eq('token_sessao', token)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('cliente-token')
    
    return response

  } catch (error) {
    console.error('Erro no logout do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}