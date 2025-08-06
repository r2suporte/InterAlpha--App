import { addJobToQueue, smsQueue } from '@/lib/integrations';
import type { SMSJob } from '@/lib/integrations/types';
import { getSMSService } from './sms-service';

// Tipos específicos para notificações SMS
interface OrderSMSData {
  clientName: string;
  clientPhone: string;
  orderNumber: string;
  serviceName: string;
  status?: string;
  newStatus?: string;
  previousStatus?: string;
}

interface PaymentSMSData {
  clientName: string;
  clientPhone: string;
  amount: number;
  paymentMethod: string;
  daysOverdue?: number;
  orderNumber?: string;
}

interface TechnicianSMSData {
  clientName: string;
  clientPhone: string;
  orderNumber: string;
  technicianName: string;
  technicianPhone?: string;
  scheduledTime?: string;
}

// Classe para gerenciar notificações por SMS
export class SMSNotifications {
  
  // Notificação de nova ordem criada
  static async sendOrderCreated(data: OrderSMSData): Promise<void> {
    const smsService = getSMSService();
    
    const message = smsService.createOptimizedMessage('order-created', {
      orderNumber: data.orderNumber,
      status: data.status || 'PENDENTE',
    });

    const smsData: SMSJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(smsQueue, 'order-created', smsData);
    console.log(`📱 SMS de ordem criada agendado para ${data.clientPhone}`);
  }

  // Notificação de ordem concluída
  static async sendOrderCompleted(data: OrderSMSData): Promise<void> {
    const smsService = getSMSService();
    
    const message = smsService.createOptimizedMessage('order-completed', {
      orderNumber: data.orderNumber,
    });

    const smsData: SMSJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(smsQueue, 'order-completed', smsData);
    console.log(`📱 SMS de ordem concluída agendado para ${data.clientPhone}`);
  }

  // Notificação de mudança de status
  static async sendOrderStatusChanged(data: OrderSMSData): Promise<void> {
    const smsService = getSMSService();
    
    const message = smsService.createOptimizedMessage('order-status-changed', {
      orderNumber: data.orderNumber,
      newStatus: data.newStatus,
    });

    const smsData: SMSJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(smsQueue, 'order-status-changed', smsData);
    console.log(`📱 SMS de status alterado agendado para ${data.clientPhone}`);
  }

  // Notificação de técnico designado
  static async sendTechnicianAssigned(data: TechnicianSMSData): Promise<void> {
    const smsService = getSMSService();
    
    const message = smsService.createOptimizedMessage('technician-assigned', {
      orderNumber: data.orderNumber,
      technicianName: data.technicianName,
      technicianPhone: data.technicianPhone || 'N/A',
    });

    const smsData: SMSJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(smsQueue, 'technician-assigned', smsData);
    console.log(`📱 SMS de técnico designado agendado para ${data.clientPhone}`);
  }

  // Notificação de pagamento recebido
  static async sendPaymentReceived(data: PaymentSMSData): Promise<void> {
    const smsService = getSMSService();
    
    const message = smsService.createOptimizedMessage('payment-received', {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
    });

    const smsData: SMSJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(smsQueue, 'payment-received', smsData);
    console.log(`📱 SMS de pagamento recebido agendado para ${data.clientPhone}`);
  }

  // Notificação de pagamento em atraso
  static async sendPaymentOverdue(data: PaymentSMSData): Promise<void> {
    const smsService = getSMSService();
    
    const message = smsService.createOptimizedMessage('payment-overdue', {
      amount: data.amount,
      daysOverdue: data.daysOverdue || 0,
    });

    const smsData: SMSJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(smsQueue, 'payment-overdue', smsData, {
      priority: 1, // Alta prioridade para lembretes
    });
    console.log(`📱 SMS de pagamento em atraso agendado para ${data.clientPhone}`);
  }

  // Lembrete de agendamento
  static async sendAppointmentReminder(data: TechnicianSMSData): Promise<void> {
    const smsService = getSMSService();
    
    const message = smsService.createOptimizedMessage('appointment-reminder', {
      orderNumber: data.orderNumber,
      time: data.scheduledTime || 'horário agendado',
    });

    const smsData: SMSJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(smsQueue, 'appointment-reminder', smsData);
    console.log(`📱 SMS de lembrete de agendamento agendado para ${data.clientPhone}`);
  }

  // Enviar SMS de teste
  static async sendTestSMS(to: string, clientName: string = 'Cliente'): Promise<void> {
    const smsService = getSMSService();
    
    const message = smsService.createOptimizedMessage('test', {
      timestamp: new Date(),
    });

    const smsData: SMSJob = {
      to,
      message,
    };

    await addJobToQueue(smsQueue, 'test-sms', smsData);
    console.log(`📱 SMS de teste agendado para ${to}`);
  }

  // Enviar SMS personalizado
  static async sendCustomSMS(
    to: string,
    message: string
  ): Promise<void> {
    // Garantir que a mensagem não exceda 160 caracteres
    const optimizedMessage = message.length > 160 
      ? message.substring(0, 157) + '...' 
      : message;

    const smsData: SMSJob = {
      to,
      message: optimizedMessage,
    };

    await addJobToQueue(smsQueue, 'custom-sms', smsData);
    console.log(`📱 SMS personalizado agendado para ${to}`);
  }

  // Enviar múltiplos SMS (broadcast)
  static async sendBroadcastSMS(
    recipients: string[],
    message: string
  ): Promise<void> {
    const optimizedMessage = message.length > 160 
      ? message.substring(0, 157) + '...' 
      : message;

    const jobs = recipients.map(to => ({
      to,
      message: optimizedMessage,
    }));

    // Adicionar todos os jobs de uma vez
    await Promise.all(
      jobs.map(smsData => 
        addJobToQueue(smsQueue, 'broadcast-sms', smsData)
      )
    );

    console.log(`📱 ${recipients.length} SMS de broadcast agendados`);
  }

  // Agendar SMS para envio futuro
  static async scheduleSMS(
    to: string,
    message: string,
    sendAt: Date
  ): Promise<void> {
    const delay = sendAt.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Data de agendamento deve ser no futuro');
    }

    const optimizedMessage = message.length > 160 
      ? message.substring(0, 157) + '...' 
      : message;

    const smsData: SMSJob = {
      to,
      message: optimizedMessage,
    };

    await addJobToQueue(smsQueue, 'scheduled-sms', smsData, {
      delay,
    });

    console.log(`📱 SMS agendado para ${to} - Envio em: ${sendAt.toLocaleString('pt-BR')}`);
  }

  // Validar número de telefone antes de enviar
  static validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      return {
        isValid: false,
        error: 'Número deve ter entre 10 e 15 dígitos',
      };
    }

    // Verificar se é um número brasileiro válido
    if (cleanNumber.length === 11 && (cleanNumber.startsWith('11') || cleanNumber.startsWith('21'))) {
      return { isValid: true };
    }

    if (cleanNumber.length === 10 && (cleanNumber.startsWith('1') || cleanNumber.startsWith('2'))) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'Formato de número brasileiro inválido',
    };
  }
}

// Exportar instância singleton
export const smsNotifications = SMSNotifications;