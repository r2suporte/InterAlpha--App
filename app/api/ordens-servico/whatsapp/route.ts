import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import WhatsAppService from '@/lib/services/whatsapp-service'

// POST - Enviar mensagem WhatsApp para ordem de serviço
export async function POST(request: NextRequest) {
  try {
    const { ordemServicoId, tipo = 'nova_os' } = await request.json()

    if (!ordemServicoId) {
      return NextResponse.json(
        { error: 'ID da ordem de serviço é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar dados da ordem de serviço
    const { data: ordemServico, error } = await supabase
      .from('ordens_servico')
      .select(`
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
      `)
      .eq('id', ordemServicoId)
      .single()

    if (error || !ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    const cliente = Array.isArray(ordemServico.clientes) ? ordemServico.clientes[0] : ordemServico.clientes

    if (!cliente?.telefone) {
      return NextResponse.json(
        { error: 'Cliente não possui telefone cadastrado' },
        { status: 400 }
      )
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

    try {
      const whatsappService = new WhatsAppService()
      const resultado = await whatsappService.sendOrdemServicoMessage(ordemServicoWhatsApp)

      return NextResponse.json({
        message: 'Mensagem WhatsApp enviada com sucesso',
        whatsapp_message_id: resultado.messages[0]?.id,
        destinatario: cliente.telefone
      })

    } catch (whatsappError) {
      console.error('Erro ao enviar WhatsApp:', whatsappError)
      return NextResponse.json(
        { 
          error: 'Erro ao enviar mensagem WhatsApp',
          details: whatsappError instanceof Error ? whatsappError.message : 'Erro desconhecido'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro na API WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Testar configuração do WhatsApp
export async function GET() {
  try {
    const whatsappService = new WhatsAppService()
    const resultado = await whatsappService.testConnection()

    if (resultado.success) {
      return NextResponse.json({
        message: 'Configuração do WhatsApp OK',
        status: 'conectado',
        detalhes: resultado.message
      })
    } else {
      return NextResponse.json({
        message: 'Erro na configuração do WhatsApp',
        status: 'erro',
        detalhes: resultado.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao testar WhatsApp:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao testar configuração',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}