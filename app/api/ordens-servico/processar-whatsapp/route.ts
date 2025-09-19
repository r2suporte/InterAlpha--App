import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import WhatsAppService from '@/lib/services/whatsapp-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Buscar mensagens WhatsApp pendentes
    const { data: whatsappPendentes, error } = await supabase
      .from('comunicacoes_cliente')
      .select(`
        *,
        ordens_servico (
          id,
          numero_os,
          descricao,
          valor,
          data_inicio,
          status,
          clientes (
            id,
            nome,
            telefone
          )
        )
      `)
      .eq('tipo', 'whatsapp')
      .eq('status', 'pendente')
      .order('created_at')
      .limit(10)

    if (error) {
      console.error('Erro ao buscar WhatsApp pendentes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens WhatsApp pendentes' },
        { status: 500 }
      )
    }

    if (!whatsappPendentes || whatsappPendentes.length === 0) {
      return NextResponse.json({
        message: 'Nenhuma mensagem WhatsApp pendente encontrada',
        processados: 0
      })
    }

    const whatsappService = new WhatsAppService()
    let mensagensProcessadas = 0
    let mensagensComErro = 0

    // Processar cada mensagem
    for (const whatsappPendente of whatsappPendentes) {
      try {
        const ordemServico = whatsappPendente.ordens_servico
        const cliente = Array.isArray(ordemServico?.clientes) ? ordemServico.clientes[0] : ordemServico?.clientes
        
        if (!cliente?.telefone) {
          // Marcar como erro - cliente sem telefone
          await supabase
            .from('comunicacoes_cliente')
            .update({
              status: 'erro',
              erro_detalhes: 'Cliente não possui telefone cadastrado',
              tentativas: whatsappPendente.tentativas + 1
            })
            .eq('id', whatsappPendente.id)
          
          mensagensComErro++
          continue
        }

        // Preparar dados para o WhatsApp
        const ordemServicoWhatsApp = {
          id: ordemServico.id,
          numero_os: ordemServico.numero_os,
          descricao: ordemServico.descricao,
          valor: ordemServico.valor,
          data_inicio: ordemServico.data_inicio,
          cliente: {
            nome: cliente.nome,
            telefone: cliente.telefone
          }
        }

        // Enviar mensagem WhatsApp
        const resultado = await whatsappService.sendOrdemServicoMessage(ordemServicoWhatsApp)

        // Marcar como enviado
        await supabase
          .from('comunicacoes_cliente')
          .update({
            status: 'enviado',
            enviado_em: new Date().toISOString(),
            whatsapp_message_id: resultado.messages[0]?.id,
            tentativas: whatsappPendente.tentativas + 1
          })
          .eq('id', whatsappPendente.id)

        mensagensProcessadas++

      } catch (error) {
        console.error(`Erro ao processar WhatsApp ${whatsappPendente.id}:`, error)
        
        // Marcar como erro
        await supabase
          .from('comunicacoes_cliente')
          .update({
            status: 'erro',
            erro_detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
            tentativas: whatsappPendente.tentativas + 1
          })
          .eq('id', whatsappPendente.id)

        mensagensComErro++
      }
    }

    return NextResponse.json({
      message: 'Processamento de mensagens WhatsApp concluído',
      processados: mensagensProcessadas,
      erros: mensagensComErro,
      total: whatsappPendentes.length
    })

  } catch (error) {
    console.error('Erro ao processar WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint GET para verificar status da fila WhatsApp
export async function GET() {
  try {
    const supabase = await createClient()

    // Contar mensagens WhatsApp por status
    const { data: statusCount, error } = await supabase
      .from('comunicacoes_cliente')
      .select('status')
      .eq('tipo', 'whatsapp')

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao consultar status das mensagens WhatsApp' },
        { status: 500 }
      )
    }

    const stats = statusCount.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      message: 'Status da fila de mensagens WhatsApp',
      estatisticas: stats
    })

  } catch (error) {
    console.error('Erro ao consultar fila WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}