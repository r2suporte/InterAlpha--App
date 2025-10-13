/**
 * Sistema de Permissões Hierárquico
 * Gerencia roles, permissões e hierarquia de acesso no sistema
 */

// Tipos de roles disponíveis no sistema
export type UserRole =
  | 'admin'
  | 'user'
  | 'technician'
  | 'atendente'
  | 'gerente_adm'
  | 'gerente_financeiro'
  | 'supervisor_tecnico'
  | 'diretor';

// Interface para definir uma permissão
export interface Permission {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// Interface para definir a hierarquia de roles
export interface RoleHierarchy {
  level: number;
  inheritsFrom?: UserRole[];
  description: string;
}

// Definição da hierarquia de roles (níveis de 1 a 10, onde 10 é o mais alto)
export const ROLE_HIERARCHY: Record<UserRole, RoleHierarchy> = {
  // Nível mais baixo - Usuários básicos
  user: {
    level: 1,
    description: 'Usuário básico do sistema',
  },

  // Nível operacional
  technician: {
    level: 2,
    inheritsFrom: ['user'],
    description: 'Técnico responsável pela execução de serviços',
  },

  atendente: {
    level: 3,
    inheritsFrom: ['user'],
    description: 'Atendente responsável pelo relacionamento com clientes',
  },

  // Nível de supervisão
  supervisor_tecnico: {
    level: 5,
    inheritsFrom: ['technician'],
    description: 'Supervisor técnico com gestão de equipe técnica',
  },

  // Nível gerencial
  gerente_financeiro: {
    level: 6,
    inheritsFrom: ['atendente'],
    description:
      'Gerente financeiro com controle sobre pagamentos e relatórios financeiros',
  },

  gerente_adm: {
    level: 7,
    inheritsFrom: ['atendente', 'supervisor_tecnico'],
    description:
      'Gerente administrativo com controle sobre operações e usuários',
  },

  // Nível executivo
  diretor: {
    level: 9,
    inheritsFrom: ['gerente_adm', 'gerente_financeiro'],
    description: 'Diretor com acesso total ao sistema',
  },

  // Nível de sistema (compatibilidade)
  admin: {
    level: 10,
    description: 'Administrador do sistema com acesso total',
  },
};

// Mapeamento de permissões por role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  // Usuário básico - acesso mínimo
  user: ['clientes.read', 'relatorios.view_basic'],

  // Técnico - foco em execução técnica
  technician: [
    'clientes.read',
    'ordens_servico.read',
    'ordens_servico.update',
    'ordens_servico.change_status',
    'pecas.read',
    'pecas.update',
    'relatorios.view_basic',
  ],

  // Atendente - foco em clientes e criação de OS
  atendente: [
    'clientes.create',
    'clientes.read',
    'clientes.update',
    'ordens_servico.create',
    'ordens_servico.read',
    'ordens_servico.update',
    'relatorios.view_basic',
  ],

  // Supervisor Técnico - gestão técnica
  supervisor_tecnico: [
    'clientes.read',
    'ordens_servico.*', // Wildcard para todas as permissões de OS
    'ordens_servico.assign_technician',
    'ordens_servico.change_status',
    'pecas.*', // Wildcard para todas as permissões de peças
    'relatorios.view_technical',
    'relatorios.view_basic',
  ],

  // Gerente Financeiro - foco financeiro
  gerente_financeiro: [
    'clientes.read',
    'ordens_servico.read',
    'ordens_servico.update',
    'pagamentos.*', // Wildcard para todas as permissões de pagamentos
    'relatorios.view_financial',
    'relatorios.view_basic',
    'relatorios.export',
  ],

  // Gerente Administrativo - gestão administrativa
  gerente_adm: [
    'clientes.*', // Wildcard para todas as permissões de clientes
    'ordens_servico.*',
    'admin.users.create',
    'admin.users.read',
    'admin.users.update',
    'admin.roles.manage',
    'relatorios.*', // Wildcard para todos os relatórios
    'pecas.read',
    'pecas.update',
  ],

  // Diretor - acesso quase total
  diretor: [
    '*', // Wildcard para todas as permissões
  ],

  // Admin - acesso total (compatibilidade)
  admin: [
    '*', // Wildcard para todas as permissões
  ],
};

/**
 * Classe para gerenciar permissões e hierarquia de roles
 */
