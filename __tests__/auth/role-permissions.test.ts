import { PermissionManager, UserRole } from '@/lib/auth/permissions'

describe('PermissionManager', () => {
  describe('hasPermission', () => {
    it('should grant admin access to all permissions', () => {
      expect(PermissionManager.hasPermission('admin', 'admin.users.create')).toBe(true)
      expect(PermissionManager.hasPermission('admin', 'ordens_servico.delete')).toBe(true)
      expect(PermissionManager.hasPermission('admin', 'pagamentos.view')).toBe(true)
      expect(PermissionManager.hasPermission('admin', 'relatorios.export')).toBe(true)
    })

    it('should restrict technician permissions correctly', () => {
      // Technician should have access to orders
      expect(PermissionManager.hasPermission('technician', 'ordens_servico.read')).toBe(true)
      expect(PermissionManager.hasPermission('technician', 'ordens_servico.update')).toBe(true)
      
      // Technician should NOT have access to user management
      expect(PermissionManager.hasPermission('technician', 'admin.users.create')).toBe(false)
      expect(PermissionManager.hasPermission('technician', 'admin.users.delete')).toBe(false)
      
      // Technician should NOT have access to financial data
      expect(PermissionManager.hasPermission('technician', 'pagamentos.view')).toBe(false)
      expect(PermissionManager.hasPermission('technician', 'pagamentos.create')).toBe(false)
    })

    it('should handle gerente_adm permissions correctly', () => {
      // Gerente administrativo should have access to most operations
      expect(PermissionManager.hasPermission('gerente_adm', 'ordens_servico.read')).toBe(true)
      expect(PermissionManager.hasPermission('gerente_adm', 'ordens_servico.create')).toBe(true)
      expect(PermissionManager.hasPermission('gerente_adm', 'clientes.read')).toBe(true)
      expect(PermissionManager.hasPermission('gerente_adm', 'admin.users.create')).toBe(true)
      
      // Gerente administrativo should NOT have full admin access
      expect(PermissionManager.hasPermission('gerente_adm', 'admin.system.config')).toBe(false)
    })

    it('should handle supervisor_tecnico permissions correctly', () => {
      // Supervisor técnico should have access to orders and clients
      expect(PermissionManager.hasPermission('supervisor_tecnico', 'ordens_servico.read')).toBe(true)
      expect(PermissionManager.hasPermission('supervisor_tecnico', 'ordens_servico.assign_technician')).toBe(true)
      expect(PermissionManager.hasPermission('supervisor_tecnico', 'clientes.read')).toBe(true)
      
      // Supervisor técnico should NOT have access to user management
      expect(PermissionManager.hasPermission('supervisor_tecnico', 'admin.users.create')).toBe(false)
      expect(PermissionManager.hasPermission('supervisor_tecnico', 'admin.users.update')).toBe(false)
    })

    it('should handle atendente permissions correctly', () => {
      // Atendente should have basic access
      expect(PermissionManager.hasPermission('atendente', 'ordens_servico.read')).toBe(true)
      expect(PermissionManager.hasPermission('atendente', 'clientes.read')).toBe(true)
      expect(PermissionManager.hasPermission('atendente', 'clientes.create')).toBe(true)
      
      // Atendente should NOT be able to delete orders
      expect(PermissionManager.hasPermission('atendente', 'ordens_servico.delete')).toBe(false)
      
      // Atendente should NOT have access to financial management
      expect(PermissionManager.hasPermission('atendente', 'pagamentos.create')).toBe(false)
    })

    it('should handle wildcard permissions correctly', () => {
      // Admin should have wildcard access
      expect(PermissionManager.hasPermission('admin', 'any.permission')).toBe(true)
      
      // Supervisor técnico should have wildcard access to orders
      expect(PermissionManager.hasPermission('supervisor_tecnico', 'ordens_servico.any_action')).toBe(true)
      
      // Technician should NOT have wildcard access to admin
      expect(PermissionManager.hasPermission('technician', 'admin.any_action')).toBe(false)
    })
  })

  describe('getRoleLevel', () => {
    it('should return correct role levels', () => {
      expect(PermissionManager.getRoleLevel('user')).toBe(1)
      expect(PermissionManager.getRoleLevel('technician')).toBe(2)
      expect(PermissionManager.getRoleLevel('atendente')).toBe(3)
      expect(PermissionManager.getRoleLevel('supervisor_tecnico')).toBe(5)
      expect(PermissionManager.getRoleLevel('gerente_financeiro')).toBe(6)
      expect(PermissionManager.getRoleLevel('gerente_adm')).toBe(7)
      expect(PermissionManager.getRoleLevel('diretor')).toBe(9)
      expect(PermissionManager.getRoleLevel('admin')).toBe(10)
    })
  })

  describe('canManageRole', () => {
    it('should allow higher level roles to manage lower level roles', () => {
      expect(PermissionManager.canManageRole('admin', 'user')).toBe(true)
      expect(PermissionManager.canManageRole('diretor', 'gerente_adm')).toBe(true)
      expect(PermissionManager.canManageRole('gerente_adm', 'technician')).toBe(true)
      expect(PermissionManager.canManageRole('supervisor_tecnico', 'user')).toBe(true)
    })

    it('should not allow lower level roles to manage higher level roles', () => {
      expect(PermissionManager.canManageRole('user', 'admin')).toBe(false)
      expect(PermissionManager.canManageRole('technician', 'gerente_adm')).toBe(false)
      expect(PermissionManager.canManageRole('atendente', 'supervisor_tecnico')).toBe(false)
    })

    it('should not allow same level roles to manage each other', () => {
      expect(PermissionManager.canManageRole('technician', 'technician')).toBe(false)
      expect(PermissionManager.canManageRole('atendente', 'atendente')).toBe(false)
    })
  })

  describe('canAccessResource', () => {
    it('should allow admin access to all resources', () => {
      expect(PermissionManager.canAccessResource('admin', 'clientes')).toBe(true)
      expect(PermissionManager.canAccessResource('admin', 'ordens_servico')).toBe(true)
      expect(PermissionManager.canAccessResource('admin', 'pagamentos')).toBe(true)
      expect(PermissionManager.canAccessResource('admin', 'admin')).toBe(true)
    })

    it('should restrict technician resource access', () => {
      expect(PermissionManager.canAccessResource('technician', 'ordens_servico')).toBe(true)
      expect(PermissionManager.canAccessResource('technician', 'clientes')).toBe(true)
      expect(PermissionManager.canAccessResource('technician', 'pagamentos')).toBe(false)
      expect(PermissionManager.canAccessResource('technician', 'admin')).toBe(false)
    })

    it('should handle supervisor_tecnico resource access', () => {
      expect(PermissionManager.canAccessResource('supervisor_tecnico', 'ordens_servico')).toBe(true)
      expect(PermissionManager.canAccessResource('supervisor_tecnico', 'pecas')).toBe(true)
      expect(PermissionManager.canAccessResource('supervisor_tecnico', 'clientes')).toBe(true)
      expect(PermissionManager.canAccessResource('supervisor_tecnico', 'admin')).toBe(false)
    })
  })

  describe('getManageableRoles', () => {
    it('should return correct manageable roles for admin', () => {
      const manageableRoles = PermissionManager.getManageableRoles('admin')
      expect(manageableRoles).toContain('user')
      expect(manageableRoles).toContain('technician')
      expect(manageableRoles).toContain('atendente')
      expect(manageableRoles).toContain('supervisor_tecnico')
      expect(manageableRoles).toContain('gerente_adm')
      expect(manageableRoles).toContain('diretor')
    })

    it('should return correct manageable roles for gerente_adm', () => {
      const manageableRoles = PermissionManager.getManageableRoles('gerente_adm')
      expect(manageableRoles).toContain('user')
      expect(manageableRoles).toContain('technician')
      expect(manageableRoles).toContain('atendente')
      expect(manageableRoles).toContain('supervisor_tecnico')
      expect(manageableRoles).not.toContain('diretor')
      expect(manageableRoles).not.toContain('admin')
    })

    it('should return empty array for user role', () => {
      const manageableRoles = PermissionManager.getManageableRoles('user')
      expect(manageableRoles).toEqual([])
    })
  })

  describe('isValidRole', () => {
    it('should validate correct roles', () => {
      expect(PermissionManager.isValidRole('admin')).toBe(true)
      expect(PermissionManager.isValidRole('user')).toBe(true)
      expect(PermissionManager.isValidRole('technician')).toBe(true)
      expect(PermissionManager.isValidRole('atendente')).toBe(true)
      expect(PermissionManager.isValidRole('supervisor_tecnico')).toBe(true)
      expect(PermissionManager.isValidRole('gerente_adm')).toBe(true)
      expect(PermissionManager.isValidRole('gerente_financeiro')).toBe(true)
      expect(PermissionManager.isValidRole('diretor')).toBe(true)
    })

    it('should reject invalid roles', () => {
      expect(PermissionManager.isValidRole('invalid_role')).toBe(false)
      expect(PermissionManager.isValidRole('manager')).toBe(false)
      expect(PermissionManager.isValidRole('supervisor')).toBe(false)
      expect(PermissionManager.isValidRole('')).toBe(false)
    })
  })

  describe('getRoleDescription', () => {
    it('should return correct descriptions for roles', () => {
      expect(PermissionManager.getRoleDescription('admin')).toBe('Administrador do sistema com acesso total')
      expect(PermissionManager.getRoleDescription('user')).toBe('Usuário básico do sistema')
      expect(PermissionManager.getRoleDescription('technician')).toBe('Técnico responsável pela execução de serviços')
      expect(PermissionManager.getRoleDescription('atendente')).toBe('Atendente responsável pelo relacionamento com clientes')
      expect(PermissionManager.getRoleDescription('supervisor_tecnico')).toBe('Supervisor técnico com gestão de equipe técnica')
      expect(PermissionManager.getRoleDescription('gerente_adm')).toBe('Gerente administrativo com controle sobre operações e usuários')
      expect(PermissionManager.getRoleDescription('diretor')).toBe('Diretor com acesso total ao sistema')
    })
  })

  describe('Role Hierarchy Integration', () => {
    it('should respect role inheritance for permissions', () => {
      // Supervisor técnico herda de technician
      expect(PermissionManager.hasPermission('supervisor_tecnico', 'ordens_servico.read')).toBe(true)
      expect(PermissionManager.hasPermission('supervisor_tecnico', 'clientes.read')).toBe(true)
      
      // Gerente administrativo herda de atendente e supervisor_tecnico
      expect(PermissionManager.hasPermission('gerente_adm', 'clientes.create')).toBe(true)
      expect(PermissionManager.hasPermission('gerente_adm', 'ordens_servico.read')).toBe(true)
      
      // Diretor herda de gerente_adm e gerente_financeiro
      expect(PermissionManager.hasPermission('diretor', 'admin.users.create')).toBe(true)
      expect(PermissionManager.hasPermission('diretor', 'pagamentos.view')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty permission strings', () => {
      expect(PermissionManager.hasPermission('admin', '')).toBe(false)
      expect(PermissionManager.hasPermission('user', '')).toBe(false)
    })

    it('should handle malformed permission strings', () => {
      expect(PermissionManager.hasPermission('admin', 'invalid')).toBe(true) // Admin has wildcard
      expect(PermissionManager.hasPermission('user', 'invalid.permission')).toBe(false)
    })

    it('should handle case sensitivity', () => {
      expect(PermissionManager.hasPermission('technician', 'ORDENS_SERVICO.READ')).toBe(false)
      expect(PermissionManager.hasPermission('technician', 'ordens_servico.READ')).toBe(false)
      expect(PermissionManager.hasPermission('technician', 'ordens_servico.read')).toBe(true)
    })
  })
})