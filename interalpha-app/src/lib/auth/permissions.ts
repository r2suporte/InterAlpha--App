/**
 * Sistema de Permissões e Roles para Funcionários
 */

export enum EmployeeRole {
  ADMIN = 'admin',
  GERENTE_ADM = 'gerente-adm',
  GERENTE_FINANCEIRO = 'gerente-financeiro',
  SUPERVISOR_TECNICO = 'supervisor-tecnico',
  TECNICO = 'tecnico',
  ATENDENTE = 'atendente'
}

export enum Permission {
  // Funcionários
  MANAGE_EMPLOYEES = 'manage_employees',
  VIEW_EMPLOYEES = 'view_employees',
  
  // Clientes
  MANAGE_CLIENTS = 'manage_clients',
  VIEW_CLIENTS = 'view_clients',
  
  // Ordens de Serviço
  MANAGE_ORDERS = 'manage_orders',
  VIEW_ORDERS = 'view_orders',
  ASSIGN_ORDERS = 'assign_orders',
  
  // Produtos
  MANAGE_PRODUCTS = 'manage_products',
  VIEW_PRODUCTS = 'view_products',
  
  // Financeiro
  MANAGE_PAYMENTS = 'manage_payments',
  VIEW_PAYMENTS = 'view_payments',
  APPROVE_PAYMENTS = 'approve_payments',
  
  // Relatórios
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Sistema
  MANAGE_SYSTEM = 'manage_system',
  VIEW_AUDIT = 'view_audit'
}

export const ROLE_PERMISSIONS: Record<EmployeeRole, Permission[]> = {
  [EmployeeRole.ADMIN]: [
    // Acesso total
    Permission.MANAGE_EMPLOYEES,
    Permission.VIEW_EMPLOYEES,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.ASSIGN_ORDERS,
    Permission.MANAGE_PRODUCTS,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_PAYMENTS,
    Permission.APPROVE_PAYMENTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_AUDIT
  ],
  
  [EmployeeRole.GERENTE_ADM]: [
    Permission.VIEW_EMPLOYEES,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.ASSIGN_ORDERS,
    Permission.MANAGE_PRODUCTS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_AUDIT
  ],
  
  [EmployeeRole.GERENTE_FINANCEIRO]: [
    Permission.VIEW_CLIENTS,
    Permission.VIEW_ORDERS,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_PAYMENTS,
    Permission.APPROVE_PAYMENTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS
  ],
  
  [EmployeeRole.SUPERVISOR_TECNICO]: [
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.ASSIGN_ORDERS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_REPORTS
  ],
  
  [EmployeeRole.TECNICO]: [
    Permission.VIEW_CLIENTS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_PAYMENTS
  ],
  
  [EmployeeRole.ATENDENTE]: [
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_PAYMENTS
  ]
}

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  [EmployeeRole.ADMIN]: 'Administrador',
  [EmployeeRole.GERENTE_ADM]: 'Gerente Administrativo',
  [EmployeeRole.GERENTE_FINANCEIRO]: 'Gerente Financeiro',
  [EmployeeRole.SUPERVISOR_TECNICO]: 'Supervisor Técnico',
  [EmployeeRole.TECNICO]: 'Técnico',
  [EmployeeRole.ATENDENTE]: 'Atendente'
}

export const ROLE_DESCRIPTIONS: Record<EmployeeRole, string> = {
  [EmployeeRole.ADMIN]: 'Acesso total ao sistema',
  [EmployeeRole.GERENTE_ADM]: 'Gerencia operações administrativas',
  [EmployeeRole.GERENTE_FINANCEIRO]: 'Gerencia pagamentos e finanças',
  [EmployeeRole.SUPERVISOR_TECNICO]: 'Supervisiona equipe técnica',
  [EmployeeRole.TECNICO]: 'Executa serviços técnicos',
  [EmployeeRole.ATENDENTE]: 'Atendimento ao cliente'
}

/**
 * Verifica se um role tem uma permissão específica
 */
export function hasPermission(role: EmployeeRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

/**
 * Verifica se um role tem acesso a uma rota específica
 */
export function hasRouteAccess(role: EmployeeRole, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/admin/funcionarios': [Permission.MANAGE_EMPLOYEES, Permission.VIEW_EMPLOYEES],
    '/clientes': [Permission.MANAGE_CLIENTS, Permission.VIEW_CLIENTS],
    '/ordens-servico': [Permission.MANAGE_ORDERS, Permission.VIEW_ORDERS],
    '/produtos': [Permission.MANAGE_PRODUCTS, Permission.VIEW_PRODUCTS],
    '/pagamentos': [Permission.MANAGE_PAYMENTS, Permission.VIEW_PAYMENTS],
    '/relatorios': [Permission.VIEW_REPORTS],
    '/auditoria': [Permission.VIEW_AUDIT],
    '/dashboard': [] // Todos têm acesso ao dashboard
  }

  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true // Rota pública ou dashboard
  }

  return requiredPermissions.some(permission => hasPermission(role, permission))
}

/**
 * Obtém todas as permissões de um role
 */
export function getRolePermissions(role: EmployeeRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Verifica se um role pode acessar funcionalidades administrativas
 */
export function isAdminRole(role: EmployeeRole): boolean {
  return [EmployeeRole.ADMIN, EmployeeRole.GERENTE_ADM].includes(role)
}

/**
 * Verifica se um role pode gerenciar funcionários
 */
export function canManageEmployees(role: EmployeeRole): boolean {
  return hasPermission(role, Permission.MANAGE_EMPLOYEES)
}

/**
 * Verifica se um role pode aprovar pagamentos
 */
export function canApprovePayments(role: EmployeeRole): boolean {
  return hasPermission(role, Permission.APPROVE_PAYMENTS)
}