import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/services/email/email-service';
import { emailNotifications } from '@/services/email/email-notifications';

export async function POST(request: NextRequest) {
  try {
    const { to, type = 'test', ...data } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email destinatário é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'test':
        await emailNotifications.sendTestEmail(to, data.clientName);
        result = { message: 'Email de teste agendado com sucesso' };
        break;

      case 'order-created':
        await emailNotifications.sendOrderCreated({
          clientName: data.clientName || 'Cliente Teste',
          clientEmail: to,
          orderNumber: data.orderNumber || 'TEST-001',
          serviceName: data.serviceName || 'Serviço de Teste',
          description: data.description,
        });
        result = { message: 'Email de ordem criada agendado com sucesso' };
        break;

      case 'order-completed':
        await emailNotifications.sendOrderCompleted({
          clientName: data.clientName || 'Cliente Teste',
          clientEmail: to,
          orderNumber: data.orderNumber || 'TEST-001',
          serviceName: data.serviceName || 'Serviço de Teste',
          notes: data.notes,
        });
        result = { message: 'Email de ordem concluída agendado com sucesso' };
        break;

      case 'payment-received':
        await emailNotifications.sendPaymentReceived({
          clientName: data.clientName || 'Cliente Teste',
          clientEmail: to,
          amount: data.amount || 100.00,
          paymentMethod: data.paymentMethod || 'PIX',
          transactionId: data.transactionId,
        });
        result = { message: 'Email de pagamento recebido agendado com sucesso' };
        break;

      case 'connection-test':
        const emailService = getEmailService();
        const connectionTest = await emailService.testConnection();
        
        if (connectionTest) {
          result = { message: 'Conexão SMTP funcionando corretamente' };
        } else {
          return NextResponse.json(
            { error: 'Falha na conexão SMTP' },
            { status: 500 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de teste '${type}' não suportado` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro no teste de email:', error);
    
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
    // Testar conexão SMTP
    const emailService = getEmailService();
    const connectionTest = await emailService.testConnection();

    return NextResponse.json({
      smtp: {
        connected: connectionTest,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'não configurado',
      },
      templates: [
        'test',
        'order-created',
        'order-completed',
        'order-status-changed',
        'technician-assigned',
        'payment-received',
        'payment-overdue',
      ],
      testTypes: [
        'test',
        'order-created',
        'order-completed',
        'payment-received',
        'connection-test',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao verificar configuração de email',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}