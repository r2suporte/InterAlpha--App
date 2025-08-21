import { EmployeeRole, Permission } from '@/types/auth'
import { hasPermission, getRolePermissions, canManageRole } from '@/config/roles'

export interface PermissionContext {
  userId?: string
  ownerId?: string
  department?: string
  value?: number
  resourceId?: string
  resourceData?: any
  requestMetadata?: {
    ipAddress: string
    userAgent: string
    timestamp: Date
  }
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
  conditions?: any
  auditLog: AuditEntry
}

export interface AuditEntry {
  userId: string
  action: string
  resource: string
  result: 'allowed' | 'denied'
  reason?: string
  timestamp: Date
  metadata?: any
}

export class PermissionService {
  
  async checkPermission(
    userId: string,
    role: EmployeeRole,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    const timestamp = new Date()
    
    try {
      // Verificar permissão básica do role
      const hasBasicPermission = hasPermission(role, resource, action, {
        ...context,
        userId
      })

      if (!hasBasicPermission) {
        const auditLog: AuditEntry = {
          userId,
          action: `${action}:${resource}`,
          resource,
          result: 'denied',
          reason: 'Insufficient role permissions',
          timestamp,
          metadata: context?.requestMetadata
        }

        await this.logAuditEntry(auditLog)

        return {
          allowed: false,
          reason: 'Permissão insuficiente para esta ação',
          auditLog
        }
      }

      // Verificar condições específicas do usuário
      const customPermissions = await this.getUserCustomPermissions(userId)
      const hasCustomPermission = this.checkCustomPermissions(
        customPermissions,
        resource,
        action,
        context
      )

      if (hasCustomPermission === false) {
        const auditLog: AuditEntry = {
          userId,
          action: `${action}:${resource}`,
          resource,
          result: 'denied',
          reason: 'Custom permissions deny access',
          timestamp,
          metadata: context?.requestMetadata
        }

        await this.logAuditEntry(auditLog)

        return {
          allowed: false,
          reason: 'Permissões customizadas negam acesso',
          auditLog
        }
      }

      // Verificar regras de negócio específicas
      const businessRuleCheck = await this.checkBusinessRules(
        userId,
        role,
        resource,
        action,
        context
      )

      if (!businessRuleCheck.allowed) {
        const auditLog: AuditEntry = {
          userId,
          action: `${action}:${resource}`,
          resource,
          result: 'denied',
          reason: businessRuleCheck.reason,
          timestamp,
          metadata: context?.requestMetadata
        }

        await this.logAuditEntry(auditLog)

        return {
          allowed: false,
          reason: businessRuleCheck.reason,
          auditLog
        }
      }

      // Permissão concedida
      const auditLog: AuditEntry = {
        userId,
        action: `${action}:${resource}`,
        resource,
        result: 'allowed',
        timestamp,
        metadata: context?.requestMetadata
      }

      await this.logAuditEntry(auditLog)

      return {
        allowed: true,
        auditLog
      }

    } catch (error) {
      const auditLog: AuditEntry = {
        userId,
        action: `${action}:${resource}`,
        resource,
        result: 'denied',
        reason: 'Permission check error',
        timestamp,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }

      await this.logAuditEntry(auditLog)

      return {
        allowed: false,
        reason: 'Erro na verificação de permissões',
        auditLog
      }
    }
  }

  async getEffectivePermissions(userId: string, role: EmployeeRole): Promise<Permission[]> {
    // Obter permissões base do role
    const rolePermissions = getRolePermissions(role)
    
    // Obter permissões customizadas do usuário
    const customPermissions = await this.getUserCustomPermissions(userId)
    
    // Combinar permissões (custom sobrescreve role)
    const effectivePermissions = [...rolePermissions]
    
    for (const customPerm of customPermissions) {
      const existingIndex = effectivePermissions.findIndex(p => 
        p.resource === customPerm.resource && p.action === customPerm.action
      )
      
      if (existingIndex >= 0) {
        effectivePermissions[existingIndex] = customPerm
      } else {
        effectivePermissions.push(customPerm)
      }
    }
    
    return effectivePermissions
  }

