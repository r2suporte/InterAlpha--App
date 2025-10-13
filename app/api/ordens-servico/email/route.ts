import { NextRequest, NextResponse } from 'next/server';

import EmailService from '@/lib/services/email-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { ordem_servico_id, tipo_email } = await request.json();

    if (!ordem_servico_id || !tipo_email) {
      return NextResponse.json(
        { error: 'ordem_servico_id e tipo_email são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar dados da ordem de serviço com cliente
    const { data: ordemServico, error: osError } = await supabase
      .from('ordens_servico')
      .select(
        `
        *,
        clientes (
          id,
          nome,
          email,
          telefone
        )
      `
      )
      .eq('id', ordem_servico_id)
      .single();

    if (osError || !ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    if (!ordemServico.clientes?.email) {
      return NextResponse.json(
        { error: 'Cliente não possui email cadastrado' },
        { status: 400 }
      );
    }

    // Inicializar serviço de email
    const emailService = new EmailService();

    // Preparar dados da ordem de serviço para o email
    const ordemServicoEmail = {
      id: ordemServico.id,
      numero_os: ordemServico.numero_os,
      descricao: ordemServico.descricao,
      valor: ordemServico.valor,
      data_inicio: ordemServico.data_inicio,
      cliente: {
        nome: ordemServico.clientes.nome,
        email: ordemServico.clientes.email,
        telefone: ordemServico.clientes.telefone,
      },
    };

    // Enviar email
    try {
      const resultado =
        await emailService.sendOrdemServicoEmail(ordemServicoEmail);

      return NextResponse.json({
        message: 'Email enviado com sucesso',
        message_id: resultado.messageId,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Erro ao enviar email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para testar configuração de email
export async function GET() {
  try {
    const emailService = new EmailService();

    const conexaoOk = await emailService.testConnection();

    if (conexaoOk) {
      return NextResponse.json({
        message: 'Configuração de email está funcionando',
      });
    } 
      return NextResponse.json(
        { error: 'Falha na conexão SMTP' },
        { status: 500 }
      );
    
  } catch (error) {
    console.error('Erro ao testar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
