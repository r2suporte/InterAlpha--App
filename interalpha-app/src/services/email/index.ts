// Exportações principais do serviço de email

// Serviço principal
export { EmailService, getEmailService } from './email-service';

// Sistema de notificações
export { EmailNotifications, emailNotifications } from './email-notifications';

// Template engine
export { renderEmailTemplate, clearTemplateCache } from './templates/template-engine';

// Worker
export { emailWorker, startEmailWorker, stopEmailWorker } from '../workers/email-worker';

// Tipos específicos para email
export interface EmailTemplateData {
  clientName: string;
  orderNumber?: string;
  serviceName?: string;
  amount?: number;
  [key: string]: any;
}