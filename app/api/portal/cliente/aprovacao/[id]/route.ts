import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyClienteToken } from '@/lib/auth/client-middleware'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { acao, observacoes } = await request.json()
    
    if (!acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "aprovar" ou "rejeitar"' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { id: aprovacaoId } = await params

    // Buscar aprovação e verificar se pertence ao cliente
    const { data: aprovacao, error: aprovacaoError } = await supabase
      .from('cliente_aprovacoes')
      .select(`
        *,
        ordem_servico:ordens_servico(
          id,
          cliente_portal_id,
          numero_os
        )
      `)
      .eq('id', aprovacaoId)
      .single()

    if (aprovacaoError) {
      if (aprovacaoError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Aprovação não encontrada' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar aprovação:', aprovacaoError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Verificar se a aprovação pertence ao cliente autenticado
    if (aprovacao.ordem_servico.cliente_portal_id !== clienteData.clienteId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para esta aprovação' },
        { status: 403 }
      )
    }

    // Verificar se a aprovação ainda está pendente
    if (aprovacao.status !== 'pendente') {
      return NextResponse.json(
        { error: 'Esta aprovação já foi processada' },
        { status: 400 }
      )
    }

    // Verificar se a aprovação não expirou
    if (aprovacao.expires_at && new Date(aprovacao.expires_at) < new Date()) {
      // Marcar como expirada
      await supabase
        .from('cliente_aprovacoes')
        .update({ status: 'expirado' })
        .eq('id', aprovacaoId)

      return NextResponse.json(
        { error: 'Esta aprovação expirou' },
        { status: 400 }
      )
    }

    // Processar aprovação
    const novoStatus = acao === 'aprovar' ? 'aprovado' : 'rejeitado'
    const agora = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('cliente_aprovacoes')
      .update({
        status: novoStatus,
        observacoes_cliente: observacoes || null,
        aprovado_em: agora,
        updated_at: agora
      })
      .eq('id', aprovacaoId)

    if (updateError) {
      console.error('Erro ao atualizar aprovação:', updateError)
      return NextResponse.json(
        { error: 'Erro ao processar aprovação' },
        { status: 500 }
      )
    }

    // Registrar comunicação
    try {
      await supabase
        .from('comunicacoes_cliente')
        .insert({
          cliente_portal_id: clienteData.clienteId,
          ordem_servico_id: aprovacao.ordem_servico_id,
          tipo: 'aprovacao',
          canal: 'portal',
          conteudo: `${acao === 'aprovar' ? 'Aprovação' : 'Rejeição'} de ${aprovacao.tipo}: ${aprovacao.descricao}${observacoes ? `\nObservações: ${observacoes}` : ''}`,
          status: 'enviado',
          enviado_em: agora
        })
    } catch (error) {
      console.error('Erro ao registrar comunicação:', error)
      // Não falhar a operação por causa disso
    }

    // TODO: Enviar notificação para a equipe interna
    // Aqui você pode adicionar lógica para notificar a equipe sobre a aprovação/rejeição

    return NextResponse.json({
      success: true,
      message: `${aprovacao.tipo} ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso`,
      aprovacao: {
        id: aprovacao.id,
        status: novoStatus,
        aprovado_em: agora
      }
    })

  } catch (error) {
    console.error('Erro na API de aprovação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}