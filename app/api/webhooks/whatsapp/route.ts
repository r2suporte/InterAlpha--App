import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface WhatsAppWebhookEntry {
  id: string
  changes: Array<{
    value: {
      messaging_product: string
      metadata: {
        display_phone_number: string
        phone_number_id: string
      }
      contacts?: Array<{
        profile: {
          name: string
        }
        wa_id: string
      }>
      messages?: Array<{
        from: string
        id: string
        timestamp: string
        text?: {
          body: string
        }
        type: string
      }>
      statuses?: Array<{
        id: string
        status: string
        timestamp: string
        recipient_id: string
      }>
    }
    field: string
  }>
}

interface WhatsAppWebhookPayload {
  object: string
  entry: WhatsAppWebhookEntry[]
}

// GET - Verificação do webhook (Meta exige isso para configurar o webhook)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verificar se é uma solicitação de verificação válida
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook do WhatsApp verificado com sucesso')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('Falha na verificação do webhook do WhatsApp')
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST - Receber mensagens e atualizações de status do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppWebhookPayload = await request.json()

    // Verificar se é uma notificação do WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid object type' }, { status: 400 })
    }

    const supabase = await createClient()

    // Processar cada entrada do webhook
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const { value } = change

        // Processar mensagens recebidas
        if (value.messages) {
          for (const message of value.messages) {
            await processIncomingMessage(supabase, message, value.metadata)
          }
        }

        // Processar atualizações de status de mensagens enviadas
        if (value.statuses) {
          for (const status of value.statuses) {
            await processMessageStatus(supabase, status)
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })

  } catch (error) {
    console.error('Erro ao processar webhook do WhatsApp:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Processar mensagem recebida
async function processIncomingMessage(
  supabase: any,
  message: any,
  metadata: any
) {
  try {
    const { from, text, timestamp, id: messageId } = message

    // Buscar cliente pelo telefone
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nome, telefone')
      .eq('telefone', from)
      .single()

    if (clienteError && clienteError.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente:', clienteError)
      return
    }

    // Se cliente não existe, criar um registro de mensagem não identificada
    if (!cliente) {
      await supabase
        .from('mensagens_whatsapp_nao_identificadas')
        .insert({
          telefone: from,
          mensagem: text?.body || '',
          whatsapp_message_id: messageId,
          timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
          metadata: JSON.stringify(metadata)
        })
      
      console.log(`Mensagem de número não cadastrado: ${from}`)
      return
    }

    // Buscar ordem de serviço ativa do cliente
    const { data: ordemServico, error: osError } = await supabase
      .from('ordens_servico')
      .select('id, numero_os, status')
      .eq('cliente_id', cliente.id)
      .in('status', ['pendente', 'em_andamento', 'aguardando_aprovacao'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Registrar mensagem recebida
    await supabase
      .from('comunicacoes_cliente')
      .insert({
        tipo: 'whatsapp',
        direcao: 'recebida',
        cliente_id: cliente.id,
        ordem_servico_id: ordemServico?.id || null,
        destinatario: from,
        mensagem: text?.body || '',
        status: 'recebida',
        whatsapp_message_id: messageId,
        recebido_em: new Date(parseInt(timestamp) * 1000).toISOString(),
        metadata: JSON.stringify({
          ...metadata,
          cliente_nome: cliente.nome,
          ordem_servico: ordemServico?.numero_os
        })
      })

    // Processar resposta automática se necessário
    await processAutoResponse(supabase, cliente, ordemServico, text?.body || '')

    console.log(`Mensagem processada de ${cliente.nome} (${from})`)

  } catch (error) {
    console.error('Erro ao processar mensagem recebida:', error)
  }
}

// Processar status de mensagem enviada
async function processMessageStatus(supabase: any, status: any) {
  try {
    const { id: messageId, status: messageStatus, timestamp } = status

    // Atualizar status da mensagem na tabela de comunicações
    const { error } = await supabase
      .from('comunicacoes_cliente')
      .update({
        status: messageStatus,
        status_atualizado_em: new Date(parseInt(timestamp) * 1000).toISOString()
      })
      .eq('whatsapp_message_id', messageId)

    if (error) {
      console.error('Erro ao atualizar status da mensagem:', error)
    } else {
      console.log(`Status da mensagem ${messageId} atualizado para: ${messageStatus}`)
    }

  } catch (error) {
    console.error('Erro ao processar status da mensagem:', error)
  }
}

// Processar resposta automática
async function processAutoResponse(
  supabase: any,
  cliente: any,
  ordemServico: any,
  mensagem: string
) {
  try {
    const mensagemLower = mensagem.toLowerCase()

    // Respostas automáticas baseadas em palavras-chave
    let respostaAutomatica = ''

    if (mensagemLower.includes('status') || mensagemLower.includes('andamento')) {
      if (ordemServico) {
        respostaAutomatica = `Olá ${cliente.nome}! Sua ordem de serviço ${ordemServico.numero_os} está com status: ${ordemServico.status}. Em breve entraremos em contato com mais detalhes.`
      } else {
        respostaAutomatica = `Olá ${cliente.nome}! No momento você não possui ordens de serviço ativas. Se precisar de ajuda, nossa equipe está à disposição.`
      }
    } else if (mensagemLower.includes('oi') || mensagemLower.includes('olá') || mensagemLower.includes('bom dia') || mensagemLower.includes('boa tarde') || mensagemLower.includes('boa noite')) {
      respostaAutomatica = `Olá ${cliente.nome}! Obrigado por entrar em contato. Nossa equipe analisará sua mensagem e retornará em breve. Para consultar o status de suas ordens de serviço, digite "status".`
    } else if (mensagemLower.includes('urgente') || mensagemLower.includes('emergência')) {
      respostaAutomatica = `${cliente.nome}, recebemos sua mensagem marcada como urgente. Nossa equipe será notificada imediatamente e entrará em contato o mais breve possível.`
    }

    // Se há resposta automática, agendar envio
    if (respostaAutomatica) {
      await supabase
        .from('comunicacoes_cliente')
        .insert({
          tipo: 'whatsapp',
          direcao: 'enviada',
          cliente_id: cliente.id,
          ordem_servico_id: ordemServico?.id || null,
          destinatario: cliente.telefone,
          mensagem: respostaAutomatica,
          status: 'pendente',
          tentativas: 0,
          metadata: JSON.stringify({
            tipo_resposta: 'automatica',
            mensagem_original: mensagem
          })
        })

      console.log(`Resposta automática agendada para ${cliente.nome}`)
    }

  } catch (error) {
    console.error('Erro ao processar resposta automática:', error)
  }
}