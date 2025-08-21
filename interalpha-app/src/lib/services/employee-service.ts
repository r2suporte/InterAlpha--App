import { clerkClient } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateEmployeeData {
  name: string
  email: string
  phone?: string
  role: string
  department?: string
  password: string
  permissions?: string[]
}

export interface UpdateEmployeeData {
  name?: string
  email?: string
  phone?: string
  role?: string
  department?: string
  permissions?: string[]
}

export class EmployeeService {
  
  /**
   * Cria um novo funcionário no Clerk e no banco de dados
   */
  async createEmployee(data: CreateEmployeeData, createdBy: string) {
    try {
      // 1. Criar usuário no Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [data.email],
        firstName: data.name.split(' ')[0],
        lastName: data.name.split(' ').slice(1).join(' '),
        password: data.password,
        publicMetadata: {
          role: data.role,
          department: data.department,
          isEmployee: true
        },
        privateMetadata: {
          permissions: data.permissions || this.getDefaultPermissions(data.role)
        }
      })

      // 2. Salvar no banco de dados
      const employee = await prisma.employee.create({
        data: {
          clerkId: clerkUser.id,
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: data.role as any, // Cast para o enum
          department: data.department,
          permissions: data.permissions || this.getDefaultPermissions(data.role),
          createdBy,
          isActive: true
        }
      })

      // 3. Enviar email de boas-vindas (opcional)
      await this.sendWelcomeEmail(data.email, data.name, data.password)

