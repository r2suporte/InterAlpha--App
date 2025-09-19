import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyClienteToken } from '@/lib/auth/client-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação do cliente
    const clienteData = await verifyClienteToken(request)
    if (!clienteData) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const ordemId = params.id

    // Buscar ordem de serviço com verificação de permissão
    const { data: ordemServico, error: ordemError } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        cliente:clientes(
          nome,
          email,
          telefone
        ),
        equipamento:equipamentos(
          marca,
          modelo,
          numero_serie
        )
      `)
      .eq('id', ordemId)
      .eq('cliente_portal_id', clienteData.clienteId)
      .single()

    if (ordemError) {
      if (ordemError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Ordem de serviço não encontrada' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar ordem de serviço:', ordemError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Verificar se o cliente tem acesso a esta ordem
    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta ordem de serviço' },
        { status: 403 }
      )
    }

    // Buscar aprovações relacionadas à ordem de serviço
    const { data: aprovacoes, error: aprovacoesError } = await supabase
      .from('cliente_aprovacoes')
      .select('*')
      .eq('ordem_servico_id', ordemId)
      .order('created_at', { ascending: false })

    if (aprovacoesError) {
      console.error('Erro ao buscar aprovações:', aprovacoesError)
      // Não retornar erro, apenas log - aprovações são opcionais
    }

    return NextResponse.json({
      ordem_servico: ordemServico,
      aprovacoes: aprovacoes || []
    })

  } catch (error) {
    console.error('Erro na API de detalhes da ordem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}