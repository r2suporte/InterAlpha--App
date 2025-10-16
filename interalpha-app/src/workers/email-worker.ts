import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { getEmailService } from '@/services/email/email-service';
import type { EmailJob } from '@/lib/integrations/types';

// Criar worker para processar emails
export const emailWorker = new Worker<EmailJob>(
  'email-notifications',
  async (job: Job<EmailJob>) => {
    const { to, subject, template, data } = job.data;
    
    console.log(`📧 Processando email para ${to} - Template: ${template}`);
    
    try {
      // Atualizar progresso
      await job.updateProgress(10);
      
      // Obter serviço de email
      const emailService = getEmailService();
      
      // Atualizar progresso
      await job.updateProgress(30);
      
      // Enviar email
      const result = await emailService.sendEmail(job.data);
      
      // Atualizar progresso
      await job.updateProgress(90);
      
      if (result.success) {
        console.log(`✅ Email enviado com sucesso para ${to} - MessageID: ${result.messageId}`);
        
        // Atualizar progresso final
        await job.updateProgress(100);
        
        return {
          success: true,
          messageId: result.messageId,
          recipient: to,
          template,
          sentAt: new Date().toISOString(),
        };
      } 
        throw new Error(result.error || 'Falha no envio do email');
      
    } catch (error) {
      console.error(`❌ Erro ao processar email para ${to}:`, error);
      
      // Re-throw para que o BullMQ possa fazer retry
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Processar até 5 emails simultaneamente
    limiter: {
      max: 10, // Máximo 10 emails
      duration: 60 * 1000, // Por minuto (rate limiting)
    },
    settings: {
      stalledInterval: 30 * 1000, // 30 segundos
      maxStalledCount: 1,
    },
  }
);

// Event listeners para o worker
emailWorker.on('completed', (job, result) => {
  console.log(`✅ Email worker - Job ${job.id} concluído:`, result);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Email worker - Job ${job?.id} falhou:`, err.message);
});

emailWorker.on('stalled', (jobId) => {
  console.warn(`⚠️  Email worker - Job ${jobId} travado`);
});

emailWorker.on('progress', (job, progress) => {
  console.log(`⏳ Email worker - Job ${job.id} progresso: ${progress}%`);
});

// Função para iniciar o worker
export function startEmailWorker() {
  console.log('🚀 Email worker iniciado');
  return emailWorker;
}

// Função para parar o worker
export async function stopEmailWorker() {
  await emailWorker.close();
  console.log('🛑 Email worker parado');
}

// Auto-start em produção
if (process.env.NODE_ENV === 'production') {
  startEmailWorker();
}