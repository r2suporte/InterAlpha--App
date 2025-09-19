import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import EmailService from '@/lib/services/email-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Buscar emails pendentes
    const { data: emailsPendentes, error } = await supabase
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
            email,
            telefone
          )
        ),
        clientes_portal (
          id,
          cliente_id
        )
      `)
      .eq('tipo', 'email')
      .eq('status', 'pendente')
      .order('created_at')
      .limit(10)

    if (error) {
      console.error('Erro ao buscar emails pendentes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar emails pendentes' },
        { status: 500 }
      )
    }

    if (!emailsPendentes || emailsPendentes.length === 0) {
      return NextResponse.json({
        message: 'Nenhum email pendente encontrado',
        processados: 0
      })
    }

    const emailService = new EmailService()
    let emailsProcessados = 0
    let emailsComErro = 0

    // Processar cada email
    for (const emailPendente of emailsPendentes) {
      try {
        const ordemServico = emailPendente.ordens_servico
        
        if (!ordemServico?.clientes?.email) {
          // Marcar como erro - cliente sem email
          await supabase
            .from('comunicacoes_cliente')
            .update({
              status: 'erro',
              erro_detalhes: 'Cliente não possui email cadastrado',
              tentativas: emailPendente.tentativas + 1
            })
            .eq('id', emailPendente.id)
          
          emailsComErro++
          continue
        }

        // Preparar dados para o email
        const ordemServicoEmail = {
          id: ordemServico.id,
          numero_os: ordemServico.numero_os,
          descricao: ordemServico.descricao,
          valor: ordemServico.valor,
          data_inicio: ordemServico.data_inicio,
          cliente: {
            nome: ordemServico.clientes.nome,
            email: ordemServico.clientes.email,
            telefone: ordemServico.clientes.telefone
          }
        }

        // Enviar email
        const resultado = await emailService.sendOrdemServicoEmail(ordemServicoEmail)

        // Marcar como enviado
        await supabase
          .from('comunicacoes_cliente')
          .update({
            status: 'enviado',
            enviado_em: new Date().toISOString(),
            tentativas: emailPendente.tentativas + 1
          })
          .eq('id', emailPendente.id)

        emailsProcessados++

      } catch (error) {
        console.error(`Erro ao processar email ${emailPendente.id}:`, error)
        
        // Marcar como erro
        await supabase
          .from('comunicacoes_cliente')
          .update({
            status: 'erro',
            erro_detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
            tentativas: emailPendente.tentativas + 1
          })
          .eq('id', emailPendente.id)

        emailsComErro++
      }
    }

    return NextResponse.json({
      message: 'Processamento de emails concluído',
      processados: emailsProcessados,
      erros: emailsComErro,
      total: emailsPendentes.length
    })

  } catch (error) {
    console.error('Erro ao processar emails:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint GET para verificar status da fila
export async function GET() {
  try {
    const supabase = await createClient()

    // Contar emails por status
    const { data: statusCount, error } = await supabase
      .from('comunicacoes_cliente')
      .select('status')
      .eq('tipo', 'email')

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao consultar status dos emails' },
        { status: 500 }
      )
    }

    const stats = statusCount.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      message: 'Status da fila de emails',
      estatisticas: stats
    })

  } catch (error) {
    console.error('Erro ao consultar fila de emails:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}