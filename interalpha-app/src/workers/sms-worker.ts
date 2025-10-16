import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { getSMSService } from '@/services/sms/sms-service';
import type { SMSJob } from '@/lib/integrations/types';

// Criar worker para processar SMS
export const smsWorker = new Worker<SMSJob>(
  'sms-notifications',
  async (job: Job<SMSJob>) => {
    const { to, message } = job.data;
    
    console.log(`📱 Processando SMS para ${to}`);
    
    try {
      // Atualizar progresso
      await job.updateProgress(10);
      
      // Obter serviço de SMS
      const smsService = getSMSService();
      
      // Atualizar progresso
      await job.updateProgress(30);
      
      // Enviar SMS
      const result = await smsService.sendSMS(job.data);
      
      // Atualizar progresso
      await job.updateProgress(90);
      
      if (result.success) {
        console.log(`✅ SMS enviado com sucesso para ${to} - SID: ${result.sid}`);
        
        // Atualizar progresso final
        await job.updateProgress(100);
        
        return {
          success: true,
          sid: result.sid,
          recipient: to,
          message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          sentAt: new Date().toISOString(),
        };
      } 
        throw new Error(result.error || 'Falha no envio do SMS');
      
    } catch (error) {
      console.error(`❌ Erro ao processar SMS para ${to}:`, error);
      
      // Re-throw para que o BullMQ possa fazer retry
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Processar até 3 SMS simultaneamente (menor que email por limitações de rate)
    limiter: {
      max: 5, // Máximo 5 SMS
      duration: 60 * 1000, // Por minuto (rate limiting mais restritivo)
    },
    settings: {
      stalledInterval: 30 * 1000, // 30 segundos
      maxStalledCount: 1,
    },
  }
);

// Event listeners para o worker
smsWorker.on('completed', (job, result) => {
  console.log(`✅ SMS worker - Job ${job.id} concluído:`, result);
});

smsWorker.on('failed', (job, err) => {
  console.error(`❌ SMS worker - Job ${job?.id} falhou:`, err.message);
  
  // Log específico para erros comuns do Twilio
  if (err.message.includes('21211')) {
    console.error('💡 Erro 21211: Número de telefone inválido');
  } else if (err.message.includes('21408')) {
    console.error('💡 Erro 21408: Permissão negada para enviar SMS para este número');
  } else if (err.message.includes('21610')) {
    console.error('💡 Erro 21610: Número bloqueado ou inválido');
  }
});

smsWorker.on('stalled', (jobId) => {
  console.warn(`⚠️  SMS worker - Job ${jobId} travado`);
});

smsWorker.on('progress', (job, progress) => {
  console.log(`⏳ SMS worker - Job ${job.id} progresso: ${progress}%`);
});

// Função para iniciar o worker
export function startSMSWorker() {
  console.log('🚀 SMS worker iniciado');
  return smsWorker;
}

// Função para parar o worker
export async function stopSMSWorker() {
  await smsWorker.close();
  console.log('🛑 SMS worker parado');
}

// Auto-start em produção
if (process.env.NODE_ENV === 'production') {
  startSMSWorker();
}