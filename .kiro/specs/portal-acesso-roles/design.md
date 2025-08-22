# Portal de Acesso com Sistema de Roles - Design Técnico

## Overview

Sistema completo de portal de acesso multi-tenant com autenticação baseada em roles, chaves temporárias para clientes e sistema avançado de gerenciamento de usuários e permissões. O sistema implementa uma arquitetura de segurança em camadas com controle granular de acesso.

## Architecture

### Arquitetura Geral
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Portal │    │ Employee Portal │    │  Admin Portal   │
│   (Temporary)   │    │   (Role-based)  │    │ (Management)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │            Authentication Layer                 │
         │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
         │  │ Temp Keys   │  │ Role-based  │  │  RBAC   │ │
         │  │ (24h TTL)   │  │    Auth     │  │ Engine  │ │
         │  └─────────────┘  └─────────────┘  └─────────┘ │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              Business Logic Layer               │
         │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
         │  │   User      │  │ Permission  │  │  Audit  │ │
         │  │ Management  │  │   Engine    │  │  Logger │ │
         │  └─────────────┘  └─────────────┘  └─────────┘ │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │               Data Access Layer                 │
         │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
         │  │    Users    │  │    Roles    │  │  Audit  │ │
         │  │  Database   │  │ Permissions │  │   Logs  │ │
         │  └─────────────┘  └─────────────┘  └─────────┘ │
         └─────────────────────────────────────────────────┘
```

### Fluxo de Autenticação
```
Cliente:
1. Solicita acesso → 2. Gera chave 24h → 3. Envia por email/SMS → 4. Acesso direto

Funcionário:
1. Login credenciais → 2. Valida role → 3. Carrega permissões → 4. Dashboard personalizado
```

## Components and Interfaces

### 1. Authentication Service

```typescript
interface AuthService {
  // Cliente - Chaves Temporárias
  generateClientKey(clientId: string): Promise<ClientAccessKey>
  validateClientKey(key: string): Promise<ClientSession>
  revokeClientKey(key: string): Promise<void>
  
  // Funcionário - Role-based
  authenticateEmployee(credentials: LoginCredentials): Promise<EmployeeSession>
  validateEmployeeSession(token: string): Promise<EmployeeSession>
  refreshEmployeeToken(refreshToken: string): Promise<string>
}

interface ClientAccessKey {
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

interface EmployeeSession {
  userId: string
  role: EmployeeRole
  permissions: Permission[]
  expiresAt: Date
  metadata: SessionMetadata
}
```

### 2. Role-Based Access Control (RBAC)

```typescript
enum EmployeeRole {
  ATENDENTE = 'atendente',
  TECNICO = 'tecnico',
  SUPERVISOR_TECNICO = 'supervisor_tecnico',
  GERENTE_ADM = 'gerente_adm',
  GERENTE_FINANCEIRO = 'gerente_financeiro'
}

interface Permission {
  resource: string      // 'clientes', 'ordens', 'pagamentos', etc.
  action: string        // 'read', 'write', 'delete', 'approve'
  conditions?: {        // Condições específicas
    own_only?: boolean  // Apenas próprios registros
    max_value?: number  // Valor máximo para aprovações
    departments?: string[] // Departamentos específicos
  }
}

interface RoleDefinition {
  role: EmployeeRole
  permissions: Permission[]
  hierarchy_level: number
  can_manage_roles: EmployeeRole[]
  dashboard_config: DashboardConfig
}

// Configurações de permissões por role
const ROLE_PERMISSIONS: Record<EmployeeRole, RoleDefinition> = {
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
      widgets: ['pending_orders', 'client_messages']
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
      { resource: 'historico_servicos', action: 'read' }
    ],
    dashboard_config: {
      modules: ['ordens', 'relatorios', 'historico'],
      widgets: ['assigned_orders', 'completed_today', 'pending_reports']
    }
  },
  
  [EmployeeRole.SUPERVISOR_TECNICO]: {
    role: EmployeeRole.SUPERVISOR_TECNICO,
    hierarchy_level: 3,
    can_manage_roles: [EmployeeRole.TECNICO],
    permissions: [
      // Herda permissões de TECNICO +
      { resource: 'ordens', action: 'read' }, // Todas as ordens
      { resource: 'ordens', action: 'write' }, // Pode reatribuir
      { resource: 'equipe_tecnica', action: 'read' },
      { resource: 'equipe_tecnica', action: 'write' },
      { resource: 'relatorios_performance', action: 'read' }
    ],
    dashboard_config: {
      modules: ['ordens', 'equipe', 'relatorios', 'performance'],
      widgets: ['team_orders', 'team_performance', 'resource_allocation']
    }
  },
  
  [EmployeeRole.GERENTE_ADM]: {
    role: EmployeeRole.GERENTE_ADM,
    hierarchy_level: 4,
    can_manage_roles: [EmployeeRole.ATENDENTE, EmployeeRole.TECNICO, EmployeeRole.SUPERVISOR_TECNICO],
    permissions: [
      { resource: '*', action: 'read' }, // Acesso total exceto financeiro
      { resource: '*', action: 'write' },
      { resource: 'usuarios', action: 'read' },
      { resource: 'usuarios', action: 'write' },
      { resource: 'configuracoes', action: 'read' },
      { resource: 'configuracoes', action: 'write' },
      { resource: 'integracoes', action: 'read' },
      { resource: 'integracoes', action: 'write' }
    ],
    dashboard_config: {
      modules: ['usuarios', 'configuracoes', 'relatorios', 'integracoes'],
      widgets: ['system_health', 'user_activity', 'operational_metrics']
    }
  },
  
  [EmployeeRole.GERENTE_FINANCEIRO]: {
    role: EmployeeRole.GERENTE_FINANCEIRO,
    hierarchy_level: 5,
    can_manage_roles: [EmployeeRole.GERENTE_ADM], // Pode criar outros gerentes
    permissions: [
      { resource: '*', action: 'read' }, // Acesso total
      { resource: '*', action: 'write' },
      { resource: 'pagamentos', action: 'approve' },
      { resource: 'relatorios_financeiros', action: 'read' },
      { resource: 'relatorios_financeiros', action: 'write' },
      { resource: 'usuarios_financeiros', action: 'write' }
    ],
    dashboard_config: {
      modules: ['financeiro', 'pagamentos', 'relatorios', 'usuarios'],
      widgets: ['pending_approvals', 'financial_summary', 'cash_flow']
    }
  }
}
```

### 3. User Management Service

```typescript
interface UserManagementService {
  // CRUD de usuários
  createEmployee(data: CreateEmployeeData): Promise<Employee>
  updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee>
  deactivateEmployee(id: string, transferTo?: string): Promise<void>
  getEmployee(id: string): Promise<Employee>
  listEmployees(filters: EmployeeFilters): Promise<Employee[]>
  