  async canManageUser(managerId: string, managerRole: EmployeeRole, targetUserId: string): Promise<boolean> {
    try {
      // Obter role do usuário alvo
      const targetUser = await this.getUserById(targetUserId)
      if (!targetUser) return false

      // Verificar hierarquia de roles
      const canManage = canManageRole(managerRole, targetUser.role)
      
      // Verificar se não está tentando gerenciar a si mesmo (exceto para auto-edição)
      if (managerId === targetUserId) {
        return true // Pode editar próprio perfil
      }

      return canManage
    } catch (error) {
      return false
    }
  }

  async getAccessibleResources(userId: string, role: EmployeeRole): Promise<string[]> {
    const permissions = await this.getEffectivePermissions(userId, role)
    const resources = new Set<string>()
    
    for (const permission of permissions) {
      if (permission.resource === '*') {
        // Adicionar todos os recursos disponíveis
        const allResources = await this.getAllAvailableResources()
        allResources.forEach(resource => resources.add(resource))
      } else {
        resources.add(permission.resource)
      }
    }
    
    return Array.from(resources)
  }

  // Métodos privados auxiliares

  private checkCustomPermissions(
    customPermissions: Permission[],
    resource: string,
    action: string,
    context?: PermissionContext
  ): boolean | null {
    const customPerm = customPermissions.find(p => 
      p.resource === resource && p.action === action
    )
    
    if (!customPerm) return null // Não há permissão customizada
    
    // Verificar condições da permissão customizada
    if (customPerm.conditions) {
      if (customPerm.conditions.own_only && context?.ownerId !== context?.userId) {
        return false
      }
      
      if (customPerm.conditions.max_value && context?.value && context.value > customPerm.conditions.max_value) {
        return false
      }
      
      if (customPerm.conditions.departments && context?.department &&
          !customPerm.conditions.departments.includes(context.department)) {
        return false
      }
    }
    
    return true
  }

  private async checkBusinessRules(
    userId: string,
    role: EmployeeRole,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Regras de negócio específicas
    
    // Exemplo: Técnicos só podem ver ordens em horário comercial
    if (role === EmployeeRole.TECNICO && resource === 'ordens' && action === 'read') {
      const now = new Date()
      const hour = now.getHours()
      if (hour < 8 || hour > 18) {
        return {
          allowed: false,
          reason: 'Acesso a ordens de serviço permitido apenas em horário comercial'
        }
      }
    }

    // Exemplo: Limite de valor para aprovações
    if (action === 'approve' && resource === 'pagamentos' && context?.value) {
      const maxApprovalValue = this.getMaxApprovalValue(role)
      if (context.value > maxApprovalValue) {
        return {
          allowed: false,
          reason: `Valor excede limite de aprovação (R$ ${maxApprovalValue})`
        }
      }
    }

    // Exemplo: Verificar se usuário está ativo
    const user = await this.getUserById(userId)
    if (!user || !user.isActive) {
      return {
        allowed: false,
        reason: 'Usuário inativo'
      }
    }

    return { allowed: true }
  }

  private getMaxApprovalValue(role: EmployeeRole): number {
    switch (role) {
      case EmployeeRole.ATENDENTE:
        return 100
      case EmployeeRole.TECNICO:
        return 500
      case EmployeeRole.SUPERVISOR_TECNICO:
        return 2000
      case EmployeeRole.GERENTE_ADM:
        return 10000
      case EmployeeRole.GERENTE_FINANCEIRO:
        return Infinity
      default:
        return 0
    }
  }

  // Métodos de banco de dados (implementar depois)
  private async getUserCustomPermissions(userId: string): Promise<Permission[]> {
    // TODO: Implementar busca no banco
    return []
  }

  private async getUserById(userId: string): Promise<any> {
    // TODO: Implementar busca no banco
    return { id: userId, isActive: true, role: EmployeeRole.ATENDENTE }
  }

  private async getAllAvailableResources(): Promise<string[]> {
    // TODO: Implementar busca de recursos disponíveis
    return ['clientes', 'ordens', 'pagamentos', 'relatorios']
  }

  private async logAuditEntry(entry: AuditEntry): Promise<void> {
    // TODO: Implementar log de auditoria
    console.log('Audit Entry:', entry)
  }
}

export const permissionService = new PermissionService()