/**
 * Testes para o Sistema de Permissões Hierárquico
 * Testa roles, permissões, hierarquia e herança de acesso
 */

import {
  PermissionManager,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  RESOURCES,
  ACTIONS,
  buildPermission,
  buildResourceWildcard,
  UserRole,
} from '@/lib/auth/permissions';

describe('Sistema de Permissões', () => {
  describe('ROLE_HIERARCHY', () => {
    it('deve ter todas as roles definidas com níveis corretos', () => {
      expect(ROLE_HIERARCHY.user.level).toBe(1);
      expect(ROLE_HIERARCHY.technician.level).toBe(2);
      expect(ROLE_HIERARCHY.atendente.level).toBe(3);
      expect(ROLE_HIERARCHY.supervisor_tecnico.level).toBe(5);
      expect(ROLE_HIERARCHY.gerente_financeiro.level).toBe(6);
      expect(ROLE_HIERARCHY.gerente_adm.level).toBe(7);
      expect(ROLE_HIERARCHY.diretor.level).toBe(9);
      expect(ROLE_HIERARCHY.admin.level).toBe(10);
    });

    it('deve ter herança correta definida', () => {
      expect(ROLE_HIERARCHY.technician.inheritsFrom).toEqual(['user']);
      expect(ROLE_HIERARCHY.atendente.inheritsFrom).toEqual(['user']);
      expect(ROLE_HIERARCHY.supervisor_tecnico.inheritsFrom).toEqual(['technician']);
      expect(ROLE_HIERARCHY.gerente_financeiro.inheritsFrom).toEqual(['atendente']);
      expect(ROLE_HIERARCHY.gerente_adm.inheritsFrom).toEqual(['atendente', 'supervisor_tecnico']);
      expect(ROLE_HIERARCHY.diretor.inheritsFrom).toEqual(['gerente_adm', 'gerente_financeiro']);
    });

    it('deve ter descrições para todas as roles', () => {
      Object.values(ROLE_HIERARCHY).forEach(role => {
        expect(role.description).toBeDefined();
        expect(role.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('deve ter permissões definidas para todas as roles', () => {
      const roles: UserRole[] = ['user', 'technician', 'atendente', 'supervisor_tecnico', 'gerente_financeiro', 'gerente_adm', 'diretor', 'admin'];
      
      roles.forEach(role => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('deve ter permissões wildcard para roles superiores', () => {
      expect(ROLE_PERMISSIONS.diretor).toContain('*');
      expect(ROLE_PERMISSIONS.admin).toContain('*');
      expect(ROLE_PERMISSIONS.supervisor_tecnico).toContain('ordens_servico.*');
      expect(ROLE_PERMISSIONS.gerente_financeiro).toContain('pagamentos.*');
    });
  });

  describe('PermissionManager.hasPermission', () => {
    describe('Permissões diretas', () => {
      it('deve permitir acesso a permissões diretas', () => {
        expect(PermissionManager.hasPermission('user', 'clientes.read')).toBe(true);
        expect(PermissionManager.hasPermission('technician', 'ordens_servico.read')).toBe(true);
        expect(PermissionManager.hasPermission('atendente', 'clientes.create')).toBe(true);
      });

      it('deve negar acesso a permissões não possuídas', () => {
        expect(PermissionManager.hasPermission('user', 'clientes.create')).toBe(false);
        expect(PermissionManager.hasPermission('technician', 'admin.users.create')).toBe(false);
      });
    });

    describe('Permissões wildcard', () => {
      it('deve permitir acesso total com wildcard *', () => {
        expect(PermissionManager.hasPermission('admin', 'qualquer.permissao')).toBe(true);
        expect(PermissionManager.hasPermission('diretor', 'nova.funcionalidade')).toBe(true);
      });

      it('deve permitir acesso a recursos com wildcard específico', () => {
        expect(PermissionManager.hasPermission('supervisor_tecnico', 'ordens_servico.delete')).toBe(true);
        expect(PermissionManager.hasPermission('supervisor_tecnico', 'pecas.create')).toBe(true);
        expect(PermissionManager.hasPermission('gerente_financeiro', 'pagamentos.approve')).toBe(true);
      });

      it('deve negar acesso a recursos fora do wildcard', () => {
        expect(PermissionManager.hasPermission('supervisor_tecnico', 'admin.users.create')).toBe(false);
        expect(PermissionManager.hasPermission('gerente_financeiro', 'admin.roles.manage')).toBe(false);
      });
    });

    describe('Herança de permissões', () => {
      it('deve herdar permissões de roles pai', () => {
        // Technician herda de user
        expect(PermissionManager.hasPermission('technician', 'clientes.read')).toBe(true);
        expect(PermissionManager.hasPermission('technician', 'relatorios.view_basic')).toBe(true);
        
        // Atendente herda de user
        expect(PermissionManager.hasPermission('atendente', 'clientes.read')).toBe(true);
        expect(PermissionManager.hasPermission('atendente', 'relatorios.view_basic')).toBe(true);
      });

      it('deve herdar permissões de múltiplas roles pai', () => {
        // Gerente_adm herda de atendente e supervisor_tecnico
        expect(PermissionManager.hasPermission('gerente_adm', 'clientes.read')).toBe(true); // de user via atendente
        expect(PermissionManager.hasPermission('gerente_adm', 'ordens_servico.read')).toBe(true); // de technician via supervisor_tecnico
      });

      it('deve herdar permissões em cadeia', () => {
        // Diretor herda de gerente_adm que herda de atendente que herda de user
        expect(PermissionManager.hasPermission('diretor', 'clientes.read')).toBe(true);
        expect(PermissionManager.hasPermission('diretor', 'relatorios.view_basic')).toBe(true);
      });
    });

    describe('Validação de entrada', () => {
      it('deve retornar false para permissões vazias ou inválidas', () => {
        expect(PermissionManager.hasPermission('user', '')).toBe(false);
        expect(PermissionManager.hasPermission('user', '   ')).toBe(false);
      });

      it('deve lidar com roles inexistentes', () => {
        // @ts-ignore - testando comportamento com role inválida
        expect(() => PermissionManager.hasPermission('role_inexistente', 'clientes.read')).toThrow();
      });
    });
  });

  describe('PermissionManager.getRoleLevel', () => {
    it('deve retornar o nível correto para cada role', () => {
      expect(PermissionManager.getRoleLevel('user')).toBe(1);
      expect(PermissionManager.getRoleLevel('technician')).toBe(2);
      expect(PermissionManager.getRoleLevel('atendente')).toBe(3);
      expect(PermissionManager.getRoleLevel('supervisor_tecnico')).toBe(5);
      expect(PermissionManager.getRoleLevel('gerente_financeiro')).toBe(6);
      expect(PermissionManager.getRoleLevel('gerente_adm')).toBe(7);
      expect(PermissionManager.getRoleLevel('diretor')).toBe(9);
      expect(PermissionManager.getRoleLevel('admin')).toBe(10);
    });

    it('deve retornar 0 para roles inexistentes', () => {
      // @ts-ignore - testando comportamento com role inválida
      expect(PermissionManager.getRoleLevel('role_inexistente')).toBe(0);
    });
  });

  describe('PermissionManager.canManageRole', () => {
    it('deve permitir que roles superiores gerenciem roles inferiores', () => {
      expect(PermissionManager.canManageRole('admin', 'diretor')).toBe(true);
      expect(PermissionManager.canManageRole('diretor', 'gerente_adm')).toBe(true);
      expect(PermissionManager.canManageRole('gerente_adm', 'atendente')).toBe(true);
      expect(PermissionManager.canManageRole('supervisor_tecnico', 'technician')).toBe(true);
    });

    it('deve negar que roles inferiores gerenciem roles superiores', () => {
      expect(PermissionManager.canManageRole('user', 'technician')).toBe(false);
      expect(PermissionManager.canManageRole('technician', 'supervisor_tecnico')).toBe(false);
      expect(PermissionManager.canManageRole('atendente', 'gerente_adm')).toBe(false);
    });

    it('deve negar que roles do mesmo nível se gerenciem', () => {
      expect(PermissionManager.canManageRole('technician', 'technician')).toBe(false);
      expect(PermissionManager.canManageRole('atendente', 'atendente')).toBe(false);
    });
  });

  describe('PermissionManager.getAllPermissions', () => {
    it('deve retornar todas as permissões diretas e herdadas', () => {
      const technicianPermissions = PermissionManager.getAllPermissions('technician');
      
      // Permissões diretas do technician
      expect(technicianPermissions).toContain('ordens_servico.read');
      expect(technicianPermissions).toContain('ordens_servico.update');
      
      // Permissões herdadas do user
      expect(technicianPermissions).toContain('clientes.read');
      expect(technicianPermissions).toContain('relatorios.view_basic');
    });

    it('deve evitar duplicatas de permissões', () => {
      const permissions = PermissionManager.getAllPermissions('atendente');
      const uniquePermissions = [...new Set(permissions)];
      
      expect(permissions.length).toBe(uniquePermissions.length);
    });

    it('deve incluir permissões de herança múltipla', () => {
      const gerenteAdmPermissions = PermissionManager.getAllPermissions('gerente_adm');
      
      // De atendente (que herda de user)
      expect(gerenteAdmPermissions).toContain('clientes.read');
      expect(gerenteAdmPermissions).toContain('ordens_servico.create');
      
      // De supervisor_tecnico (que herda de technician que herda de user)
      expect(gerenteAdmPermissions).toContain('ordens_servico.change_status');
      expect(gerenteAdmPermissions).toContain('pecas.read');
    });
  });

  describe('PermissionManager.canAccessResource', () => {
    it('deve permitir acesso com wildcard total', () => {
      expect(PermissionManager.canAccessResource('admin', 'qualquer_recurso')).toBe(true);
      expect(PermissionManager.canAccessResource('diretor', 'novo_recurso')).toBe(true);
    });

    it('deve permitir acesso com wildcard de recurso', () => {
      expect(PermissionManager.canAccessResource('supervisor_tecnico', 'ordens_servico')).toBe(true);
      expect(PermissionManager.canAccessResource('supervisor_tecnico', 'pecas')).toBe(true);
      expect(PermissionManager.canAccessResource('gerente_financeiro', 'pagamentos')).toBe(true);
    });

    it('deve permitir acesso com permissões específicas do recurso', () => {
      expect(PermissionManager.canAccessResource('user', 'clientes')).toBe(true);
      expect(PermissionManager.canAccessResource('technician', 'ordens_servico')).toBe(true);
    });

    it('deve negar acesso a recursos sem permissões', () => {
      expect(PermissionManager.canAccessResource('user', 'admin')).toBe(false);
      expect(PermissionManager.canAccessResource('technician', 'pagamentos')).toBe(false);
    });
  });

  describe('PermissionManager.getManageableRoles', () => {
    it('deve retornar roles que podem ser gerenciadas', () => {
      const adminManageable = PermissionManager.getManageableRoles('admin');
      expect(adminManageable).toContain('diretor');
      expect(adminManageable).toContain('gerente_adm');
      expect(adminManageable).toContain('user');
      expect(adminManageable).not.toContain('admin');

      const gerenteManageable = PermissionManager.getManageableRoles('gerente_adm');
      expect(gerenteManageable).toContain('atendente');
      expect(gerenteManageable).toContain('technician');
      expect(gerenteManageable).toContain('user');
      expect(gerenteManageable).not.toContain('diretor');
      expect(gerenteManageable).not.toContain('gerente_adm');
    });

    it('deve retornar array vazio para role de nível mais baixo', () => {
      const userManageable = PermissionManager.getManageableRoles('user');
      expect(userManageable).toEqual([]);
    });
  });

  describe('PermissionManager.isValidRole', () => {
    it('deve validar roles existentes', () => {
      expect(PermissionManager.isValidRole('user')).toBe(true);
      expect(PermissionManager.isValidRole('admin')).toBe(true);
      expect(PermissionManager.isValidRole('technician')).toBe(true);
      expect(PermissionManager.isValidRole('diretor')).toBe(true);
    });

    it('deve invalidar roles inexistentes', () => {
      expect(PermissionManager.isValidRole('role_inexistente')).toBe(false);
      expect(PermissionManager.isValidRole('superuser')).toBe(false);
      expect(PermissionManager.isValidRole('')).toBe(false);
    });
  });

  describe('PermissionManager.getRoleDescription', () => {
    it('deve retornar descrição correta para roles existentes', () => {
      expect(PermissionManager.getRoleDescription('user')).toBe('Usuário básico do sistema');
      expect(PermissionManager.getRoleDescription('admin')).toBe('Administrador do sistema com acesso total');
      expect(PermissionManager.getRoleDescription('technician')).toBe('Técnico responsável pela execução de serviços');
    });

    it('deve retornar mensagem padrão para roles inexistentes', () => {
      // @ts-ignore - testando comportamento com role inválida
      expect(PermissionManager.getRoleDescription('role_inexistente')).toBe('Role não encontrada');
    });
  });

  describe('Constantes RESOURCES e ACTIONS', () => {
    it('deve ter todos os recursos definidos', () => {
      expect(RESOURCES.CLIENTES).toBe('clientes');
      expect(RESOURCES.ORDENS_SERVICO).toBe('ordens_servico');
      expect(RESOURCES.PAGAMENTOS).toBe('pagamentos');
      expect(RESOURCES.RELATORIOS).toBe('relatorios');
      expect(RESOURCES.ADMIN).toBe('admin');
      expect(RESOURCES.PECAS).toBe('pecas');
    });

    it('deve ter todas as ações definidas', () => {
      expect(ACTIONS.CREATE).toBe('create');
      expect(ACTIONS.READ).toBe('read');
      expect(ACTIONS.UPDATE).toBe('update');
      expect(ACTIONS.DELETE).toBe('delete');
      expect(ACTIONS.MANAGE).toBe('manage');
      expect(ACTIONS.APPROVE).toBe('approve');
      expect(ACTIONS.ASSIGN_TECHNICIAN).toBe('assign_technician');
      expect(ACTIONS.CHANGE_STATUS).toBe('change_status');
      expect(ACTIONS.VIEW_BASIC).toBe('view_basic');
      expect(ACTIONS.VIEW_FINANCIAL).toBe('view_financial');
      expect(ACTIONS.VIEW_TECHNICAL).toBe('view_technical');
      expect(ACTIONS.VIEW_ALL).toBe('view_all');
      expect(ACTIONS.EXPORT).toBe('export');
    });
  });

  describe('Funções utilitárias', () => {
    describe('buildPermission', () => {
      it('deve construir permissões corretamente', () => {
        expect(buildPermission('clientes', 'read')).toBe('clientes.read');
        expect(buildPermission('ordens_servico', 'create')).toBe('ordens_servico.create');
        expect(buildPermission('admin', 'manage')).toBe('admin.manage');
      });
    });

    describe('buildResourceWildcard', () => {
      it('deve construir wildcards de recursos corretamente', () => {
        expect(buildResourceWildcard('clientes')).toBe('clientes.*');
        expect(buildResourceWildcard('ordens_servico')).toBe('ordens_servico.*');
        expect(buildResourceWildcard('pagamentos')).toBe('pagamentos.*');
      });
    });
  });

  describe('Cenários de Integração', () => {
    it('deve funcionar em cenário completo de verificação de permissões', () => {
      // Cenário: Técnico tentando acessar diferentes recursos
      const technicianRole: UserRole = 'technician';
      
      // Deve ter acesso a recursos permitidos
      expect(PermissionManager.hasPermission(technicianRole, 'clientes.read')).toBe(true);
      expect(PermissionManager.hasPermission(technicianRole, 'ordens_servico.update')).toBe(true);
      expect(PermissionManager.hasPermission(technicianRole, 'pecas.read')).toBe(true);
      
      // Não deve ter acesso a recursos administrativos
      expect(PermissionManager.hasPermission(technicianRole, 'admin.users.create')).toBe(false);
      expect(PermissionManager.hasPermission(technicianRole, 'pagamentos.approve')).toBe(false);
      
      // Deve herdar permissões do user
      expect(PermissionManager.hasPermission(technicianRole, 'relatorios.view_basic')).toBe(true);
    });

    it('deve funcionar em cenário de gestão hierárquica', () => {
      // Cenário: Gerente administrativo gerenciando equipe
      const gerenteRole: UserRole = 'gerente_adm';
      
      // Deve poder gerenciar roles inferiores
      expect(PermissionManager.canManageRole(gerenteRole, 'atendente')).toBe(true);
      expect(PermissionManager.canManageRole(gerenteRole, 'technician')).toBe(true);
      expect(PermissionManager.canManageRole(gerenteRole, 'user')).toBe(true);
      
      // Não deve poder gerenciar roles superiores
      expect(PermissionManager.canManageRole(gerenteRole, 'diretor')).toBe(false);
      expect(PermissionManager.canManageRole(gerenteRole, 'admin')).toBe(false);
      
      // Deve ter acesso a recursos administrativos
      expect(PermissionManager.canAccessResource(gerenteRole, 'admin')).toBe(true);
      expect(PermissionManager.canAccessResource(gerenteRole, 'clientes')).toBe(true);
      expect(PermissionManager.canAccessResource(gerenteRole, 'ordens_servico')).toBe(true);
    });

    it('deve funcionar em cenário de herança múltipla', () => {
      // Cenário: Diretor com herança de múltiplas roles
      const diretorRole: UserRole = 'diretor';
      
      // Deve ter acesso total via wildcard
      expect(PermissionManager.hasPermission(diretorRole, 'qualquer.permissao')).toBe(true);
      expect(PermissionManager.hasPermission(diretorRole, 'nova.funcionalidade')).toBe(true);
      
      // Deve poder gerenciar todas as outras roles
      const manageableRoles = PermissionManager.getManageableRoles(diretorRole);
      expect(manageableRoles).toContain('gerente_adm');
      expect(manageableRoles).toContain('gerente_financeiro');
      expect(manageableRoles).toContain('supervisor_tecnico');
      expect(manageableRoles).toContain('atendente');
      expect(manageableRoles).toContain('technician');
      expect(manageableRoles).toContain('user');
      expect(manageableRoles).not.toContain('diretor');
      expect(manageableRoles).not.toContain('admin');
    });
  });
});