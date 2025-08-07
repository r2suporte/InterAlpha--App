// Exportações principais das integrações avançadas

// Configurações
export { integrationConfig, validateConfig } from './config';

// Tipos
export * from './types';

// Filas
export {
  emailQueue,
  smsQueue,
  whatsappQueue,
  calendarQueue,
  accountingQueue,
  backupQueue,
  workflowQueue,
  addJobToQueue,
  pauseQueue,
  resumeQueue,
  getQueueStats,
  cleanOldJobs,
} from './queues';

// Inicialização
export {
  initializeIntegrations,
  shutdownIntegrations,
  checkIntegrationsHealth,
} from './init';

// Redis
export { redisConnection, redisCache } from '../redis';