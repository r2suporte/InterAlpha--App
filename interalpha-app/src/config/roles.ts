import { EmployeeRole, RoleDefinition, Permission } from '@/types/auth'

// Configurações de permissões por role
export const ROLE_PERMISSIONS: Record<EmployeeRole, RoleDefinition> = {
  [EmployeeRole.ATENDENTE]: {
    role: EmployeeRole.ATENDENTE,
    hierarchy_level: 1,
    can_manage_roles: [],
    permissions: [
      { resource: 'clientes', action: 'read' },
      { resource: 'clientes', action: 'write' },
      { resource: 'ordens', action: 'read' },
      { resource: 'ordens', action: 'write', conditions: { own_only: true } },
      { resource: 'chat', action: 'read' },
      { resource: 'chat', action: 'write' }
    ],
    dashboard_config: {
      modules: ['clientes', 'ordens', 'chat'],
      widgets: ['pending_orders', 'client_messages', 'daily_tasks']
    }
  },
  
  [EmployeeRole.TECNICO]: {
    role: EmployeeRole.TECNICO,
    hierarchy_level: 2,
    can_manage_roles: [],
    permissions: [
      { resource: 'ordens', action: 'read', conditions: { own_only: true } },
      { resource: 'ordens', action: 'write', conditions: { own_only: true } },
      { resource: 'relatorios_tecnicos', action: 'read' },
      { resource: 'relatorios_tecnicos', action: 'write' },
      { resource: 'historico_servicos', action: 'read' },
      { resource: 'clientes', action: 'read', conditions: { own_only: true } }
    ],
    dashboard_config: {
      modules: ['ordens', 'relatorios', 'historico'],
      widgets: ['assigned_orders', 'completed_today', 'pending_reports', 'tools_status']
    }
  },
  
  [EmployeeRole.SUPERVISOR_TECNICO]: {
    role: EmployeeRole.SUPERVISOR_TECNICO,
    hierarchy_level: 3,
    can_manage_roles: [EmployeeRole.TECNICO],
    permissions: [
      // Herda permissões de TECNICO (sem own_only) +
      { resource: 'ordens', action: 'read' },
      { resource: 'ordens', action: 'write' },
      { resource: 'ordens', action: 'assign' },
      { resource: 'relatorios_tecnicos', action: 'read' },
      { resource: 'relatorios_tecnicos', action: 'write' },
      { resource: 'equipe_tecnica', action: 'read' },
      { resource: 'equipe_tecnica', action: 'write' },
      { resource: 'relatorios_performance', action: 'read' },
      { resource: 'clientes', action: 'read' }
    ],
    dashboard_config: {
      modules: ['ordens', 'equipe', 'relatorios', 'performance'],
      widgets: ['team_orders', 'team_performance', 'resource_allocation', 'efficiency_metrics']
    }
  },
  
  [EmployeeRole.GERENTE_ADM]: {
    role: EmployeeRole.GERENTE_ADM,
    hierarchy_level: 4,
    can_manage_roles: [EmployeeRole.ATENDENTE, EmployeeRole.TECNICO, EmployeeRole.SUPERVISOR_TECNICO],
    permissions: [
      // Acesso total exceto área financeira
      { resource: 'clientes', action: 'read' },
      { resource: 'clientes', action: 'write' },
      { resource: 'clientes', action: 'delete' },
      { resource: 'ordens', action: 'read' },
      { resource: 'ordens', action: 'write' },
      { resource: 'ordens', action: 'delete' },
      { resource: 'usuarios', action: 'read' },
      { resource: 'usuarios', action: 'write' },
      { resource: 'usuarios', action: 'create' },
      { resource: 'configuracoes', action: 'read' },
      { resource: 'configuracoes', action: 'write' },
      { resource: 'integracoes', action: 'read' },
      { resource: 'integracoes', action: 'write' },
      { resource: 'relatorios_operacionais', action: 'read' },
      { resource: 'auditoria', action: 'read' }
    ],
    dashboard_config: {
      modules: ['usuarios', 'configuracoes', 'relatorios', 'integracoes', 'auditoria'],
      widgets: ['system_health', 'user_activity', 'operational_metrics', 'integration_status']
    }
  },
  
  [EmployeeRole.GERENTE_FINANCEIRO]: {
    role: EmployeeRole.GERENTE_FINANCEIRO,
    hierarchy_level: 5,
    can_manage_roles: [EmployeeRole.GERENTE_ADM], // Pode criar outros gerentes
    permissions: [
      // Acesso total incluindo área financeira
      { resource: '*', action: 'read' },
      { resource: '*', action: 'write' },
      { resource: 'pagamentos', action: 'approve' },
      { resource: 'pagamentos', action: 'reject' },
      { resource: 'relatorios_financeiros', action: 'read' },
      { resource: 'relatorios_financeiros', action: 'write' },
      { resource: 'relatorios_financeiros', action: 'export' },
      { resource: 'usuarios_financeiros', action: 'create' },
      { resource: 'configuracoes_financeiras', action: 'write' },
      { resource: 'auditoria_financeira', action: 'read' }
    ],
    dashboard_config: {
      modules: ['financeiro', 'pagamentos', 'relatorios', 'usuarios', 'auditoria'],
      widgets: ['pending_approvals', 'financial_summary', 'cash_flow', 'revenue_metrics']
    }
  }
}

