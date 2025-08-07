import { addJobToQueue, whatsappQueue } from '@/lib/integrations';
import type { WhatsAppJob } from '@/lib/integrations/types';
import { getWhatsAppService } from './whatsapp-service';

// Tipos específicos para notificações WhatsApp
interface OrderWhatsAppData {
  clientName: string;
  clientPhone: string;
  orderNumber: string;
  serviceName: string;
  status?: string;
  newStatus?: string;
  previousStatus?: string;
}

interface PaymentWhatsAppData {
  clientName: string;
  clientPhone: string;
  amount: number;
  paymentMethod: string;
  daysOverdue?: number;
  orderNumber?: string;
}

interface TechnicianWhatsAppData {
  clientName: string;
  clientPhone: string;
  orderNumber: string;
  technicianName: string;
  technicianPhone?: string;
  scheduledTime?: string;
}

// Classe para gerenciar notificações por WhatsApp
export class WhatsAppNotifications {
  
  // Notificação de nova ordem criada
  static async sendOrderCreated(data: OrderWhatsAppData): Promise<void> {
    const message = `🔧 *InterAlpha - Nova Ordem*\n\n` +
      `Olá ${data.clientName}!\n\n` +
      `Sua ordem de serviço foi criada:\n` +
      `📋 *Número:* ${data.orderNumber}\n` +
      `⚙️ *Serviço:* ${data.serviceName}\n` +
      `📊 *Status:* ${data.status || 'PENDENTE'}\n\n` +
      `Você será notificado sobre atualizações.\n\n` +
      `_Mensagem automática do sistema InterAlpha_`;

    const whatsappData: WhatsAppJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(whatsappQueue, 'order-created', whatsappData);
    console.log(`📱 WhatsApp de ordem criada agendado para ${data.clientPhone}`);
  }

  // Notificação de ordem concluída
  static async sendOrderCompleted(data: OrderWhatsAppData): Promise<void> {
    const message = `✅ *InterAlpha - Ordem Concluída*\n\n` +
      `Ótima notícia, ${data.clientName}!\n\n` +
      `Sua ordem foi concluída com sucesso:\n` +
      `📋 *Número:* ${data.orderNumber}\n` +
      `⚙️ *Serviço:* ${data.serviceName}\n\n` +
      `🎉 Obrigado por escolher nossos serviços!\n\n` +
      `_Mensagem automática do sistema InterAlpha_`;

    const whatsappData: WhatsAppJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(whatsappQueue, 'order-completed', whatsappData);
    console.log(`📱 WhatsApp de ordem concluída agendado para ${data.clientPhone}`);
  }

  // Notificação de mudança de status
  static async sendOrderStatusChanged(data: OrderWhatsAppData): Promise<void> {
    const statusEmojis: Record<string, string> = {
      'PENDENTE': '⏳',
      'EM_ANDAMENTO': '🔄',
      'CONCLUIDA': '✅',
      'CANCELADA': '❌',
    };

    const message = `📊 *InterAlpha - Status Atualizado*\n\n` +
      `Olá ${data.clientName}!\n\n` +
      `Status da sua ordem foi atualizado:\n` +
      `📋 *Número:* ${data.orderNumber}\n` +
      `⚙️ *Serviço:* ${data.serviceName}\n` +
      `📊 *Status:* ${statusEmojis[data.newStatus || ''] || '📊'} ${data.newStatus}\n\n` +
      `Acompanhe o progresso pelo nosso sistema.\n\n` +
      `_Mensagem automática do sistema InterAlpha_`;

    const whatsappData: WhatsAppJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(whatsappQueue, 'order-status-changed', whatsappData);
    console.log(`📱 WhatsApp de status alterado agendado para ${data.clientPhone}`);
  }

  // Notificação de técnico designado
  static async sendTechnicianAssigned(data: TechnicianWhatsAppData): Promise<void> {
    const message = `👨‍🔧 *InterAlpha - Técnico Designado*\n\n` +
      `Olá ${data.clientName}!\n\n` +
      `Um técnico foi designado para sua ordem:\n` +
      `📋 *Ordem:* ${data.orderNumber}\n` +
      `👨‍🔧 *Técnico:* ${data.technicianName}\n` +
      `${data.technicianPhone ? `📞 *Contato:* ${data.technicianPhone}\n` : ''}` +
      `${data.scheduledTime ? `🕐 *Agendado:* ${data.scheduledTime}\n` : ''}\n` +
      `O técnico entrará em contato em breve.\n\n` +
      `_Mensagem automática do sistema InterAlpha_`;

    const whatsappData: WhatsAppJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(whatsappQueue, 'technician-assigned', whatsappData);
    console.log(`📱 WhatsApp de técnico designado agendado para ${data.clientPhone}`);
  }

