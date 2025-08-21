import { EmployeeRole, Permission, RoleDefinition } from '@/types/auth'
import { ROLE_PERMISSIONS, getRolePermissions, canManageRole, getDashboardConfig, getHierarchyLevel } from '@/config/roles'

export interface CustomRoleDefinition extends RoleDefinition {
  id: string
  name: string
  description: string
  isCustom: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface RoleAssignment {
  id: string
  userId: string
  roleId: string
  assignedBy: string
  assignedAt: Date
  expiresAt?: Date
  isActive: boolean
  metadata?: any
}

export class RoleManagementService {
  
  // ==================== GESTÃO DE ROLES PADRÃO ====================
  
  async getAllStandardRoles(): Promise<RoleDefinition[]> {
    return Object.values(ROLE_PERMISSIONS)
  }

  async getStandardRole(role: EmployeeRole): Promise<RoleDefinition | null> {
    return ROLE_PERMISSIONS[role] || null
  }

  async getRoleHierarchy(): Promise<{ role: EmployeeRole; level: number; canManage: EmployeeRole[] }[]> {
    return Object.values(EmployeeRole).map(role => ({
      role,
      level: getHierarchyLevel(role),
      canManage: ROLE_PERMISSIONS[role]?.can_manage_roles || []
    })).sort((a, b) => a.level - b.level)
  }

  // ==================== GESTÃO DE ROLES CUSTOMIZADOS ====================

  async createCustomRole(
    roleData: {
      name: string
      description: string
      baseRole: EmployeeRole
      customPermissions: Permission[]
      dashboardConfig?: any
    },
    createdBy: string
  ): Promise<CustomRoleDefinition> {
    try {
      // Validar se o usuário pode criar roles
      const canCreate = await this.canUserManageRoles(createdBy)
      if (!canCreate) {
        throw new Error('Usuário não tem permissão para criar roles')
      }

      // Obter permissões base do role
      const basePermissions = getRolePermissions(roleData.baseRole)
      const baseDashboard = getDashboardConfig(roleData.baseRole)

      // Combinar permissões (custom sobrescreve base)
      const finalPermissions = this.mergePermissions(basePermissions, roleData.customPermissions)

      const customRole: CustomRoleDefinition = {
        id: this.generateRoleId(),
        name: roleData.name,
        description: roleData.description,
        role: roleData.baseRole, // Role base para hierarquia
        permissions: finalPermissions,
        hierarchy_level: getHierarchyLevel(roleData.baseRole),
        can_manage_roles: ROLE_PERMISSIONS[roleData.baseRole]?.can_manage_roles || [],
        dashboard_config: roleData.dashboardConfig || baseDashboard,
        isCustom: true,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }

      await this.saveCustomRole(customRole)
      await this.logRoleCreation(customRole, createdBy)

      return customRole
    } catch (error) {
      console.error('Error creating custom role:', error)
      throw error
    }
  }

  async updateCustomRole(
    roleId: string,
    updates: Partial<CustomRoleDefinition>,
    updatedBy: string
  ): Promise<CustomRoleDefinition> {
    try {
      const existingRole = await this.findCustomRoleById(roleId)
      if (!existingRole) {
        throw new Error('Role customizado não encontrado')
      }

      // Verificar permissão para editar
      const canEdit = await this.canUserManageCustomRole(updatedBy, roleId)
      if (!canEdit) {
        throw new Error('Usuário não tem permissão para editar este role')
      }

      const updatedRole: CustomRoleDefinition = {
        ...existingRole,
        ...updates,
        updatedAt: new Date()
      }

      await this.saveCustomRole(updatedRole)
      await this.logRoleUpdate(existingRole, updatedRole, updatedBy)

      return updatedRole
    } catch (error) {
      console.error('Error updating custom role:', error)
      throw error
    }
  }

  async deleteCustomRole(roleId: string, deletedBy: string): Promise<boolean> {
    try {
      const role = await this.findCustomRoleById(roleId)
      if (!role) {
        return false
      }

      // Verificar se há usuários usando este role
      const usersWithRole = await this.countUsersWithCustomRole(roleId)
      if (usersWithRole > 0) {
        throw new Error(`Não é possível deletar role em uso por ${usersWithRole} usuário(s)`)
      }

      // Verificar permissão
      const canDelete = await this.canUserManageCustomRole(deletedBy, roleId)
      if (!canDelete) {
        throw new Error('Usuário não tem permissão para deletar este role')
      }

      await this.removeCustomRole(roleId)
      await this.logRoleDeletion(role, deletedBy)

      return true
    } catch (error) {
      console.error('Error deleting custom role:', error)
      throw error
    }
  }

