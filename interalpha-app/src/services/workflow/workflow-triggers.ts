import { workflowEngine, WorkflowTrigger } from './workflow-engine';

// Classe para gerenciar triggers de workflow
export class WorkflowTriggers {
  
  // Trigger para ordem criada
  static async onOrderCreated(orderData: {
    id: string;
    titulo: string;
    status: string;
    prioridade: string;
    clienteId: string;
    valor?: number;
    createdAt: Date;
  }): Promise<void> {
    const trigger: WorkflowTrigger = {
      type: 'order_created',
      entityId: orderData.id,
      data: {
        titulo: orderData.titulo,
        status: orderData.status,
        prioridade: orderData.prioridade,
        clienteId: orderData.clienteId,
        valor: orderData.valor,
      },
      timestamp: orderData.createdAt,
    };

    await workflowEngine.executeWorkflows(trigger);
  }

  // Trigger para mudança de status da ordem
  static async onOrderStatusChanged(orderData: {
    id: string;
    titulo: string;
    previousStatus: string;
    newStatus: string;
    prioridade: string;
    clienteId: string;
    updatedAt: Date;
  }): Promise<void> {
    const trigger: WorkflowTrigger = {
      type: 'order_status_changed',
      entityId: orderData.id,
      data: {
        titulo: orderData.titulo,
        previousStatus: orderData.previousStatus,
        newStatus: orderData.newStatus,
        prioridade: orderData.prioridade,
        clienteId: orderData.clienteId,
      },
      timestamp: orderData.updatedAt,
    };

    await workflowEngine.executeWorkflows(trigger);
  }

  // Trigger para pagamento recebido
  static async onPaymentReceived(paymentData: {
    id: string;
    amount: number;
    method: string;
    clienteId: string;
    ordemServicoId?: string;
    paidAt: Date;
  }): Promise<void> {
    const trigger: WorkflowTrigger = {
      type: 'payment_received',
      entityId: paymentData.id,
      data: {
        amount: paymentData.amount,
        method: paymentData.method,
        clienteId: paymentData.clienteId,
        ordemServicoId: paymentData.ordemServicoId,
      },
      timestamp: paymentData.paidAt,
    };

    await workflowEngine.executeWorkflows(trigger);
  }

  // Trigger para pagamento em atraso
  static async onPaymentOverdue(paymentData: {
    id: string;
    amount: number;
    dueDate: Date;
    daysOverdue: number;
    clienteId: string;
    ordemServicoId?: string;
  }): Promise<void> {
    const trigger: WorkflowTrigger = {
      type: 'payment_overdue',
      entityId: paymentData.id,
      data: {
        amount: paymentData.amount,
        dueDate: paymentData.dueDate,
        daysOverdue: paymentData.daysOverdue,
        clienteId: paymentData.clienteId,
        ordemServicoId: paymentData.ordemServicoId,
      },
      timestamp: new Date(),
    };

    await workflowEngine.executeWorkflows(trigger);
  }

  // Trigger agendado (para verificações periódicas)
  static async onScheduledCheck(): Promise<void> {
    try {
      // Verificar ordens urgentes pendentes há muito tempo
      await this.checkUrgentOrdersOverdue();
      
      // Verificar pagamentos em atraso
      await this.checkOverduePayments();
      
      // Outras verificações agendadas...
    } catch (error) {
      console.error('❌ Erro na verificação agendada:', error);
    }
  }

  // Verificar ordens urgentes que estão pendentes há muito tempo
  private static async checkUrgentOrdersOverdue(): Promise<void> {
    try {
      const prisma = (await import('@/lib/prisma')).default;
      
      // Buscar ordens urgentes pendentes há mais de 2 horas
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const urgentOrders = await prisma.ordemServico.findMany({
        where: {
          status: 'PENDENTE',
          prioridade: 'URGENTE',
          createdAt: {
            lt: twoHoursAgo,
          },
        },
        include: {
          cliente: {
            select: {
              nome: true,
              email: true,
              telefone: true,
            },
          },
        },
      });

      for (const order of urgentOrders) {
        const hoursWaiting = Math.floor(
          (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60)
        );

        const trigger: WorkflowTrigger = {
          type: 'scheduled',
          entityId: order.id,
          data: {
            titulo: order.titulo,
            status: order.status,
            prioridade: order.prioridade,
            clienteId: order.clienteId,
            hoursWaiting,
          },
          timestamp: new Date(),
        };

        await workflowEngine.executeWorkflows(trigger);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar ordens urgentes:', error);
    }
  }

  // Verificar pagamentos em atraso
  private static async checkOverduePayments(): Promise<void> {
    try {
      const prisma = (await import('@/lib/prisma')).default;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overduePayments = await prisma.pagamento.findMany({
        where: {
          status: 'PENDENTE',
          dataVencimento: {
            lt: today,
          },
        },
        include: {
          cliente: {
            select: {
              nome: true,
              email: true,
              telefone: true,
            },
          },
          ordemServico: {
            select: {
              id: true,
              titulo: true,
            },
          },
        },
      });

      for (const payment of overduePayments) {
        const daysOverdue = Math.floor(
          (today.getTime() - payment.dataVencimento.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Enviar lembretes apenas em dias específicos (3, 7, 15)
        if ([3, 7, 15].includes(daysOverdue)) {
          await this.onPaymentOverdue({
            id: payment.id,
            amount: payment.valor,
            dueDate: payment.dataVencimento,
            daysOverdue,
            clienteId: payment.clienteId,
            ordemServicoId: payment.ordemServicoId || undefined,
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pagamentos em atraso:', error);
    }
  }

  // Método para testar workflows
  static async testWorkflow(triggerType: WorkflowTrigger['type'], testData: Record<string, any>): Promise<void> {
    const trigger: WorkflowTrigger = {
      type: triggerType,
      entityId: testData.entityId || 'test-entity',
      data: testData,
      timestamp: new Date(),
    };

    console.log(`🧪 Testando workflow: ${triggerType}`);
    await workflowEngine.executeWorkflows(trigger);
  }

  // Método para executar verificações agendadas (chamado por cron job)
  static async runScheduledChecks(): Promise<void> {
    console.log('⏰ Executando verificações agendadas de workflows...');
    await this.onScheduledCheck();
  }
}

// Exportar para uso em outras partes do sistema
export const workflowTriggers = WorkflowTriggers;