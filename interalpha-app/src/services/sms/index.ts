// Exportações principais do serviço de SMS

// Serviço principal
export { SMSService, getSMSService } from './sms-service';

// Sistema de notificações
export { SMSNotifications, smsNotifications } from './sms-notifications';

// Worker
export { smsWorker, startSMSWorker, stopSMSWorker } from '../workers/sms-worker';

// Tipos específicos para SMS
export interface SMSTemplateData {
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