// Função para obter permissões de um role
export function getRolePermissions(role: EmployeeRole): Permission[] {
  return ROLE_PERMISSIONS[role]?.permissions || []
}

// Função para verificar se um role pode gerenciar outro
export function canManageRole(managerRole: EmployeeRole, targetRole: EmployeeRole): boolean {
  const managerConfig = ROLE_PERMISSIONS[managerRole]
  return managerConfig?.can_manage_roles.includes(targetRole) || false
}

// Função para obter configuração do dashboard por role
export function getDashboardConfig(role: EmployeeRole) {
  return ROLE_PERMISSIONS[role]?.dashboard_config || { modules: [], widgets: [] }
}

// Função para verificar hierarquia
export function getHierarchyLevel(role: EmployeeRole): number {
  return ROLE_PERMISSIONS[role]?.hierarchy_level || 0
}

// Função para verificar se um role tem permissão específica
export function hasPermission(
  role: EmployeeRole, 
  resource: string, 
  action: string,
  context?: any
): boolean {
  const permissions = getRolePermissions(role)
  
  // Verificar permissão wildcard (*)
  const wildcardPermission = permissions.find(p => 
    p.resource === '*' && p.action === action
  )
  if (wildcardPermission) return true

  // Verificar permissão específica
  const specificPermission = permissions.find(p => 
    p.resource === resource && p.action === action
  )
  
  if (!specificPermission) return false

  // Verificar condições específicas
  if (specificPermission.conditions) {
    if (specificPermission.conditions.own_only && context?.ownerId !== context?.userId) {
      return false
    }
    
    if (specificPermission.conditions.max_value && context?.value > specificPermission.conditions.max_value) {
      return false
    }
    
    if (specificPermission.conditions.departments && 
        !specificPermission.conditions.departments.includes(context?.department)) {
      return false
    }
  }

  return true
}

// Lista de todos os recursos disponíveis
export const AVAILABLE_RESOURCES = [
  'clientes',
  'ordens',
  'pagamentos',
  'relatorios_tecnicos',
  'relatorios_operacionais',
  'relatorios_financeiros',
  'usuarios',
  'configuracoes',
  'integracoes',
  'auditoria',
  'chat',
  'equipe_tecnica',
  'historico_servicos'
]

// Lista de todas as ações disponíveis
export const AVAILABLE_ACTIONS = [
  'read',
  'write',
  'create',
  'delete',
  'approve',
  'reject',
  'assign',
  'export'
]