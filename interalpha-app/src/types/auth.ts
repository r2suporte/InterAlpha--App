// Tipos para o sistema de autenticação multi-roles

export enum UserType {
  CLIENT = 'client',
  EMPLOYEE = 'employee'
}

export enum EmployeeRole {
  ATENDENTE = 'atendente',
  TECNICO = 'tecnico',
  SUPERVISOR_TECNICO = 'supervisor_tecnico',
  GERENTE_ADM = 'gerente_adm',
  GERENTE_FINANCEIRO = 'gerente_financeiro'
}

export interface Permission {
  resource: string
  action: string
  conditions?: {
    own_only?: boolean
    max_value?: number
    departments?: string[]
  }
}

export interface ClientAccessKey {
  key: string
  clientId: string
  expiresAt: Date
  permissions: ClientPermissions
  metadata: {
    ipAddress: string
    userAgent: string
    generatedAt: Date
  }
}

export interface ClientPermissions {
  canViewOrders: boolean
  canViewPayments: boolean
  canViewDocuments: boolean
  canChat: boolean
}

export interface EmployeeSession {
  userId: string
  role: EmployeeRole
  permissions: Permission[]
  expiresAt: Date
  metadata: SessionMetadata
}

export interface SessionMetadata {
  ipAddress: string
  userAgent: string
  loginAt: Date
  lastActivity: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: EmployeeRole
  permissions: Permission[]
  isActive: boolean
  createdAt: Date
  createdBy: string
  lastLogin?: Date
  metadata: EmployeeMetadata
}

export interface EmployeeMetadata {
  department?: string
  expirationDate?: Date
  notificationPreferences: NotificationPreferences
}

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
  channels: string[]
}

export interface DashboardConfig {
  modules: string[]
  widgets: string[]
}

export interface RoleDefinition {
  role: EmployeeRole
  permissions: Permission[]
  hierarchy_level: number
  can_manage_roles: EmployeeRole[]
  dashboard_config: DashboardConfig
}

export interface AuthError {
  code: string
  message: string
  metadata?: any
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  INVALID_CLIENT_KEY = 'INVALID_CLIENT_KEY',
  KEY_EXPIRED = 'KEY_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}