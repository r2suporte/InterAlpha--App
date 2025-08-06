import { addJobToQueue, emailQueue, smsQueue } from '@/lib/integrations';
import { emailNotifications } from '@/services/email/email-notifications';
import { smsNotifications } from '@/services/sms/sms-notifications';
import prisma from '@/lib/prisma';

// Tipos para o sistema de workflows
export interface WorkflowTrigger {
  type: 'order_created' | 'order_status_changed' | 'payment_received' | 'payment_overdue' | 'scheduled';
  entityId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'assign_technician' | 'update_status' | 'create_task' | 'delay' | 'webhook';
  config: Record<string, any>;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: WorkflowTrigger['type'];
    conditions?: WorkflowCondition[];
  };
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private rules: Map<string, WorkflowRule> = new Map();

  private constructor() {
    this.loadDefaultRules();
  }

  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  // Carregar regras padrão do sistema
  private loadDefaultRules() {
    const defaultRules: WorkflowRule[] = [
      {
        id: 'auto-assign-technician',
        name: 'Atribuir Técnico Automaticamente',
        description: 'Atribui automaticamente um técnico disponível quando uma ordem é criada',
        trigger: {
          type: 'order_created',
          conditions: [
            { field: 'prioridade', operator: 'in', value: ['ALTA', 'URGENTE'] }
          ]
        },
        actions: [
          {
            type: 'assign_technician',
            config: {
              strategy: 'least_busy',
              notifyClient: true
            }
          }
        ],
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'payment-overdue-reminder',
        name: 'Lembrete de Pagamento em Atraso',
        description: 'Envia lembretes automáticos para pagamentos em atraso',
        trigger: {
          type: 'payment_overdue',
          conditions: [
            { field: 'daysOverdue', operator: 'in', value: [3, 7, 15] }
          ]
        },
        actions: [
          {
            type: 'send_email',
            config: {
              template: 'payment-overdue',
              priority: 'high'
            }
          },
          {
            type: 'send_sms',
            config: {
              template: 'payment-overdue'
            }
          }
        ],
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'order-completion-followup',
        name: 'Follow-up de Ordem Concluída',
        description: 'Agenda follow-up automático após conclusão da ordem',
        trigger: {
          type: 'order_status_changed',
          conditions: [
            { field: 'newStatus', operator: 'equals', value: 'CONCLUIDA' }
          ]
        },
        actions: [
          {
            type: 'delay',
            config: {
              duration: 24 * 60 * 60 * 1000 // 24 horas
            }
          },
          {
            type: 'send_email',
            config: {
              template: 'satisfaction-survey',
              subject: 'Como foi nosso atendimento?'
            }
          }
        ],
        isActive: true,
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'urgent-order-escalation',
        name: 'Escalação de Ordens Urgentes',
        description: 'Escalação automática para ordens urgentes não atendidas',
        trigger: {
          type: 'scheduled',
          conditions: [
            { field: 'status', operator: 'equals', value: 'PENDENTE' },
            { field: 'prioridade', operator: 'equals', value: 'URGENTE' },
            { field: 'hoursWaiting', operator: 'greater_than', value: 2 }
          ]
        },
        actions: [
          {
            type: 'update_status',
            config: {
              newStatus: 'EM_ANDAMENTO',
              reason: 'Escalação automática por urgência'
            }
          },
          {
            type: 'assign_technician',
            config: {
              strategy: 'senior_available',
              notifyClient: true
            }
          }
        ],
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    console.log(`✅ ${defaultRules.length} regras de workflow carregadas`);
  }

  // Executar workflows baseados em trigger
  async executeWorkflows(trigger: WorkflowTrigger): Promise<void> {
    console.log(`🔄 Executando workflows para trigger: ${trigger.type}`);

    try {
      // Buscar regras ativas que correspondem ao trigger
      const matchingRules = Array.from(this.rules.values())
        .filter(rule => rule.isActive && rule.trigger.type === trigger.type)
        .sort((a, b) => a.priority - b.priority); // Ordenar por prioridade

      for (const rule of matchingRules) {
        try {
          // Verificar condições
          if (await this.evaluateConditions(rule.trigger.conditions || [], trigger)) {
            console.log(`✅ Executando regra: ${rule.name}`);
            await this.executeActions(rule.actions, trigger);
            
            // Log da execução
            await this.logWorkflowExecution(rule.id, trigger, 'SUCCESS');
          }
        } catch (error) {
          console.error(`❌ Erro ao executar regra ${rule.name}:`, error);
          await this.logWorkflowExecution(rule.id, trigger, 'FAILED', error.message);
        }
      }
    } catch (error) {
      console.error('❌ Erro geral na execução de workflows:', error);
    }
  }

  // Avaliar condições de uma regra
  private async evaluateConditions(conditions: WorkflowCondition[], trigger: WorkflowTrigger): Promise<boolean> {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(trigger.data, condition.field);
      
      if (!this.evaluateCondition(fieldValue, condition)) {
        return false;
      }
    }

    return true;
  }

  // Avaliar uma condição específica
  private evaluateCondition(fieldValue: any, condition: WorkflowCondition): boolean {
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  }

  // Obter valor de um campo do trigger data
  private getFieldValue(data: Record<string, any>, field: string): any {
    const keys = field.split('.');
    let value = data;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value;
  }

  // Executar ações de uma regra
  private async executeActions(actions: WorkflowAction[], trigger: WorkflowTrigger): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, trigger);
      } catch (error) {
        console.error(`❌ Erro ao executar ação ${action.type}:`, error);
        // Continuar com as próximas ações mesmo se uma falhar
      }
    }
  }

  // Executar uma ação específica
  private async executeAction(action: WorkflowAction, trigger: WorkflowTrigger): Promise<void> {
    const { type, config } = action;

    switch (type) {
      case 'send_email':
        await this.executeSendEmailAction(config, trigger);
        break;
      case 'send_sms':
        await this.executeSendSMSAction(config, trigger);
        break;
      case 'assign_technician':
        await this.executeAssignTechnicianAction(config, trigger);
        break;
      case 'update_status':
        await this.executeUpdateStatusAction(config, trigger);
        break;
      case 'create_task':
        await this.executeCreateTaskAction(config, trigger);
        break;
      case 'delay':
        await this.executeDelayAction(config, trigger);
        break;
      case 'webhook':
        await this.executeWebhookAction(config, trigger);
        break;
      default:
        console.warn(`⚠️  Tipo de ação desconhecido: ${type}`);
    }
  }

  // Implementações das ações específicas
  private async executeSendEmailAction(config: any, trigger: WorkflowTrigger): Promise<void> {
    const { template, subject, priority } = config;
    
    // Buscar dados do cliente se necessário
    const clientData = await this.getClientData(trigger.entityId, trigger.type);
    if (!clientData?.email) return;

    const emailData = {
      to: clientData.email,
      subject: subject || `Notificação - InterAlpha`,
      template: template || 'custom',
      data: {
        ...trigger.data,
        clientName: clientData.nome,
      },
    };

    await addJobToQueue(emailQueue, 'workflow-email', emailData, {
      priority: priority === 'high' ? 1 : 5,
    });
  }

  private async executeSendSMSAction(config: any, trigger: WorkflowTrigger): Promise<void> {
    const { template } = config;
    
    const clientData = await this.getClientData(trigger.entityId, trigger.type);
    if (!clientData?.telefone) return;

    await smsNotifications.sendCustomSMS(
      clientData.telefone,
      `InterAlpha: ${trigger.data.message || 'Notificação automática do sistema'}`
    );
  }

  private async executeAssignTechnicianAction(config: any, trigger: WorkflowTrigger): Promise<void> {
    const { strategy, notifyClient } = config;
    
    // Lógica simplificada - em produção seria mais complexa
    const technician = await this.findAvailableTechnician(strategy);
    if (!technician) return;

    await prisma.ordemServico.update({
      where: { id: trigger.entityId },
      data: {
        // Assumindo que existe um campo técnico na ordem
        // tecnicoId: technician.id,
        status: 'EM_ANDAMENTO',
      },
    });

    if (notifyClient) {
      const clientData = await this.getClientData(trigger.entityId, trigger.type);
      if (clientData?.email) {
        await emailNotifications.sendTechnicianAssigned({
          clientName: clientData.nome,
          clientEmail: clientData.email,
          orderNumber: trigger.entityId,
          serviceName: trigger.data.titulo || 'Serviço',
          technicianName: technician.nome,
          technicianPhone: technician.telefone,
        });
      }
    }
  }

  private async executeUpdateStatusAction(config: any, trigger: WorkflowTrigger): Promise<void> {
    const { newStatus, reason } = config;
    
    await prisma.ordemServico.update({
      where: { id: trigger.entityId },
      data: {
        status: newStatus,
        // observacoes: reason, // Se existir campo de observações
      },
    });
  }

  private async executeCreateTaskAction(config: any, trigger: WorkflowTrigger): Promise<void> {
    const { title, description, assignTo } = config;
    
    // Implementar criação de tarefa
    console.log(`📋 Criando tarefa: ${title} para ${assignTo}`);
  }

  private async executeDelayAction(config: any, trigger: WorkflowTrigger): Promise<void> {
    const { duration } = config;
    
    // Implementar delay usando setTimeout ou agenda de jobs
    console.log(`⏰ Agendando ação com delay de ${duration}ms`);
  }

  private async executeWebhookAction(config: any, trigger: WorkflowTrigger): Promise<void> {
    const { url, method = 'POST', headers = {} } = config;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          trigger: trigger.type,
          entityId: trigger.entityId,
          data: trigger.data,
          timestamp: trigger.timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro no webhook:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  private async getClientData(entityId: string, triggerType: string): Promise<any> {
    try {
      if (triggerType.startsWith('order_')) {
        const ordem = await prisma.ordemServico.findUnique({
          where: { id: entityId },
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
        return ordem?.cliente;
      }
      
      if (triggerType.startsWith('payment_')) {
        const pagamento = await prisma.pagamento.findUnique({
          where: { id: entityId },
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
        return pagamento?.cliente;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do cliente:', error);
      return null;
    }
  }

  private async findAvailableTechnician(strategy: string): Promise<any> {
    // Implementação simplificada - retorna um técnico fictício
    return {
      id: 'tech-001',
      nome: 'João Técnico',
      telefone: '+5511999999999',
      email: 'joao@interalpha.com',
    };
  }

  private async logWorkflowExecution(
    ruleId: string,
    trigger: WorkflowTrigger,
    status: 'SUCCESS' | 'FAILED',
    errorMessage?: string
  ): Promise<void> {
    try {
      // Em produção, salvar no banco de dados
      console.log(`📊 Workflow Log: ${ruleId} - ${status}`, {
        trigger: trigger.type,
        entityId: trigger.entityId,
        timestamp: trigger.timestamp,
        error: errorMessage,
      });
    } catch (error) {
      console.error('❌ Erro ao salvar log de workflow:', error);
    }
  }

  // Métodos públicos para gerenciar regras
  addRule(rule: WorkflowRule): void {
    this.rules.set(rule.id, rule);
    console.log(`✅ Regra adicionada: ${rule.name}`);
  }

  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      console.log(`🗑️  Regra removida: ${ruleId}`);
    }
    return removed;
  }

  updateRule(ruleId: string, updates: Partial<WorkflowRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates, updatedAt: new Date() });
      console.log(`✏️  Regra atualizada: ${rule.name}`);
      return true;
    }
    return false;
  }

  getRules(): WorkflowRule[] {
    return Array.from(this.rules.values());
  }

  getRule(ruleId: string): WorkflowRule | undefined {
    return this.rules.get(ruleId);
  }

  // Ativar/desativar regras
  toggleRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.isActive = !rule.isActive;
      rule.updatedAt = new Date();
      console.log(`🔄 Regra ${rule.isActive ? 'ativada' : 'desativada'}: ${rule.name}`);
      return true;
    }
    return false;
  }
}

// Exportar instância singleton
export const workflowEngine = WorkflowEngine.getInstance();