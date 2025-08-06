import { addJobToQueue, emailQueue } from '@/lib/integrations';
import type { EmailJob } from '@/lib/integrations/types';

// Tipos específicos para notificações
interface OrderNotificationData {
  clientName: string;
  clientEmail: string;
  orderNumber: string;
  serviceName: string;
  status?: string;
  description?: string;
  notes?: string;
  createdAt?: Date;
  completedAt?: Date;
  updatedAt?: Date;
  previousStatus?: string;
  newStatus?: string;
}

interface PaymentNotificationData {
  clientName: string;
  clientEmail: string;
  amount: number;
  paymentMethod: string;
  paidAt?: Date;
  dueDate?: Date;
  daysOverdue?: number;
  transactionId?: string;
  orderNumber?: string;
}

interface TechnicianNotificationData {
  clientName: string;
  clientEmail: string;
  orderNumber: string;
  serviceName: string;
  technicianName: string;
  technicianPhone?: string;
  scheduledDate?: Date;
}

// Classe para gerenciar notificações por email
export class EmailNotifications {
  
  // Notificação de nova ordem criada
  static async sendOrderCreated(data: OrderNotificationData): Promise<void> {
    const emailData: EmailJob = {
      to: data.clientEmail,
      subject: `Nova Ordem de Serviço #${data.orderNumber} - InterAlpha`,
      template: 'order-created',
      data: {
        clientName: data.clientName,
        orderNumber: data.orderNumber,
        serviceName: data.serviceName,
        status: data.status || 'PENDENTE',
        description: data.description,
        createdAt: data.createdAt || new Date(),
      },
    };

    await addJobToQueue(emailQueue, 'order-created', emailData);
    console.log(`📧 Email de ordem criada agendado para ${data.clientEmail}`);
  }

  // Notificação de ordem concluída
  static async sendOrderCompleted(data: OrderNotificationData): Promise<void> {
    const emailData: EmailJob = {
      to: data.clientEmail,
      subject: `Ordem Concluída #${data.orderNumber} - InterAlpha`,
      template: 'order-completed',
      data: {
        clientName: data.clientName,
        orderNumber: data.orderNumber,
        serviceName: data.serviceName,
        completedAt: data.completedAt || new Date(),
        notes: data.notes,
      },
    };

    await addJobToQueue(emailQueue, 'order-completed', emailData);
    console.log(`📧 Email de ordem concluída agendado para ${data.clientEmail}`);
  }

  // Notificação de mudança de status
  static async sendOrderStatusChanged(data: OrderNotificationData): Promise<void> {
    const emailData: EmailJob = {
      to: data.clientEmail,
      subject: `Status Atualizado - Ordem #${data.orderNumber}`,
      template: 'order-status-changed',
      data: {
        clientName: data.clientName,
        orderNumber: data.orderNumber,
        serviceName: data.serviceName,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        updatedAt: data.updatedAt || new Date(),
        notes: data.notes,
      },
    };

    await addJobToQueue(emailQueue, 'order-status-changed', emailData);
    console.log(`📧 Email de status alterado agendado para ${data.clientEmail}`);
  }

  // Notificação de técnico designado
  static async sendTechnicianAssigned(data: TechnicianNotificationData): Promise<void> {
    const emailData: EmailJob = {
      to: data.clientEmail,
      subject: `Técnico Designado - Ordem #${data.orderNumber}`,
      template: 'technician-assigned',
      data: {
        clientName: data.clientName,
        orderNumber: data.orderNumber,
        serviceName: data.serviceName,
        technicianName: data.technicianName,
        technicianPhone: data.technicianPhone,
        scheduledDate: data.scheduledDate,
      },
    };

    await addJobToQueue(emailQueue, 'technician-assigned', emailData);
    console.log(`📧 Email de técnico designado agendado para ${data.clientEmail}`);
  }

  // Notificação de pagamento recebido
  static async sendPaymentReceived(data: PaymentNotificationData): Promise<void> {
    const emailData: EmailJob = {
      to: data.clientEmail,
      subject: `Pagamento Confirmado - ${data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      template: 'payment-received',
      data: {
        clientName: data.clientName,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt || new Date(),
        transactionId: data.transactionId,
        orderNumber: data.orderNumber,
      },
    };

    await addJobToQueue(emailQueue, 'payment-received', emailData);
    console.log(`📧 Email de pagamento recebido agendado para ${data.clientEmail}`);
  }

  // Notificação de pagamento em atraso
  static async sendPaymentOverdue(data: PaymentNotificationData): Promise<void> {
    const emailData: EmailJob = {
      to: data.clientEmail,
      subject: `Lembrete de Pagamento - ${data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      template: 'payment-overdue',
      data: {
        clientName: data.clientName,
        amount: data.amount,
        dueDate: data.dueDate,
        daysOverdue: data.daysOverdue,
        orderNumber: data.orderNumber,
      },
    };

    await addJobToQueue(emailQueue, 'payment-overdue', emailData, {
      priority: 1, // Alta prioridade para lembretes
    });
    console.log(`📧 Email de pagamento em atraso agendado para ${data.clientEmail}`);
  }

  // Enviar email de teste
  static async sendTestEmail(to: string, clientName: string = 'Usuário'): Promise<void> {
    const emailData: EmailJob = {
      to,
      subject: 'Email de Teste - InterAlpha',
      template: 'test',
      data: {
        clientName,
        message: 'Este é um email de teste do sistema InterAlpha.',
        timestamp: new Date(),
      },
    };

    await addJobToQueue(emailQueue, 'test-email', emailData);
    console.log(`📧 Email de teste agendado para ${to}`);
  }

  // Enviar email personalizado
  static async sendCustomEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>
  ): Promise<void> {
    const emailData: EmailJob = {
      to,
      subject,
      template,
      data,
    };

    await addJobToQueue(emailQueue, 'custom-email', emailData);
    console.log(`📧 Email personalizado agendado para ${to} - Template: ${template}`);
  }

  // Enviar múltiplos emails (broadcast)
  static async sendBroadcastEmail(
    recipients: string[],
    subject: string,
    template: string,
    data: Record<string, any>
  ): Promise<void> {
    const jobs = recipients.map(to => ({
      to,
      subject,
      template,
      data,
    }));

    // Adicionar todos os jobs de uma vez
    await Promise.all(
      jobs.map(emailData => 
        addJobToQueue(emailQueue, 'broadcast-email', emailData)
      )
    );

    console.log(`📧 ${recipients.length} emails de broadcast agendados - Template: ${template}`);
  }

  // Agendar email para envio futuro
  static async scheduleEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>,
    sendAt: Date
  ): Promise<void> {
    const delay = sendAt.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Data de agendamento deve ser no futuro');
    }

    const emailData: EmailJob = {
      to,
      subject,
      template,
      data,
    };

    await addJobToQueue(emailQueue, 'scheduled-email', emailData, {
      delay,
    });

    console.log(`📧 Email agendado para ${to} - Envio em: ${sendAt.toLocaleString('pt-BR')}`);
  }
}

// Exportar instância singleton
export const emailNotifications = EmailNotifications;