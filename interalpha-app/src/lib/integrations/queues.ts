import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from '../redis';

// Definição dos tipos de jobs
export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface SMSJob {
  to: string;
  message: string;
}

export interface WhatsAppJob {
  to: string;
  message: string;
  template?: string;
  templateParams?: any[];
}

export interface CalendarJob {
  action: 'create' | 'update' | 'delete';
  eventData: any;
  calendarId?: string;
}

export interface AccountingSyncJob {
  entityType: 'payment' | 'invoice' | 'order';
  entityId: string;
  action: 'create' | 'update' | 'delete';
}

export interface BackupJob {
  type: 'full' | 'incremental';
  tables?: string[];
}

export interface WorkflowJob {
  trigger: {
    type: string;
    entityId: string;
    data: Record<string, any>;
    timestamp: Date;
  };
  ruleId?: string;
  retryCount?: number;
}

// Configuração padrão para jobs
const defaultJobOptions = {
  removeOnComplete: 10,
  removeOnFail: 50,
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
};

// Criação das filas
export const emailQueue = new Queue<EmailJob>('email-notifications', {
  connection: redisConnection,
  defaultJobOptions,
});

export const smsQueue = new Queue<SMSJob>('sms-notifications', {
  connection: redisConnection,
  defaultJobOptions,
});

export const whatsappQueue = new Queue<WhatsAppJob>('whatsapp-notifications', {
  connection: redisConnection,
  defaultJobOptions,
});

export const calendarQueue = new Queue<CalendarJob>('calendar-sync', {
  connection: redisConnection,
  defaultJobOptions,
});

export const accountingQueue = new Queue<AccountingSyncJob>('accounting-sync', {
  connection: redisConnection,
  defaultJobOptions,
});

export const backupQueue = new Queue<BackupJob>('backup-jobs', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 1, // Backups não devem ter retry automático
  },
});

export const workflowQueue = new Queue<WorkflowJob>('workflow-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2, // Workflows podem ter retry limitado
  },
});

// Event listeners para monitoramento
const setupQueueEvents = (queue: Queue, name: string) => {
  const queueEvents = new QueueEvents(queue.name, { connection: redisConnection });
  
  queueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`✅ ${name} job ${jobId} completed:`, returnvalue);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ ${name} job ${jobId} failed:`, failedReason);
  });

  queueEvents.on('progress', ({ jobId, data }) => {
    console.log(`⏳ ${name} job ${jobId} progress:`, data);
  });

  return queueEvents;
};

// Configurar eventos para todas as filas
export const queueEvents = {
  email: setupQueueEvents(emailQueue, 'Email'),
  sms: setupQueueEvents(smsQueue, 'SMS'),
  whatsapp: setupQueueEvents(whatsappQueue, 'WhatsApp'),
  calendar: setupQueueEvents(calendarQueue, 'Calendar'),
  accounting: setupQueueEvents(accountingQueue, 'Accounting'),
  backup: setupQueueEvents(backupQueue, 'Backup'),
  workflow: setupQueueEvents(workflowQueue, 'Workflow'),
};

// Função para adicionar jobs com logging
export async function addJobToQueue<T>(
  queue: Queue<T>,
  jobName: string,
  data: T,
  options?: any
) {
  try {
    const job = await queue.add(jobName, data, options);
    console.log(`📋 Job ${jobName} adicionado à fila ${queue.name} com ID: ${job.id}`);
    return job;
  } catch (error) {
    console.error(`❌ Erro ao adicionar job ${jobName} à fila ${queue.name}:`, error);
    throw error;
  }
}

// Função para pausar/retomar filas
export async function pauseQueue(queue: Queue) {
  await queue.pause();
  console.log(`⏸️  Fila ${queue.name} pausada`);
}

export async function resumeQueue(queue: Queue) {
  await queue.resume();
  console.log(`▶️  Fila ${queue.name} retomada`);
}

// Função para obter estatísticas das filas
export async function getQueueStats(queue: Queue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);

  return {
    name: queue.name,
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
}

// Função para limpar filas antigas
export async function cleanOldJobs(queue: Queue, maxAge = 24 * 60 * 60 * 1000) {
  const cleaned = await queue.clean(maxAge, 1000, 'completed');
  console.log(`🧹 Limpeza da fila ${queue.name}: ${cleaned.length} jobs removidos`);
  return cleaned;
}