      return {
        success: true,
        data: employee,
        clerkId: clerkUser.id
      }

    } catch (error) {
      console.error('Erro ao criar funcionário:', error)
      throw new Error(`Erro ao criar funcionário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Atualiza um funcionário no Clerk e no banco de dados
   */
  async updateEmployee(employeeId: string, data: UpdateEmployeeData) {
    try {
      // 1. Buscar funcionário no banco
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      })

      if (!employee) {
        throw new Error('Funcionário não encontrado')
      }

      // 2. Atualizar no Clerk
      if (data.name || data.email) {
        await clerkClient.users.updateUser(employee.clerkId, {
          firstName: data.name ? data.name.split(' ')[0] : undefined,
          lastName: data.name ? data.name.split(' ').slice(1).join(' ') : undefined,
          publicMetadata: {
            role: data.role || employee.role,
            department: data.department || employee.department,
            isEmployee: true
          },
          privateMetadata: {
            permissions: data.permissions || employee.permissions
          }
        })
      }

      // 3. Atualizar no banco de dados
      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          name: data.name || employee.name,
          email: data.email || employee.email,
          phone: data.phone !== undefined ? data.phone : employee.phone,
          role: (data.role as any) || employee.role,
          department: data.department !== undefined ? data.department : employee.department,
          permissions: data.permissions || employee.permissions
        }
      })

      return {
        success: true,
        data: updatedEmployee
      }

    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error)
      throw new Error(`Erro ao atualizar funcionário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Desativa um funcionário (soft delete)
   */
  async deactivateEmployee(employeeId: string) {
    try {
      // 1. Buscar funcionário no banco
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      })

      if (!employee) {
        throw new Error('Funcionário não encontrado')
      }

      // 2. Desativar no Clerk
      await clerkClient.users.updateUser(employee.clerkId, {
        publicMetadata: {
          ...employee.metadata,
          isActive: false
        }
      })

      // 3. Desativar no banco de dados
      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          isActive: false
        }
      })

      return {
        success: true,
        data: updatedEmployee
      }

    } catch (error) {
      console.error('Erro ao desativar funcionário:', error)
      throw new Error(`Erro ao desativar funcionário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Exclui um funcionário permanentemente
   */
  async deleteEmployee(employeeId: string) {
    try {
      // 1. Buscar funcionário no banco
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      })

      if (!employee) {
        throw new Error('Funcionário não encontrado')
      }

      // 2. Verificar se não é o último admin
      if (employee.role === 'ADMIN') {
        const adminCount = await prisma.employee.count({
          where: {
            role: 'ADMIN',
            isActive: true,
            id: { not: employeeId }
          }
        })

        if (adminCount === 0) {
          throw new Error('Não é possível excluir o último administrador')
        }
      }

      // 3. Excluir do Clerk
      await clerkClient.users.deleteUser(employee.clerkId)

      // 4. Excluir do banco de dados
      await prisma.employee.delete({
        where: { id: employeeId }
      })

      return {
        success: true,
        message: 'Funcionário excluído com sucesso'
      }

    } catch (error) {
      console.error('Erro ao excluir funcionário:', error)
      throw new Error(`Erro ao excluir funcionário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Lista funcionários com filtros
   */
  async listEmployees(filters: {
    search?: string
    role?: string
    status?: 'active' | 'inactive'
    department?: string
    page?: number
    limit?: number
  } = {}) {
    try {
      const {
        search,
        role,
        status,
        department,
        page = 1,
        limit = 20
      } = filters

      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (role) {
        where.role = role
      }

      if (status) {
        where.isActive = status === 'active'
      }

      if (department) {
        where.department = department
      }

      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.employee.count({ where })
      ])

      return {
        success: true,
        data: employees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      console.error('Erro ao listar funcionários:', error)
      throw new Error(`Erro ao listar funcionários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Busca funcionário por ID
   */
  async getEmployeeById(employeeId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      })

      if (!employee) {
        throw new Error('Funcionário não encontrado')
      }

      return {
        success: true,
        data: employee
      }

    } catch (error) {
      console.error('Erro ao buscar funcionário:', error)
      throw new Error(`Erro ao buscar funcionário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Busca funcionário por Clerk ID
   */
  async getEmployeeByClerkId(clerkId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { clerkId }
      })

      return employee

    } catch (error) {
      console.error('Erro ao buscar funcionário por Clerk ID:', error)
      return null
    }
  }

  /**
   * Atualiza último login do funcionário
   */
  async updateLastLogin(clerkId: string) {
    try {
      await prisma.employee.update({
        where: { clerkId },
        data: { lastLoginAt: new Date() }
      })
    } catch (error) {
      console.error('Erro ao atualizar último login:', error)
    }
  }

  /**
   * Obtém permissões padrão por cargo
   */
  private getDefaultPermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      'ADMIN': ['all'],
      'GERENTE_ADM': ['clientes', 'relatorios', 'ordens', 'funcionarios'],
      'GERENTE_FINANCEIRO': ['pagamentos', 'relatorios', 'clientes'],
      'SUPERVISOR_TECNICO': ['ordens', 'produtos', 'relatorios'],
      'TECNICO': ['ordens', 'produtos'],
      'ATENDENTE': ['clientes', 'ordens']
    }

    return permissions[role] || ['basic']
  }

  /**
   * Envia email de boas-vindas (implementar com seu provedor de email)
   */
  private async sendWelcomeEmail(email: string, name: string, password: string) {
    try {
      // TODO: Implementar envio de email
      console.log('Enviando email de boas-vindas:', {
        to: email,
        name,
        tempPassword: password
      })
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error)
    }
  }

  /**
   * Verifica se o usuário tem permissão específica
   */
  async hasPermission(clerkId: string, permission: string): Promise<boolean> {
    try {
      const employee = await this.getEmployeeByClerkId(clerkId)
      
      if (!employee || !employee.isActive) {
        return false
      }

      const permissions = employee.permissions as string[]
      
      // Admin tem todas as permissões
      if (permissions.includes('all')) {
        return true
      }

      return permissions.includes(permission)

    } catch (error) {
      console.error('Erro ao verificar permissão:', error)
      return false
    }
  }

  /**
   * Obtém estatísticas dos funcionários
   */
  async getEmployeeStats() {
    try {
      const [
        total,
        active,
        byRole,
        byDepartment,
        recentLogins
      ] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { isActive: true } }),
        prisma.employee.groupBy({
          by: ['role'],
          _count: { role: true }
        }),
        prisma.employee.groupBy({
          by: ['department'],
          _count: { department: true },
          where: { department: { not: null } }
        }),
        prisma.employee.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
            }
          }
        })
      ])

      return {
        success: true,
        data: {
          total,
          active,
          inactive: total - active,
          byRole: byRole.reduce((acc, item) => {
            acc[item.role] = item._count.role
            return acc
          }, {} as Record<string, number>),
          byDepartment: byDepartment.reduce((acc, item) => {
            if (item.department) {
              acc[item.department] = item._count.department
            }
            return acc
          }, {} as Record<string, number>),
          recentLogins
        }
      }

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw new Error(`Erro ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }
}

export const employeeService = new EmployeeService()