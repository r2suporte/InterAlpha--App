// 📱 API SMS - Envio Genérico
// Endpoint para envio de SMS via Twilio

import { NextRequest, NextResponse } from 'next/server';
import { smsService, SMSService } from '@/lib/services/sms-service';

// 📤 POST - Enviar SMS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, template, templateData } = body;

    // Validação básica
    if (!to) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Número de telefone é obrigatório' 
        },
        { status: 400 }
      );
    }

    let messageToSend = message;

    // Se foi especificado um template
    if (template && templateData) {
      try {
        switch (template) {
          case 'bemVindo':
            messageToSend = SMSService.templates.bemVindo(templateData.nome);
            break;
          case 'lembreteManutencao':
            messageToSend = SMSService.templates.lembreteManutencao(templateData.nome, templateData.equipamento);
            break;
          case 'promocao':
            messageToSend = SMSService.templates.promocao(templateData.nome, templateData.desconto);
            break;
          case 'agendamento':
            messageToSend = SMSService.templates.agendamento(templateData.nome, templateData.data, templateData.hora);
            break;
          default:
            return NextResponse.json(
              { 
                success: false, 
                error: 'Template não encontrado' 
              },
              { status: 400 }
            );
        }
      } catch (error) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Erro ao processar template' 
          },
          { status: 400 }
        );
      }
    }

    if (!messageToSend) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mensagem ou template é obrigatório' 
        },
        { status: 400 }
      );
    }

    // Enviar SMS
    const result = await smsService.sendSMS(to, messageToSend);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS enviado com sucesso'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Erro ao enviar SMS' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erro na API SMS:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}