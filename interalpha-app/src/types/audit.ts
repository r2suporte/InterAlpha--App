export interface AuditEntry {
  id: string
  userId: string
  userType: 'client' | 'employee'
  action: string
  resource: string
  resourceId?: string
  oldData?: any
  newData?: any
  result: 'success' | 'failure'
  reason?: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  sessionId?: string
  metadata?: any
}

export interface AccessLogEntry {
  id: string
  userId: string
  userType: 'client' | 'employee'
  action: 'login' | 'logout' | 'access_denied' | 'session_expired'
  ipAddress: string
  userAgent: string
  location?: string
  success: boolean
  failureReason?: string
  timestamp: Date
  sessionDuration?: number
  metadata?: any
}

export interface SecurityEventEntry {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  userId?: string
  ipAddress: string
  userAgent?: string
  description: string
  details: any
  timestamp: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
  actions: SecurityAction[]
}

export enum SecurityEventType {
  SUSPICIOUS_LOGIN = 'suspicious_login',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  PRIVILEGE_ESCALATION_ATTEMPT = 'privilege_escalation_attempt',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  UNAUTHORIZED_API_ACCESS = 'unauthorized_api_access',
  MALICIOUS_REQUEST = 'malicious_request',
  ACCOUNT_TAKEOVER_ATTEMPT = 'account_takeover_attempt',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityAction {
  action: string
  timestamp: Date
  automated: boolean
  details?: any
}

export interface AuditFilters {
  userId?: string | null
  userType?: 'client' | 'employee' | null
  action?: string | null
  resource?: string | null
  result?: 'success' | 'failure' | null
  startDate?: Date
  endDate?: Date
  ipAddress?: string | null
  page?: number
  limit?: number
}

export interface AccessLogFilters {
  userId?: string | null
  userType?: 'client' | 'employee' | null
  action?: string | null
  success?: boolean
  startDate?: Date
  endDate?: Date
  ipAddress?: string | null
  page?: number
  limit?: number
}

export interface SecurityEventFilters {
  type?: SecurityEventType | null
  severity?: SecuritySeverity | null
  userId?: string | null
  resolved?: boolean
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

export interface AuditReport {
  id: string
  title: string
  description: string
  generatedBy: string
  generatedAt: Date
  period: {
    startDate: Date
    endDate: Date
  }
  filters: any
  summary: AuditSummary
  data: any[]
  format: 'json' | 'csv' | 'pdf'
  downloadUrl?: string
}

export interface AuditSummary {
  totalEntries: number
  successfulActions: number
  failedActions: number
  uniqueUsers: number
  topActions: Array<{ action: string; count: number }>
  topResources: Array<{ resource: string; count: number }>
  securityEvents: number
  criticalEvents: number
}

export interface ComplianceReport {
  id: string
  type: ComplianceType
  period: {
    startDate: Date
    endDate: Date
  }
  generatedBy: string
  generatedAt: Date
  status: 'compliant' | 'non_compliant' | 'partial'
  findings: ComplianceFinding[]
  recommendations: string[]
  downloadUrl?: string
}

export enum ComplianceType {
  LGPD = 'lgpd',
  SOX = 'sox',
  ISO27001 = 'iso27001',
  GDPR = 'gdpr'
}

export interface ComplianceFinding {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  description: string
  evidence: any[]
  recommendation: string
  status: 'open' | 'in_progress' | 'resolved'
}

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: AlertCondition[]
  actions: AlertAction[]
  cooldownMinutes: number
  createdBy: string
  createdAt: Date
  lastTriggered?: Date
  triggerCount: number
}

export interface AlertCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range'
  value: any
  timeWindow?: number // minutes
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'block_user' | 'require_2fa'
  config: any
}

export interface DataRetentionPolicy {
  id: string
  name: string
  description: string
  dataType: 'audit_logs' | 'access_logs' | 'security_events'
  retentionDays: number
  archiveAfterDays?: number
  deleteAfterDays: number
  enabled: boolean
  createdBy: string
  createdAt: Date
  lastExecuted?: Date
}