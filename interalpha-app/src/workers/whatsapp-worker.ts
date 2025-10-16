import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { getWhatsAppService } from '@/services/whatsapp/whatsapp-service';
import type { WhatsAppJob } from '@/lib/integrations/types';

// Criar worker para processar WhatsApp
export const whatsappWorker = new Worker<WhatsAppJob>(
  'whatsapp-notifications',
  async (job: Job<WhatsAppJob>) => {
    const { to, message, template, templateParams } = job.data;
    
    console.log(`📱 Processando WhatsApp para ${to}`);
    
    try {
      // Atualizar progresso
      await job.updateProgress(10);
      
      // Obter serviço de WhatsApp
      const whatsappService = getWhatsAppService();
      
      // Atualizar progresso
      await job.updateProgress(30);
      
      // Enviar WhatsApp
      const result = await whatsappService.sendMessage(job.data);
      
      // Atualizar progresso
      await job.updateProgress(90);
      
      if (result.success) {
        console.log(`✅ WhatsApp enviado com sucesso para ${to} - SID: ${result.sid}`);
        
        // Atualizar progresso final
        await job.updateProgress(100);
        
        return {
          success: true,
          sid: result.sid,
          recipient: to,
          message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          template,
          sentAt: new Date().toISOString(),
        };
      } 
        throw new Error(result.error || 'Falha no envio do WhatsApp');
      
    } catch (error) {
      console.error(`❌ Erro ao processar WhatsApp para ${to}:`, error);
      
      // Re-throw para que o BullMQ possa fazer retry
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Processar até 2 WhatsApp simultaneamente (menor que SMS por limitações)
    limiter: {
      max: 3, // Máximo 3 WhatsApp
      duration: 60 * 1000, // Por minuto (rate limiting mais restritivo que SMS)
    },
    settings: {
      stalledInterval: 30 * 1000, // 30 segundos
      maxStalledCount: 1,
    },
  }
);

// Event listeners para o worker
whatsappWorker.on('completed', (job, result) => {
  console.log(`✅ WhatsApp worker - Job ${job.id} concluído:`, result);
});

whatsappWorker.on('failed', (job, err) => {
  console.error(`❌ WhatsApp worker - Job ${job?.id} falhou:`, err.message);
  
  // Log específico para erros comuns do Twilio WhatsApp
  if (err.message.includes('63016')) {
    console.error('💡 Erro 63016: Número não está registrado no WhatsApp Business');
  } else if (err.message.includes('63017')) {
    console.error('💡 Erro 63017: Número não pode receber mensagens WhatsApp');
  } else if (err.message.includes('63018')) {
    console.error('💡 Erro 63018: Template não aprovado ou inválido');
  } else if (err.message.includes('21211')) {
    console.error('💡 Erro 21211: Número de telefone inválido');
  }
});

whatsappWorker.on('stalled', (jobId) => {
  console.warn(`⚠️  WhatsApp worker - Job ${jobId} travado`);
});

whatsappWorker.on('progress', (job, progress) => {
  console.log(`⏳ WhatsApp worker - Job ${job.id} progresso: ${progress}%`);
});

// Função para iniciar o worker
export function startWhatsAppWorker() {
  console.log('🚀 WhatsApp worker iniciado');
  return whatsappWorker;
}

// Função para parar o worker
export async function stopWhatsAppWorker() {
  await whatsappWorker.close();
  console.log('🛑 WhatsApp worker parado');
}

// Auto-start em produção
if (process.env.NODE_ENV === 'production') {
  startWhatsAppWorker();
}