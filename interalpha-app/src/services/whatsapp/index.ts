// Exportações principais do serviço de WhatsApp

// Serviço principal
export { WhatsAppService, getWhatsAppService } from './whatsapp-service';

// Sistema de notificações
export { WhatsAppNotifications, whatsappNotifications } from './whatsapp-notifications';

// Worker
export { whatsappWorker, startWhatsAppWorker, stopWhatsAppWorker } from '../workers/whatsapp-worker';

// Tipos específicos para WhatsApp
export interface WhatsAppTemplateData {
  clientName: string;
  orderNumber?: string;
  serviceName?: string;
  amount?: number;
  daysOverdue?: number;
  technicianName?: string;
  technicianPhone?: string;
  scheduledTime?: string;
  [key: string]: any;
}

export interface WhatsAppConversation {
  id: string;
  phoneNumber: string;
  clienteId?: string;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  lastMessageAt: Date;
  createdAt: Date;
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  messageType: 'TEXT' | 'MEDIA' | 'TEMPLATE';
  twilioSid?: string;
  sentAt: Date;
}