import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp/whatsapp-service';
import { whatsappNotifications } from '@/services/whatsapp/whatsapp-notifications';

export async function POST(request: NextRequest) {
  try {
    const { to, type = 'test', ...data } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Número de telefone destinatário é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do número
    const validation = whatsappNotifications.validateWhatsAppNumber(to);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Número inválido: ${validation.error}` },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'test':
        await whatsappNotifications.sendTestMessage(to, data.clientName);
        result = { message: 'WhatsApp de teste agendado com sucesso' };
        break;

      case 'order-created':
        await whatsappNotifications.sendOrderCreated({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          orderNumber: data.orderNumber || 'TEST-001',
          serviceName: data.serviceName || 'Serviço de Teste',
          status: data.status || 'PENDENTE',
        });
        result = { message: 'WhatsApp de ordem criada agendado com sucesso' };
        break;

      case 'order-completed':
        await whatsappNotifications.sendOrderCompleted({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          orderNumber: data.orderNumber || 'TEST-001',
          serviceName: data.serviceName || 'Serviço de Teste',
        });
        result = { message: 'WhatsApp de ordem concluída agendado com sucesso' };
        break;

      case 'payment-received':
        await whatsappNotifications.sendPaymentReceived({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          amount: data.amount || 100.00,
          paymentMethod: data.paymentMethod || 'PIX',
        });
        result = { message: 'WhatsApp de pagamento recebido agendado com sucesso' };
        break;

      case 'payment-overdue':
        await whatsappNotifications.sendPaymentOverdue({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          amount: data.amount || 100.00,
          paymentMethod: data.paymentMethod || 'PIX',
          daysOverdue: data.daysOverdue || 5,
        });
        result = { message: 'WhatsApp de pagamento em atraso agendado com sucesso' };
        break;

      case 'technician-assigned':
        await whatsappNotifications.sendTechnicianAssigned({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          orderNumber: data.orderNumber || 'TEST-001',
          technicianName: data.technicianName || 'João Técnico',
          technicianPhone: data.technicianPhone || '+5511999999999',
        });
        result = { message: 'WhatsApp de técnico designado agendado com sucesso' };
        break;

      case 'connection-test':
        const whatsappService = getWhatsAppService();
        const connectionTest = await whatsappService.testConnection();
        
        if (connectionTest) {
          result = { message: 'Conexão Twilio WhatsApp funcionando corretamente' };
        } else {
          return NextResponse.json(
            { error: 'Falha na conexão Twilio WhatsApp' },
            { status: 500 }
          );
        }
        break;

      case 'custom':
        if (!data.message) {
          return NextResponse.json(
            { error: 'Mensagem é obrigatória para WhatsApp personalizado' },
            { status: 400 }
          );
        }
        await whatsappNotifications.sendCustomMessage(to, data.message);
        result = { message: 'WhatsApp personalizado agendado com sucesso' };
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de teste '${type}' não suportado` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro no teste de WhatsApp:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Testar conexão Twilio e obter informações
    const whatsappService = getWhatsAppService();
    const [connectionTest, messageHistory] = await Promise.all([
      whatsappService.testConnection(),
      whatsappService.getMessageHistory(5), // Últimas 5 mensagens
    ]);

    return NextResponse.json({
      twilio: {
        connected: connectionTest,
        accountSid: process.env.TWILIO_ACCOUNT_SID ? 
          `***${  process.env.TWILIO_ACCOUNT_SID.slice(-10)}` : 'não configurado',
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'não configurado',
      },
      webhook: {
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/whatsapp`,
        status: 'Configure este URL no Twilio Console',
      },
      messageHistory: connectionTest ? messageHistory : [],
      templates: [
        'order_created',
        'order_completed',
        'payment_received',
        'appointment_reminder',
      ],
      testTypes: [
        'test',
        'order-created',
        'order-completed',
        'payment-received',
        'payment-overdue',
        'technician-assigned',
        'connection-test',
        'custom',
      ],
      limits: {
        rateLimit: '3 WhatsApp por minuto',
        concurrency: '2 WhatsApp simultâneos',
        templateRequired: 'Para mensagens comerciais, use templates aprovados',
      },
      requirements: [
        'Número WhatsApp Business aprovado no Twilio',
        'Templates de mensagem aprovados pelo WhatsApp',
        'Webhook configurado no Twilio Console',
        'HTTPS obrigatório para webhook em produção',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao verificar configuração de WhatsApp',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}