  // Notificação de pagamento recebido
  static async sendPaymentReceived(data: PaymentWhatsAppData): Promise<void> {
    const message = `💰 *InterAlpha - Pagamento Confirmado*\n\n` +
      `Olá ${data.clientName}!\n\n` +
      `Confirmamos o recebimento do seu pagamento:\n` +
      `💵 *Valor:* ${data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n` +
      `💳 *Método:* ${data.paymentMethod}\n` +
      `${data.orderNumber ? `📋 *Ordem:* ${data.orderNumber}\n` : ''}\n` +
      `✅ Obrigado pelo pagamento!\n\n` +
      `_Mensagem automática do sistema InterAlpha_`;

    const whatsappData: WhatsAppJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(whatsappQueue, 'payment-received', whatsappData);
    console.log(`📱 WhatsApp de pagamento recebido agendado para ${data.clientPhone}`);
  }

  // Notificação de pagamento em atraso
  static async sendPaymentOverdue(data: PaymentWhatsAppData): Promise<void> {
    const message = `⚠️ *InterAlpha - Lembrete de Pagamento*\n\n` +
      `Olá ${data.clientName}!\n\n` +
      `Identificamos um pagamento em atraso:\n` +
      `💵 *Valor:* ${data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n` +
      `📅 *Dias em atraso:* ${data.daysOverdue || 0}\n` +
      `${data.orderNumber ? `📋 *Ordem:* ${data.orderNumber}\n` : ''}\n` +
      `Por favor, regularize sua situação.\n\n` +
      `💬 Responda esta mensagem se tiver dúvidas.\n\n` +
      `_Mensagem automática do sistema InterAlpha_`;

    const whatsappData: WhatsAppJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(whatsappQueue, 'payment-overdue', whatsappData, {
      priority: 1, // Alta prioridade para lembretes
    });
    console.log(`📱 WhatsApp de pagamento em atraso agendado para ${data.clientPhone}`);
  }

  // Lembrete de agendamento
  static async sendAppointmentReminder(data: TechnicianWhatsAppData): Promise<void> {
    const message = `⏰ *InterAlpha - Lembrete de Agendamento*\n\n` +
      `Olá ${data.clientName}!\n\n` +
      `Lembrete do seu agendamento:\n` +
      `📋 *Ordem:* ${data.orderNumber}\n` +
      `🕐 *Horário:* ${data.scheduledTime || 'Horário agendado'}\n` +
      `👨‍🔧 *Técnico:* ${data.technicianName}\n\n` +
      `Por favor, esteja disponível no horário marcado.\n\n` +
      `_Mensagem automática do sistema InterAlpha_`;

    const whatsappData: WhatsAppJob = {
      to: data.clientPhone,
      message,
    };

    await addJobToQueue(whatsappQueue, 'appointment-reminder', whatsappData);
    console.log(`📱 WhatsApp de lembrete agendado para ${data.clientPhone}`);
  } 
 // Enviar WhatsApp de teste
  static async sendTestMessage(to: string, clientName: string = 'Cliente'): Promise<void> {
    const message = `🧪 *InterAlpha - Teste WhatsApp*\n\n` +
      `Olá ${clientName}!\n\n` +
      `Este é um teste do sistema WhatsApp.\n\n` +
      `📅 *Data:* ${new Date().toLocaleString('pt-BR')}\n` +
      `✅ *Status:* Sistema funcionando\n\n` +
      `_Mensagem de teste do sistema InterAlpha_`;

    const whatsappData: WhatsAppJob = {
      to,
      message,
    };

    await addJobToQueue(whatsappQueue, 'test-whatsapp', whatsappData);
    console.log(`📱 WhatsApp de teste agendado para ${to}`);
  }

  // Enviar WhatsApp personalizado
  static async sendCustomMessage(
    to: string,
    message: string
  ): Promise<void> {
    const whatsappData: WhatsAppJob = {
      to,
      message,
    };

    await addJobToQueue(whatsappQueue, 'custom-whatsapp', whatsappData);
    console.log(`📱 WhatsApp personalizado agendado para ${to}`);
  }

  // Enviar múltiplos WhatsApp (broadcast)
  static async sendBroadcastMessage(
    recipients: string[],
    message: string
  ): Promise<void> {
    const jobs = recipients.map(to => ({
      to,
      message,
    }));

    // Adicionar todos os jobs de uma vez
    await Promise.all(
      jobs.map(whatsappData => 
        addJobToQueue(whatsappQueue, 'broadcast-whatsapp', whatsappData)
      )
    );

    console.log(`📱 ${recipients.length} WhatsApp de broadcast agendados`);
  }

  // Agendar WhatsApp para envio futuro
  static async scheduleMessage(
    to: string,
    message: string,
    sendAt: Date
  ): Promise<void> {
    const delay = sendAt.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Data de agendamento deve ser no futuro');
    }

    const whatsappData: WhatsAppJob = {
      to,
      message,
    };

    await addJobToQueue(whatsappQueue, 'scheduled-whatsapp', whatsappData, {
      delay,
    });

    console.log(`📱 WhatsApp agendado para ${to} - Envio em: ${sendAt.toLocaleString('pt-BR')}`);
  }

  // Validar número de WhatsApp antes de enviar
  static validateWhatsAppNumber(phoneNumber: string): { isValid: boolean; error?: string } {
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

    if (cleanNumber.length === 13 && cleanNumber.startsWith('55')) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'Formato de número brasileiro inválido para WhatsApp',
    };
  }
}

// Exportar instância singleton
export const whatsappNotifications = WhatsAppNotifications;