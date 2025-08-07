import { NextRequest, NextResponse } from 'next/server';
import { getSMSService } from '@/services/sms/sms-service';
import { smsNotifications } from '@/services/sms/sms-notifications';

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
    const validation = smsNotifications.validatePhoneNumber(to);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Número inválido: ${validation.error}` },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'test':
        await smsNotifications.sendTestSMS(to, data.clientName);
        result = { message: 'SMS de teste agendado com sucesso' };
        break;

      case 'order-created':
        await smsNotifications.sendOrderCreated({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          orderNumber: data.orderNumber || 'TEST-001',
          serviceName: data.serviceName || 'Serviço de Teste',
          status: data.status || 'PENDENTE',
        });
        result = { message: 'SMS de ordem criada agendado com sucesso' };
        break;

      case 'order-completed':
        await smsNotifications.sendOrderCompleted({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          orderNumber: data.orderNumber || 'TEST-001',
          serviceName: data.serviceName || 'Serviço de Teste',
        });
        result = { message: 'SMS de ordem concluída agendado com sucesso' };
        break;

      case 'payment-received':
        await smsNotifications.sendPaymentReceived({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          amount: data.amount || 100.00,
          paymentMethod: data.paymentMethod || 'PIX',
        });
        result = { message: 'SMS de pagamento recebido agendado com sucesso' };
        break;

      case 'payment-overdue':
        await smsNotifications.sendPaymentOverdue({
          clientName: data.clientName || 'Cliente Teste',
          clientPhone: to,
          amount: data.amount || 100.00,
          paymentMethod: data.paymentMethod || 'PIX',
          daysOverdue: data.daysOverdue || 5,
        });
        result = { message: 'SMS de pagamento em atraso agendado com sucesso' };
        break;

      case 'connection-test':
        const smsService = getSMSService();
        const connectionTest = await smsService.testConnection();
        
        if (connectionTest) {
          result = { message: 'Conexão Twilio funcionando corretamente' };
        } else {
          return NextResponse.json(
            { error: 'Falha na conexão Twilio' },
            { status: 500 }
          );
        }
        break;

      case 'custom':
        if (!data.message) {
          return NextResponse.json(
            { error: 'Mensagem é obrigatória para SMS personalizado' },
            { status: 400 }
          );
        }
        await smsNotifications.sendCustomSMS(to, data.message);
        result = { message: 'SMS personalizado agendado com sucesso' };
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de teste '${type}' não suportado` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro no teste de SMS:', error);
    
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
    // Testar conexão Twilio e obter informações da conta
    const smsService = getSMSService();
    const [connectionTest, accountInfo, messageHistory] = await Promise.all([
      smsService.testConnection(),
      smsService.getAccountInfo(),
      smsService.getMessageHistory(5), // Últimas 5 mensagens
    ]);

    return NextResponse.json({
      twilio: {
        connected: connectionTest,
        accountSid: process.env.TWILIO_ACCOUNT_SID ? 
          '***' + process.env.TWILIO_ACCOUNT_SID.slice(-10) : 'não configurado',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'não configurado',
        accountInfo: connectionTest ? accountInfo : null,
      },
      messageHistory: connectionTest ? messageHistory : [],
      templates: [
        'test',
        'order-created',
        'order-completed',
        'order-status-changed',
        'technician-assigned',
        'payment-received',
        'payment-overdue',
        'appointment-reminder',
      ],
      testTypes: [
        'test',
        'order-created',
        'order-completed',
        'payment-received',
        'payment-overdue',
        'connection-test',
        'custom',
      ],
      limits: {
        maxMessageLength: 160,
        rateLimit: '5 SMS por minuto',
        concurrency: '3 SMS simultâneos',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao verificar configuração de SMS',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}