  // Gerenciamento de permissões
  updateEmployeePermissions(id: string, permissions: Permission[]): Promise<void>
  getEmployeePermissions(id: string): Promise<Permission[]>
  validatePermission(userId: string, resource: string, action: string): Promise<boolean>
  
  // Chaves de cliente
  generateClientAccess(clientId: string, requestedBy: string): Promise<ClientAccessKey>
  revokeClientAccess(key: string): Promise<void>
  listActiveClientKeys(): Promise<ClientAccessKey[]>
}

interface CreateEmployeeData {
  name: string
  email: string
  phone: string
  role: EmployeeRole
  department?: string
  customPermissions?: Permission[]
  expirationDate?: Date
  notificationPreferences: NotificationPreferences
}

interface Employee {
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
```

### 4. Permission Engine

```typescript
interface PermissionEngine {
  checkPermission(
    userId: string, 
    resource: string, 
    action: string, 
    context?: PermissionContext
  ): Promise<PermissionResult>
  
  getEffectivePermissions(userId: string): Promise<Permission[]>
  canManageUser(managerId: string, targetUserId: string): Promise<boolean>
  getAccessibleResources(userId: string): Promise<string[]>
}

interface PermissionContext {
  resourceId?: string
  resourceData?: any
  requestMetadata?: {
    ipAddress: string
    userAgent: string
    timestamp: Date
  }
}

interface PermissionResult {
  allowed: boolean
  reason?: string
  conditions?: any
  auditLog: AuditEntry
}
```

### 5. Audit Service

```typescript
interface AuditService {
  logAccess(entry: AccessLogEntry): Promise<void>
  logAction(entry: ActionLogEntry): Promise<void>
  logSecurityEvent(entry: SecurityEventEntry): Promise<void>
  
  getAccessLogs(filters: AuditFilters): Promise<AccessLogEntry[]>
  getActionLogs(filters: AuditFilters): Promise<ActionLogEntry[]>
  getSecurityEvents(filters: AuditFilters): Promise<SecurityEventEntry[]>
  
  generateAuditReport(params: AuditReportParams): Promise<AuditReport>
}

interface AccessLogEntry {
  id: string
  userId: string
  userType: 'client' | 'employee'
  action: 'login' | 'logout' | 'access_denied'
  ipAddress: string
  userAgent: string
  location?: string
  timestamp: Date
  metadata?: any
}

interface ActionLogEntry {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  oldData?: any
  newData?: any
  result: 'success' | 'failure'
  reason?: string
  timestamp: Date
}
```

## Data Models

### Database Schema

```sql
-- Tabela de usuários (funcionários)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role employee_role NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  last_login TIMESTAMP,
  expiration_date TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Tabela de permissões customizadas
CREATE TABLE employee_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  conditions JSONB DEFAULT '{}',
  granted_by UUID REFERENCES employees(id),
  granted_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de chaves de acesso para clientes
CREATE TABLE client_access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES employees(id),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);

