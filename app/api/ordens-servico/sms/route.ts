// 📱 API SMS - Envio de SMS para Ordens de Serviço
// Endpoint para enviar SMS via Twilio
import { NextRequest, NextResponse } from 'next/server';

import { smsService } from '@/lib/services/sms-service';
import { createClient } from '@/lib/supabase/server';

// 📤 POST - Enviar SMS para Ordem de Serviço
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ordemServicoId, tipo } = body;

    // Validação dos parâmetros
    if (!ordemServicoId || !tipo) {
      return NextResponse.json(
        {
          success: false,
          error: 'ordemServicoId e tipo são obrigatórios',
        },
        { status: 400 }
      );
    }

    if (!['criacao', 'atualizacao', 'conclusao'].includes(tipo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo deve ser: criacao, atualizacao ou conclusao',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar ordem de serviço com dados do cliente
    const { data: ordemServico, error: ordemError } = await supabase
      .from('ordens_servico')
      .select(
        `
        *,
        clientes (
          id,
          nome,
          telefone,
          celular,
          email
        )
      `
      )
      .eq('id', ordemServicoId)
      .single();

    if (ordemError || !ordemServico) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ordem de serviço não encontrada',
        },
        { status: 404 }
      );
    }

    // Verificar se o cliente tem telefone
    const cliente = ordemServico.clientes;
    if (!cliente || (!cliente.celular && !cliente.telefone)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cliente não possui telefone cadastrado',
        },
        { status: 400 }
      );
    }

    // Enviar SMS
    const result = await smsService.sendOrdemServicoSMS(
      ordemServico,
      cliente,
      tipo
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS enviado com sucesso',
      });
    } 
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Erro ao enviar SMS',
        },
        { status: 500 }
      );
    
  } catch (error) {
    console.error('❌ Erro na API SMS:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// 🧪 GET - Testar conexão com Twilio
export async function GET() {
  try {
    const result = await smsService.testConnection();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao testar conexão SMS:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao testar conexão com Twilio',
      },
      { status: 500 }
    );
  }
}
