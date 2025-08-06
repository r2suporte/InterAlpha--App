// Exportações principais do serviço de workflow

// Motor de workflows
export { 
  WorkflowEngine, 
  workflowEngine,
  type WorkflowTrigger,
  type WorkflowCondition,
  type WorkflowAction,
  type WorkflowRule
} from './workflow-engine';

// Triggers de workflow
export { WorkflowTriggers, workflowTriggers } from './workflow-triggers';

// Worker
export { workflowWorker, startWorkflowWorker, stopWorkflowWorker } from '../workers/workflow-worker';

// Tipos específicos para workflows
export interface WorkflowExecutionResult {
  success: boolean;
  triggerType: string;
  entityId: string;
  processedAt: string;
  ruleId?: string;
  error?: string;
}