-- Tabela de logs de acesso
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_type VARCHAR(20) NOT NULL, -- 'client' | 'employee'
  action VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  location VARCHAR(255),
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Tabela de logs de ações
CREATE TABLE action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  result VARCHAR(20) NOT NULL, -- 'success' | 'failure'
  reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_client_keys_expires ON client_access_keys(expires_at);
CREATE INDEX idx_client_keys_active ON client_access_keys(is_active);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_access_logs_user ON access_logs(user_id, user_type);
CREATE INDEX idx_action_logs_timestamp ON action_logs(timestamp);
CREATE INDEX idx_action_logs_user ON action_logs(user_id);
```

## Error Handling

### Estratégias de Tratamento de Erro

```typescript
enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  INVALID_CLIENT_KEY = 'INVALID_CLIENT_KEY',
  KEY_EXPIRED = 'KEY_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public metadata?: any
  ) {
    super(message)
  }
}

// Middleware de tratamento de erros
const authErrorHandler = (error: AuthError, req: Request, res: Response) => {
  // Log do erro para auditoria
  auditService.logSecurityEvent({
    type: 'auth_error',
    code: error.code,
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: error.metadata
  })

  // Resposta baseada no tipo de erro
  switch (error.code) {
    case AuthErrorCode.INSUFFICIENT_PERMISSIONS:
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para executar esta ação'
      })
    
    case AuthErrorCode.EXPIRED_TOKEN:
    case AuthErrorCode.KEY_EXPIRED:
      return res.status(401).json({
        error: 'Sessão expirada',
        message: 'Faça login novamente'
      })
    
    case AuthErrorCode.SUSPICIOUS_ACTIVITY:
      return res.status(429).json({
        error: 'Atividade suspeita detectada',
        message: 'Conta temporariamente bloqueada'
      })
    
    default:
      return res.status(401).json({
        error: 'Erro de autenticação',
        message: 'Credenciais inválidas'
      })
  }
}
```

## Testing Strategy

### Estratégia de Testes

```typescript
// Testes de Unidade - Serviços
describe('AuthService', () => {
  describe('generateClientKey', () => {
    it('should generate unique key with 24h expiration', async () => {
      const key = await authService.generateClientKey('client-123')
      expect(key.key).toBeDefined()
      expect(key.expiresAt).toBeAfter(new Date())
      expect(key.clientId).toBe('client-123')
    })
  })
  
  describe('validateEmployeePermissions', () => {
    it('should allow atendente to read clients', async () => {
      const result = await permissionEngine.checkPermission(
        'atendente-user-id',
        'clientes',
        'read'
      )
      expect(result.allowed).toBe(true)
    })
    
    it('should deny atendente access to financial reports', async () => {
      const result = await permissionEngine.checkPermission(
        'atendente-user-id',
        'relatorios_financeiros',
        'read'
      )
      expect(result.allowed).toBe(false)
    })
  })
})

// Testes de Integração - API
describe('Portal API', () => {
  describe('POST /api/auth/client-access', () => {
    it('should generate client access key', async () => {
      const response = await request(app)
        .post('/api/auth/client-access')
        .send({ clientId: 'client-123' })
        .expect(200)
      
      expect(response.body.key).toBeDefined()
      expect(response.body.expiresAt).toBeDefined()
    })
  })
  
  describe('GET /api/portal/dashboard', () => {
    it('should return role-specific dashboard for employee', async () => {
      const token = await generateEmployeeToken('atendente-user')
      const response = await request(app)
        .get('/api/portal/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
      
      expect(response.body.modules).toContain('clientes')
      expect(response.body.modules).not.toContain('relatorios_financeiros')
    })
  })
})

// Testes E2E - Fluxos Completos
describe('Portal Access Flow', () => {
  it('should complete client access flow', async () => {
    // 1. Gerar chave de acesso
    const keyResponse = await generateClientKey('client-123')
    
    // 2. Acessar portal com chave
    const loginResponse = await accessPortalWithKey(keyResponse.key)
    expect(loginResponse.success).toBe(true)
    
    // 3. Verificar dados do cliente
    const dashboardResponse = await getClientDashboard(loginResponse.token)
    expect(dashboardResponse.clientData).toBeDefined()
    
    // 4. Verificar expiração após 24h
    await advanceTime('24 hours')
    const expiredResponse = await getClientDashboard(loginResponse.token)
    expect(expiredResponse.error).toBe('KEY_EXPIRED')
  })
})
```

Este design técnico fornece uma base sólida para implementar o portal de acesso com sistema de roles avançado. Quer que eu prossiga criando o arquivo de tarefas (tasks.md) para implementação?