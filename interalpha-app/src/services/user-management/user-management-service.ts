import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Employee, EmployeeRole } from '@/types/auth'
import { 
  CreateEmployeeData, 
  UpdateEmployeeData, 
  EmployeeInvitation, 
  InvitationStatus,
  UserTransfer,
  TransferStatus,
  TransferredItem,
  UserActivity,
  UserStats,
  BulkUserOperation
} from '@/types/user-management'
import { roleManagementService } from '@/services/rbac/role-management-service'

export interface EmployeeFilters {
  role?: EmployeeRole
  department?: string
  isActive?: boolean
  createdBy?: string
  search?: string
  page?: number
  limit?: number
}

export class UserManagementService {
  
  // ==================== CRUD DE FUNCIONÁRIOS ====================
  
  async createEmployee(data: CreateEmployeeData, createdBy: string): Promise<Employee> {
    try {
      // Verificar se o criador tem permissão
      const canCreate = await this.canUserCreateEmployee(createdBy, data.role)
      if (!canCreate) {
        throw new Error('Usuário não tem permissão para criar funcionários com este role')
      }

      // Verificar se email já existe
      const existingUser = await this.findEmployeeByEmail(data.email)
      if (existingUser) {
        throw new Error('Email já está em uso')
      }

      // Gerar senha temporária
      const temporaryPassword = this.generateTemporaryPassword()
      const passwordHash = await bcrypt.hash(temporaryPassword, 12)

      // Criar funcionário
      const employee: Employee = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        permissions: data.customPermissions || [],
        isActive: true,
        createdAt: new Date(),
        createdBy,
        metadata: {
          department: data.department,
          expirationDate: data.expirationDate,
          notificationPreferences: data.notificationPreferences,
          ...data.metadata
        }
      }

      // Salvar no banco
      await this.saveEmployee(employee, passwordHash)

      // Atribuir role
      await roleManagementService.assignRoleToUser(
        employee.id,
        data.role,
        createdBy,
        {
          expiresAt: data.expirationDate,
          metadata: { createdViaUserManagement: true }
        }
      )

      // Enviar credenciais por email
      await this.sendWelcomeEmail(employee, temporaryPassword)

      // Log da criação
      await this.logUserAction(createdBy, 'create_employee', 'employees', employee.id, {
        employeeName: employee.name,
        employeeRole: employee.role
      })

      return employee

    } catch (error) {
      console.error('Error creating employee:', error)
      throw error
    }
  }

  async updateEmployee(id: string, data: UpdateEmployeeData, updatedBy: string): Promise<Employee> {
    try {
      const existingEmployee = await this.findEmployeeById(id)
      if (!existingEmployee) {
        throw new Error('Funcionário não encontrado')
      }

      // Verificar permissão para editar
      const canUpdate = await this.canUserUpdateEmployee(updatedBy, id, data)
      if (!canUpdate) {
        throw new Error('Usuário não tem permissão para editar este funcionário')
      }

      // Verificar se email está sendo alterado e se já existe
      if (data.email && data.email !== existingEmployee.email) {
        const emailExists = await this.findEmployeeByEmail(data.email)
        if (emailExists) {
          throw new Error('Email já está em uso')
        }
      }

      // Atualizar dados
      const updatedEmployee: Employee = {
        ...existingEmployee,
        ...data,
        metadata: {
          ...existingEmployee.metadata,
          ...data.metadata
        }
      }

      await this.saveEmployee(updatedEmployee)

      // Se o role mudou, atualizar atribuição
      if (data.role && data.role !== existingEmployee.role) {
        await roleManagementService.assignRoleToUser(
          id,
          data.role,
          updatedBy,
          {
            expiresAt: data.expirationDate,
            metadata: { updatedViaUserManagement: true }
          }
        )
      }

      // Log da atualização
      await this.logUserAction(updatedBy, 'update_employee', 'employees', id, {
        changes: this.getChanges(existingEmployee, updatedEmployee)
      })

      return updatedEmployee

    } catch (error) {
      console.error('Error updating employee:', error)
      throw error
    }
  }

  async deactivateEmployee(id: string, deactivatedBy: string, transferTo?: string): Promise<void> {
    try {
      const employee = await this.findEmployeeById(id)
      if (!employee) {
        throw new Error('Funcionário não encontrado')
      }

      // Verificar permissão
      const canDeactivate = await this.canUserDeactivateEmployee(deactivatedBy, id)
      if (!canDeactivate) {
        throw new Error('Usuário não tem permissão para desativar este funcionário')
      }

      // Se especificado, transferir responsabilidades
      if (transferTo) {
        await this.transferUserResponsibilities(id, transferTo, deactivatedBy, 'Desativação de usuário')
      }

      // Desativar funcionário
      await this.setEmployeeActive(id, false)

      // Revogar role
      await roleManagementService.revokeUserRole(id, deactivatedBy)

      // Log da desativação
      await this.logUserAction(deactivatedBy, 'deactivate_employee', 'employees', id, {
        employeeName: employee.name,
        transferTo
      })

    } catch (error) {
      console.error('Error deactivating employee:', error)
      throw error
    }
  }

  async getEmployee(id: string): Promise<Employee | null> {
    return await this.findEmployeeById(id)
  }

  async listEmployees(filters: EmployeeFilters): Promise<{
    employees: Employee[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      const { employees, total } = await this.findEmployees(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        employees,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error listing employees:', error)
      throw error
    }
  }

  // ==================== SISTEMA DE CONVITES ====================

  async inviteEmployee(
    email: string,
    role: EmployeeRole,
    invitedBy: string,
    metadata?: any
  ): Promise<EmployeeInvitation> {
    try {
      // Verificar permissão
      const canInvite = await this.canUserInviteEmployee(invitedBy, role)
      if (!canInvite) {
        throw new Error('Usuário não tem permissão para convidar funcionários com este role')
      }

      // Verificar se email já existe
      const existingUser = await this.findEmployeeByEmail(email)
      if (existingUser) {
        throw new Error('Email já está cadastrado')
      }

      // Verificar se já há convite pendente
      const pendingInvitation = await this.findPendingInvitation(email)
      if (pendingInvitation) {
        throw new Error('Já existe um convite pendente para este email')
      }

      // Criar convite
      const invitation: EmployeeInvitation = {
        id: crypto.randomUUID(),
        email,
        role,
        invitedBy,
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        status: InvitationStatus.PENDING,
        token: this.generateInvitationToken(),
        metadata
      }

      await this.saveInvitation(invitation)

      // Enviar email de convite
      await this.sendInvitationEmail(invitation)

      // Log do convite
      await this.logUserAction(invitedBy, 'invite_employee', 'invitations', invitation.id, {
        email,
        role
      })

      return invitation

    } catch (error) {
      console.error('Error inviting employee:', error)
      throw error
    }
  }

  async acceptInvitation(token: string, userData: {
    name: string
    phone: string
    password: string
  }): Promise<Employee> {
    try {
      const invitation = await this.findInvitationByToken(token)
      if (!invitation) {
        throw new Error('Convite não encontrado')
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new Error('Convite já foi processado')
      }

      if (new Date() > invitation.expiresAt) {
        await this.updateInvitationStatus(invitation.id, InvitationStatus.EXPIRED)
        throw new Error('Convite expirado')
      }

      // Criar funcionário
      const passwordHash = await bcrypt.hash(userData.password, 12)
      
      const employee: Employee = {
        id: crypto.randomUUID(),
        name: userData.name,
        email: invitation.email,
        phone: userData.phone,
        role: invitation.role,
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        createdBy: invitation.invitedBy,
        metadata: {
          notificationPreferences: {
            email: true,
            sms: false,
            push: true,
            channels: ['email', 'push']
          }
        }
      }

      await this.saveEmployee(employee, passwordHash)

      // Atribuir role
      await roleManagementService.assignRoleToUser(
        employee.id,
        invitation.role,
        invitation.invitedBy,
        {
          metadata: { acceptedInvitation: invitation.id }
        }
      )

      // Atualizar status do convite
      await this.updateInvitationStatus(invitation.id, InvitationStatus.ACCEPTED, new Date())

      // Log da aceitação
      await this.logUserAction(employee.id, 'accept_invitation', 'invitations', invitation.id, {
        employeeName: employee.name
      })

      return employee

    } catch (error) {
      console.error('Error accepting invitation:', error)
      throw error
    }
  }

  async cancelInvitation(invitationId: string, cancelledBy: string): Promise<boolean> {
    try {
      const invitation = await this.findInvitationById(invitationId)
      if (!invitation) {
        return false
      }

      // Verificar permissão
      const canCancel = await this.canUserCancelInvitation(cancelledBy, invitation)
      if (!canCancel) {
        throw new Error('Usuário não tem permissão para cancelar este convite')
      }

      await this.updateInvitationStatus(invitationId, InvitationStatus.CANCELLED)

      // Log do cancelamento
      await this.logUserAction(cancelledBy, 'cancel_invitation', 'invitations', invitationId, {
        email: invitation.email
      })

      return true

    } catch (error) {
      console.error('Error cancelling invitation:', error)
      throw error
    }
  }

  // ==================== TRANSFERÊNCIA DE RESPONSABILIDADES ====================

  async transferUserResponsibilities(
    fromUserId: string,
    toUserId: string,
    transferredBy: string,
    reason: string
  ): Promise<UserTransfer> {
    try {
      // Verificar se usuários existem
      const fromUser = await this.findEmployeeById(fromUserId)
      const toUser = await this.findEmployeeById(toUserId)

      if (!fromUser || !toUser) {
        throw new Error('Usuário de origem ou destino não encontrado')
      }

      // Verificar permissão
      const canTransfer = await this.canUserTransferResponsibilities(transferredBy, fromUserId, toUserId)
      if (!canTransfer) {
        throw new Error('Usuário não tem permissão para transferir responsabilidades')
      }

      // Criar registro de transferência
      const transfer: UserTransfer = {
        id: crypto.randomUUID(),
        fromUserId,
        toUserId,
        transferredBy,
        transferredAt: new Date(),
        reason,
        transferredItems: [],
        status: TransferStatus.PENDING
      }

      await this.saveUserTransfer(transfer)

      // Executar transferência em background
      this.executeTransfer(transfer.id)

      return transfer

    } catch (error) {
      console.error('Error transferring user responsibilities:', error)
      throw error
    }
  }

  private async executeTransfer(transferId: string): Promise<void> {
    try {
      const transfer = await this.findUserTransferById(transferId)
      if (!transfer) return

      await this.updateTransferStatus(transferId, TransferStatus.IN_PROGRESS)

      const transferredItems: TransferredItem[] = []

      // Transferir ordens de serviço
      const orders = await this.findUserOrders(transfer.fromUserId)
      for (const order of orders) {
        try {
          await this.transferOrder(order.id, transfer.toUserId)
          transferredItems.push({
            type: 'orders',
            itemId: order.id,
            itemName: `Ordem #${order.number}`,
            transferred: true
          })
        } catch (error) {
          transferredItems.push({
            type: 'orders',
            itemId: order.id,
            itemName: `Ordem #${order.number}`,
            transferred: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      }

      // Transferir clientes atribuídos
      const clients = await this.findUserClients(transfer.fromUserId)
      for (const client of clients) {
        try {
          await this.transferClient(client.id, transfer.toUserId)
          transferredItems.push({
            type: 'clients',
            itemId: client.id,
            itemName: client.name,
            transferred: true
          })
        } catch (error) {
          transferredItems.push({
            type: 'clients',
            itemId: client.id,
            itemName: client.name,
            transferred: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      }

      // Atualizar transferência
      await this.updateTransferItems(transferId, transferredItems)
      await this.updateTransferStatus(transferId, TransferStatus.COMPLETED, new Date())

      // Log da transferência
      await this.logUserAction(transfer.transferredBy, 'complete_transfer', 'transfers', transferId, {
        fromUser: transfer.fromUserId,
        toUser: transfer.toUserId,
        itemsTransferred: transferredItems.filter(i => i.transferred).length,
        itemsFailed: transferredItems.filter(i => !i.transferred).length
      })

    } catch (error) {
      console.error('Error executing transfer:', error)
      await this.updateTransferStatus(transferId, TransferStatus.FAILED)
    }
  }

  // ==================== ESTATÍSTICAS E ATIVIDADES ====================

  async getUserActivity(userId: string, filters?: {
    startDate?: Date
    endDate?: Date
    actions?: string[]
    limit?: number
  }): Promise<UserActivity[]> {
    return await this.findUserActivities(userId, filters)
  }

  async getUserStats(userId: string): Promise<UserStats> {
    return await this.calculateUserStats(userId)
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  private getChanges(oldData: any, newData: any): any {
    const changes: any = {}
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = { from: oldData[key], to: newData[key] }
      }
    }
    return changes
  }

  // ==================== MÉTODOS DE BANCO (IMPLEMENTAR) ====================

  private async canUserCreateEmployee(userId: string, role: EmployeeRole): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async canUserUpdateEmployee(userId: string, targetId: string, data: UpdateEmployeeData): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async canUserDeactivateEmployee(userId: string, targetId: string): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async canUserInviteEmployee(userId: string, role: EmployeeRole): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async canUserCancelInvitation(userId: string, invitation: EmployeeInvitation): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async canUserTransferResponsibilities(userId: string, fromId: string, toId: string): Promise<boolean> {
    // TODO: Implementar verificação de permissão
    return true
  }

  private async saveEmployee(employee: Employee, passwordHash?: string): Promise<void> {
    // TODO: Implementar salvamento no banco
    console.log('Saving employee:', employee.id)
  }

  private async findEmployeeById(id: string): Promise<Employee | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async findEmployeeByEmail(email: string): Promise<Employee | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async findEmployees(filters: EmployeeFilters, limit: number, offset: number): Promise<{ employees: Employee[]; total: number }> {
    // TODO: Implementar busca no banco
    return { employees: [], total: 0 }
  }

  private async setEmployeeActive(id: string, isActive: boolean): Promise<void> {
    // TODO: Implementar atualização no banco
    console.log(`Setting employee ${id} active: ${isActive}`)
  }

  private async saveInvitation(invitation: EmployeeInvitation): Promise<void> {
    // TODO: Implementar salvamento no banco
    console.log('Saving invitation:', invitation.id)
  }

  private async findInvitationById(id: string): Promise<EmployeeInvitation | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async findInvitationByToken(token: string): Promise<EmployeeInvitation | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async findPendingInvitation(email: string): Promise<EmployeeInvitation | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async updateInvitationStatus(id: string, status: InvitationStatus, acceptedAt?: Date): Promise<void> {
    // TODO: Implementar atualização no banco
    console.log(`Updating invitation ${id} status: ${status}`)
  }

  private async saveUserTransfer(transfer: UserTransfer): Promise<void> {
    // TODO: Implementar salvamento no banco
    console.log('Saving user transfer:', transfer.id)
  }

  private async findUserTransferById(id: string): Promise<UserTransfer | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async updateTransferStatus(id: string, status: TransferStatus, completedAt?: Date): Promise<void> {
    // TODO: Implementar atualização no banco
    console.log(`Updating transfer ${id} status: ${status}`)
  }

  private async updateTransferItems(id: string, items: TransferredItem[]): Promise<void> {
    // TODO: Implementar atualização no banco
    console.log(`Updating transfer ${id} items:`, items.length)
  }

  private async findUserOrders(userId: string): Promise<any[]> {
    // TODO: Implementar busca no banco
    return []
  }

  private async findUserClients(userId: string): Promise<any[]> {
    // TODO: Implementar busca no banco
    return []
  }

  private async transferOrder(orderId: string, toUserId: string): Promise<void> {
    // TODO: Implementar transferência no banco
    console.log(`Transferring order ${orderId} to user ${toUserId}`)
  }

  private async transferClient(clientId: string, toUserId: string): Promise<void> {
    // TODO: Implementar transferência no banco
    console.log(`Transferring client ${clientId} to user ${toUserId}`)
  }

  private async findUserActivities(userId: string, filters?: any): Promise<UserActivity[]> {
    // TODO: Implementar busca no banco
    return []
  }

  private async calculateUserStats(userId: string): Promise<UserStats> {
    // TODO: Implementar cálculo de estatísticas
    return {
      userId,
      totalLogins: 0,
      totalActions: 0,
      actionsToday: 0,
      averageSessionDuration: 0,
      mostUsedFeatures: []
    }
  }

  private async logUserAction(userId: string, action: string, resource: string, resourceId?: string, details?: any): Promise<void> {
    // TODO: Implementar log de ação
    console.log('User action log:', { userId, action, resource, resourceId, details })
  }

  private async sendWelcomeEmail(employee: Employee, temporaryPassword: string): Promise<void> {
    // TODO: Implementar envio de email
    console.log(`Sending welcome email to ${employee.email}`)
  }

  private async sendInvitationEmail(invitation: EmployeeInvitation): Promise<void> {
    // TODO: Implementar envio de email
    console.log(`Sending invitation email to ${invitation.email}`)
  }
}

export const userManagementService = new UserManagementService()