  async getCustomRoles(filters?: {
    createdBy?: string
    isActive?: boolean
    baseRole?: EmployeeRole
  }): Promise<CustomRoleDefinition[]> {
    return await this.findCustomRoles(filters)
  }

  // ==================== ATRIBUIÇÃO DE ROLES ====================

  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string,
    options?: {
      expiresAt?: Date
      metadata?: any
    }
  ): Promise<RoleAssignment> {
    try {
      // Verificar se o usuário existe
      const user = await this.findUserById(userId)
      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      // Verificar se quem está atribuindo tem permissão
      const canAssign = await this.canUserAssignRole(assignedBy, roleId, userId)
      if (!canAssign) {
        throw new Error('Usuário não tem permissão para atribuir este role')
      }

      // Desativar role atual se existir
      await this.deactivateUserCurrentRole(userId)

      // Criar nova atribuição
      const assignment: RoleAssignment = {
        id: this.generateAssignmentId(),
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
        expiresAt: options?.expiresAt,
        isActive: true,
        metadata: options?.metadata
      }

      await this.saveRoleAssignment(assignment)
      await this.logRoleAssignment(assignment)

      return assignment
    } catch (error) {
      console.error('Error assigning role:', error)
      throw error
    }
  }

  async revokeUserRole(userId: string, revokedBy: string): Promise<boolean> {
    try {
      const currentAssignment = await this.findActiveRoleAssignment(userId)
      if (!currentAssignment) {
        return false
      }

      // Verificar permissão
      const canRevoke = await this.canUserRevokeRole(revokedBy, currentAssignment.roleId, userId)
      if (!canRevoke) {
        throw new Error('Usuário não tem permissão para revogar este role')
      }

      await this.deactivateRoleAssignment(currentAssignment.id)
      await this.logRoleRevocation(currentAssignment, revokedBy)

      return true
    } catch (error) {
      console.error('Error revoking role:', error)
      throw error
    }
  }

  async getUserEffectiveRole(userId: string): Promise<{
    assignment: RoleAssignment | null
    roleDefinition: RoleDefinition | CustomRoleDefinition | null
    permissions: Permission[]
  }> {
    try {
      const assignment = await this.findActiveRoleAssignment(userId)
      if (!assignment) {
        return { assignment: null, roleDefinition: null, permissions: [] }
      }

      // Verificar se é role padrão ou customizado
      let roleDefinition: RoleDefinition | CustomRoleDefinition | null = null
      
      if (Object.values(EmployeeRole).includes(assignment.roleId as EmployeeRole)) {
        // Role padrão
        roleDefinition = await this.getStandardRole(assignment.roleId as EmployeeRole)
      } else {
        // Role customizado
        roleDefinition = await this.findCustomRoleById(assignment.roleId)
      }

      const permissions = roleDefinition?.permissions || []

      return { assignment, roleDefinition, permissions }
    } catch (error) {
      console.error('Error getting user effective role:', error)
      return { assignment: null, roleDefinition: null, permissions: [] }
    }
  }

  // ==================== VALIDAÇÃO DE PERMISSÕES ====================

