import { NextRequest, NextResponse } from 'next/server'
import { verifyClienteToken } from '@/lib/auth/client-middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const cliente = await verifyClienteToken(request)

    if (!cliente) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Buscar dados atualizados do cliente
    const { data: clienteData, error: errorCliente } = await supabase
      .from('clientes_portal')
      .select('*')
      .eq('id', cliente.clienteId)
      .single()

    if (errorCliente || !clienteData) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
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
      .eq('cliente_portal_id', cliente.clienteId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      cliente: {
        id: clienteData.id,
        nome: clienteData.nome,
        email: clienteData.email,
        login: clienteData.login,
        primeiro_acesso: clienteData.primeiro_acesso
      },
      ordens_servico: ordensServico || []
    })

  } catch (error) {
    console.error('Erro ao verificar autenticação do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}