export class PermissionManager {
  /**
   * Verifica se uma role possui uma permissão específica
   */
  static hasPermission(
    userRole: UserRole,
    requiredPermission: string
  ): boolean {
    // Validar entrada - strings vazias ou inválidas devem retornar false
    if (!requiredPermission || requiredPermission.trim() === '') {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

    // Verifica permissão direta
    if (rolePermissions.includes(requiredPermission)) {
      return true;
    }

    // Verifica wildcards
    for (const permission of rolePermissions) {
      if (permission === '*') {
        return true; // Acesso total
      }

      if (permission.endsWith('.*')) {
        const resource = permission.slice(0, -2);
        if (requiredPermission.startsWith(`${resource  }.`)) {
          return true;
        }
      }
    }

    // Verifica permissões herdadas
    const hierarchy = ROLE_HIERARCHY[userRole];
    if (hierarchy.inheritsFrom) {
      for (const inheritedRole of hierarchy.inheritsFrom) {
        if (this.hasPermission(inheritedRole, requiredPermission)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Obtém o nível hierárquico de uma role
   */
  static getRoleLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role]?.level || 0;
  }

  /**
   * Verifica se uma role pode gerenciar outra role
   */
  static canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    const managerLevel = this.getRoleLevel(managerRole);
    const targetLevel = this.getRoleLevel(targetRole);

    // Apenas roles de nível superior podem gerenciar roles de nível inferior
    return managerLevel > targetLevel;
  }

  /**
   * Obtém todas as permissões de uma role (incluindo herdadas)
   */
  static getAllPermissions(userRole: UserRole): string[] {
    const permissions = new Set<string>();

    // Adiciona permissões diretas
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    rolePermissions.forEach(permission => permissions.add(permission));

    // Adiciona permissões herdadas
    const hierarchy = ROLE_HIERARCHY[userRole];
    if (hierarchy.inheritsFrom) {
      for (const inheritedRole of hierarchy.inheritsFrom) {
        const inheritedPermissions = this.getAllPermissions(inheritedRole);
        inheritedPermissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Verifica se uma role pode acessar um recurso específico
   */
  static canAccessResource(userRole: UserRole, resource: string): boolean {
    const allPermissions = this.getAllPermissions(userRole);

    // Verifica acesso total
    if (allPermissions.includes('*')) {
      return true;
    }

    // Verifica wildcard do recurso
    if (allPermissions.includes(`${resource}.*`)) {
      return true;
    }

    // Verifica se tem pelo menos uma permissão do recurso
    return allPermissions.some(permission =>
      permission.startsWith(`${resource}.`)
    );
  }

  /**
   * Obtém as roles que um usuário pode gerenciar
   */
  static getManageableRoles(managerRole: UserRole): UserRole[] {
    const manageableRoles: UserRole[] = [];
    const allRoles: UserRole[] = [
      'user',
      'technician',
      'atendente',
      'supervisor_tecnico',
      'gerente_financeiro',
      'gerente_adm',
      'diretor',
      'admin',
    ];

    for (const role of allRoles) {
      if (this.canManageRole(managerRole, role)) {
        manageableRoles.push(role);
      }
    }

    return manageableRoles;
  }

  /**
   * Valida se uma role existe no sistema
   */
  static isValidRole(role: string): role is UserRole {
    return Object.keys(ROLE_HIERARCHY).includes(role);
  }

  /**
   * Obtém a descrição de uma role
   */
  static getRoleDescription(role: UserRole): string {
    return ROLE_HIERARCHY[role]?.description || 'Role não encontrada';
  }
}

// Constantes para facilitar o uso
export const RESOURCES = {
  CLIENTES: 'clientes',
  ORDENS_SERVICO: 'ordens_servico',
  PAGAMENTOS: 'pagamentos',
  RELATORIOS: 'relatorios',
  ADMIN: 'admin',
  PECAS: 'pecas',
} as const;

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  APPROVE: 'approve',
  ASSIGN_TECHNICIAN: 'assign_technician',
  CHANGE_STATUS: 'change_status',
  VIEW_BASIC: 'view_basic',
  VIEW_FINANCIAL: 'view_financial',
  VIEW_TECHNICAL: 'view_technical',
  VIEW_ALL: 'view_all',
  EXPORT: 'export',
} as const;

// Funções utilitárias para construir permissões
export const buildPermission = (resource: string, action: string): string => {
  return `${resource}.${action}`;
};

export const buildResourceWildcard = (resource: string): string => {
  return `${resource}.*`;
};

// Exportar tipos para uso em outros arquivos
export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];
export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];
