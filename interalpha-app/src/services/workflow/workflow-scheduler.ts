import { workflowTriggers } from './workflow-triggers';

// Classe para agendar execuções periódicas de workflows
export class WorkflowScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Iniciar agendamentos
  start(): void {
    console.log('⏰ Iniciando agendador de workflows...');

    // Verificações a cada 30 minutos
    this.scheduleInterval('scheduled-checks', 30 * 60 * 1000, async () => {
      await workflowTriggers.runScheduledChecks();
    });

    // Verificações de ordens urgentes a cada 15 minutos
    this.scheduleInterval('urgent-orders', 15 * 60 * 1000, async () => {
      console.log('🔍 Verificando ordens urgentes...');
      await workflowTriggers.onScheduledCheck();
    });

    console.log('✅ Agendador de workflows iniciado');
  }

  // Parar agendamentos
  stop(): void {
    console.log('🛑 Parando agendador de workflows...');
    
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`⏹️  Agendamento ${name} parado`);
    });
    
    this.intervals.clear();
    console.log('✅ Agendador de workflows parado');
  }

  // Agendar uma função para execução periódica
  private scheduleInterval(name: string, intervalMs: number, fn: () => Promise<void>): void {
    const interval = setInterval(async () => {
      try {
        await fn();
      } catch (error) {
        console.error(`❌ Erro na execução agendada ${name}:`, error);
      }
    }, intervalMs);

    this.intervals.set(name, interval);
    console.log(`📅 Agendamento ${name} configurado para cada ${intervalMs / 1000}s`);
  }

  // Agendar execução única com delay
  scheduleOnce(name: string, delayMs: number, fn: () => Promise<void>): void {
    const timeout = setTimeout(async () => {
      try {
        await fn();
        console.log(`✅ Execução única ${name} concluída`);
      } catch (error) {
        console.error(`❌ Erro na execução única ${name}:`, error);
      }
    }, delayMs);

    // Converter para NodeJS.Timeout para compatibilidade
    this.intervals.set(name, timeout as any);
    console.log(`⏰ Execução única ${name} agendada para ${delayMs / 1000}s`);
  }

  // Cancelar agendamento específico
  cancel(name: string): boolean {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
      console.log(`🚫 Agendamento ${name} cancelado`);
      return true;
    }
    return false;
  }

  // Listar agendamentos ativos
  listSchedules(): string[] {
    return Array.from(this.intervals.keys());
  }
}

// Singleton instance
let schedulerInstance: WorkflowScheduler | null = null;

export function getWorkflowScheduler(): WorkflowScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new WorkflowScheduler();
  }
  return schedulerInstance;
}

// Auto-start em produção
if (process.env.NODE_ENV === 'production') {
  const scheduler = getWorkflowScheduler();
  scheduler.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    scheduler.stop();
  });
  
  process.on('SIGINT', () => {
    scheduler.stop();
  });
}