  async validateUserPermission(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { roleDefinition, permissions } = await this.getUserEffectiveRole(userId)
      
      if (!roleDefinition) {
        return { allowed: false, reason: 'Usuário sem role atribuído' }
      }

      // Verificar permissão específica
      const hasPermission = this.checkPermissionInList(permissions, resource, action, context)
      
      if (!hasPermission) {
        return { allowed: false, reason: 'Permissão insuficiente' }
      }

      // Verificar regras de negócio adicionais
      const businessRuleCheck = await this.checkBusinessRules(userId, resource, action, context)
      
      return businessRuleCheck
    } catch (error) {
      console.error('Error validating user permission:', error)
      return { allowed: false, reason: 'Erro na validação de permissão' }
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private mergePermissions(basePermissions: Permission[], customPermissions: Permission[]): Permission[] {
    const merged = [...basePermissions]
    
    for (const customPerm of customPermissions) {
      const existingIndex = merged.findIndex(p => 
        p.resource === customPerm.resource && p.action === customPerm.action
      )
      
      if (existingIndex >= 0) {
        merged[existingIndex] = customPerm
      } else {
        merged.push(customPerm)
      }
    }
    
    return merged
  }

  private checkPermissionInList(
    permissions: Permission[],
    resource: string,
    action: string,
    context?: any
  ): boolean {
    // Verificar permissão wildcard
    const wildcardPerm = permissions.find(p => p.resource === '*' && p.action === action)
    if (wildcardPerm) return true

    // Verificar permissão específica
    const specificPerm = permissions.find(p => p.resource === resource && p.action === action)
    if (!specificPerm) return false

    // Verificar condições
    if (specificPerm.conditions) {
      if (specificPerm.conditions.own_only && context?.ownerId !== context?.userId) {
        return false
      }
      
      if (specificPerm.conditions.max_value && context?.value > specificPerm.conditions.max_value) {
        return false
      }
      
      if (specificPerm.conditions.departments && 
          !specificPerm.conditions.departments.includes(context?.department)) {
        return false
      }
    }

    return true
  }

  private async checkBusinessRules(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Implementar regras de negócio específicas
    // Por exemplo: horário de funcionamento, limites de valor, etc.
    return { allowed: true }
  }

  private generateRoleId(): string {
    return `custom_role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAssignmentId(): string {
    return `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ==================== MÉTODOS DE BANCO (IMPLEMENTAR) ====================

  private async canUserManageRoles(userId: string): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async canUserManageCustomRole(userId: string, roleId: string): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async canUserAssignRole(assignerId: string, roleId: string, targetUserId: string): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async canUserRevokeRole(revokerId: string, roleId: string, targetUserId: string): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async saveCustomRole(role: CustomRoleDefinition): Promise<void> {
    // TODO: Implementar salvamento no banco
    console.log('Saving custom role:', role.id)
  }

  private async findCustomRoleById(roleId: string): Promise<CustomRoleDefinition | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async findCustomRoles(filters?: any): Promise<CustomRoleDefinition[]> {
    // TODO: Implementar busca no banco
    return []
  }

  private async removeCustomRole(roleId: string): Promise<void> {
    // TODO: Implementar remoção no banco
    console.log('Removing custom role:', roleId)
  }

  private async countUsersWithCustomRole(roleId: string): Promise<number> {
    // TODO: Implementar contagem no banco
    return 0
  }

  private async findUserById(userId: string): Promise<any> {
    // TODO: Implementar busca no banco
    return { id: userId, name: 'User Test' }
  }

  private async saveRoleAssignment(assignment: RoleAssignment): Promise<void> {
    // TODO: Implementar salvamento no banco
    console.log('Saving role assignment:', assignment.id)
  }

  private async findActiveRoleAssignment(userId: string): Promise<RoleAssignment | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async deactivateUserCurrentRole(userId: string): Promise<void> {
    // TODO: Implementar desativação no banco
    console.log('Deactivating current role for user:', userId)
  }

  private async deactivateRoleAssignment(assignmentId: string): Promise<void> {
    // TODO: Implementar desativação no banco
    console.log('Deactivating role assignment:', assignmentId)
  }

  // ==================== LOGS DE AUDITORIA ====================

  private async logRoleCreation(role: CustomRoleDefinition, createdBy: string): Promise<void> {
    console.log('Role creation log:', { roleId: role.id, createdBy })
  }

  private async logRoleUpdate(oldRole: CustomRoleDefinition, newRole: CustomRoleDefinition, updatedBy: string): Promise<void> {
    console.log('Role update log:', { roleId: oldRole.id, updatedBy })
  }

  private async logRoleDeletion(role: CustomRoleDefinition, deletedBy: string): Promise<void> {
    console.log('Role deletion log:', { roleId: role.id, deletedBy })
  }

  private async logRoleAssignment(assignment: RoleAssignment): Promise<void> {
    console.log('Role assignment log:', assignment)
  }

  private async logRoleRevocation(assignment: RoleAssignment, revokedBy: string): Promise<void> {
    console.log('Role revocation log:', { assignmentId: assignment.id, revokedBy })
  }
}

export const roleManagementService = new RoleManagementService()