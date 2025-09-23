// 📱 Webhook SMS - Status de Entrega
// Webhook para receber atualizações de status do Twilio

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 📥 POST - Receber status de entrega do SMS
export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma requisição do Twilio
    const twilioSignature = request.headers.get('x-twilio-signature');
    
    if (!twilioSignature) {
      return NextResponse.json(
        { error: 'Assinatura Twilio não encontrada' },
        { status: 401 }
      );
    }

    // Parse do body como form data (Twilio envia como application/x-www-form-urlencoded)
    const formData = await request.formData();
    
    const messageId = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const to = formData.get('To') as string;
    const from = formData.get('From') as string;
    const errorCode = formData.get('ErrorCode') as string;
    const errorMessage = formData.get('ErrorMessage') as string;

    if (!messageId || !messageStatus) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não encontrados' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Atualizar status da comunicação no banco
    const updateData: any = {
      status_entrega: messageStatus,
      data_atualizacao: new Date().toISOString(),
    };

    // Se houve erro, adicionar detalhes
    if (errorCode || errorMessage) {
      updateData.erro_codigo = errorCode;
      updateData.erro_mensagem = errorMessage;
    }

    const { error: updateError } = await supabase
      .from('comunicacoes_cliente')
      .update(updateData)
      .eq('message_id', messageId)
      .eq('tipo', 'sms');

    if (updateError) {
      console.error('❌ Erro ao atualizar status SMS:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status' },
        { status: 500 }
      );
    }

    // Log do status recebido
    console.log(`📱 SMS Status Update: ${messageId} -> ${messageStatus}`);
    
    // Verificar se precisa de ação adicional baseada no status
    await handleStatusAction(messageStatus, messageId, to, supabase);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Erro no webhook SMS:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// 🔄 Ações baseadas no status
async function handleStatusAction(
  status: string, 
  messageId: string, 
  to: string, 
  supabase: any
) {
  try {
    switch (status) {
      case 'failed':
      case 'undelivered':
        // Log de falha para análise
        console.warn(`⚠️ SMS falhou para ${to}: ${messageId}`);
        
        // Aqui poderia implementar retry ou notificação alternativa
        break;
        
      case 'delivered':
        console.log(`✅ SMS entregue com sucesso para ${to}: ${messageId}`);
        break;
        
      case 'sent':
        console.log(`📤 SMS enviado para ${to}: ${messageId}`);
        break;
        
      default:
        console.log(`📱 Status SMS: ${status} para ${to}: ${messageId}`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar ação de status:', error);
  }
}

// 🧪 GET - Verificação do webhook (para configuração no Twilio)
export async function GET() {
  return NextResponse.json({
    message: 'Webhook SMS ativo',
    timestamp: new Date().toISOString(),
    endpoint: '/api/webhooks/sms'
  });
}