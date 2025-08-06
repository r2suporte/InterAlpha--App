import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { workflowEngine, WorkflowTrigger } from '@/services/workflow/workflow-engine';

// Interface para jobs de workflow
interface WorkflowJob {
  trigger: WorkflowTrigger;
  ruleId?: string;
  retryCount?: number;
}

// Criar worker para processar workflows
export const workflowWorker = new Worker<WorkflowJob>(
  'workflow-processing',
  async (job: Job<WorkflowJob>) => {
    const { trigger, ruleId } = job.data;
    
    console.log(`🔄 Processando workflow: ${trigger.type} para entidade ${trigger.entityId}`);
    
    try {
      // Atualizar progresso
      await job.updateProgress(10);
      
      // Executar workflows
      await workflowEngine.executeWorkflows(trigger);
      
      // Atualizar progresso
      await job.updateProgress(90);
      
      console.log(`✅ Workflow processado com sucesso: ${trigger.type}`);
      
      // Atualizar progresso final
      await job.updateProgress(100);
      
      return {
        success: true,
        triggerType: trigger.type,
        entityId: trigger.entityId,
        processedAt: new Date().toISOString(),
        ruleId,
      };
    } catch (error) {
      console.error(`❌ Erro ao processar workflow ${trigger.type}:`, error);
      
      // Re-throw para que o BullMQ possa fazer retry
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Processar até 2 workflows simultaneamente
    limiter: {
      max: 10, // Máximo 10 workflows
      duration: 60 * 1000, // Por minuto
    },
    settings: {
      stalledInterval: 60 * 1000, // 1 minuto
      maxStalledCount: 1,
    },
  }
);

// Event listeners para o worker
workflowWorker.on('completed', (job, result) => {
  console.log(`✅ Workflow worker - Job ${job.id} concluído:`, result);
});

workflowWorker.on('failed', (job, err) => {
  console.error(`❌ Workflow worker - Job ${job?.id} falhou:`, err.message);
  
  // Log específico para diferentes tipos de erro
  if (err.message.includes('timeout')) {
    console.error('💡 Workflow timeout - considere otimizar as ações');
  } else if (err.message.includes('database')) {
    console.error('💡 Erro de banco de dados - verifique conexão');
  }
});

workflowWorker.on('stalled', (jobId) => {
  console.warn(`⚠️  Workflow worker - Job ${jobId} travado`);
});

workflowWorker.on('progress', (job, progress) => {
  console.log(`⏳ Workflow worker - Job ${job.id} progresso: ${progress}%`);
});

// Função para iniciar o worker
export function startWorkflowWorker() {
  console.log('🚀 Workflow worker iniciado');
  return workflowWorker;
}

// Função para parar o worker
export async function stopWorkflowWorker() {
  await workflowWorker.close();
  console.log('🛑 Workflow worker parado');
}

// Auto-start em produção
if (process.env.NODE_ENV === 'production') {
  startWorkflowWorker();
}