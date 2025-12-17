/**
 * Hook para Verificação de Permissões no Frontend
 * Fornece funcionalidades para verificar permissões baseadas em roles
 * Migrado para usar Clerk Auth
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useUser } from '@clerk/nextjs';

import {
  PermissionManager,
  ROLE_HIERARCHY,
  UserRole,
} from '@/lib/auth/permissions';

// Tipos para o contexto de permissões
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  roleLevel: number;
  roleDescription: string;
}

export interface PermissionsContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  canManageRole: (targetRole: UserRole) => boolean;
  canAccessResource: (resource: string) => boolean;
  getRoleLevel: () => number;
  getManageableRoles: () => UserRole[];
  getAllPermissions: () => string[];
  refreshUser: () => Promise<void>;
}

// Contexto de permissões
const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

// Provider de permissões
export function PermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para sincronizar dados do usuário do Clerk
  const syncUserData = useCallback(() => {
    try {
      if (!isLoaded) return;

      if (!clerkUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Obter role dos metadados públicos do Clerk
      // O middleware clerk-sync.ts garante que isso esteja lá, ou padrão 'user'
      const role = (clerkUser.publicMetadata?.role as string) || 'user';
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';

      // Validar role
      if (!PermissionManager.isValidRole(role)) {
        // Se a role for inválida, assume 'user' como fallback seguro, mas loga erro
        console.warn(`Role inválida encontrada: ${role}. Usando 'user'.`);
      }

      const validatedRole = PermissionManager.isValidRole(role)
        ? (role as UserRole)
        : 'user';

      const authenticatedUser: AuthenticatedUser = {
        id: clerkUser.id,
        email: email,
        role: validatedRole,
        roleLevel: PermissionManager.getRoleLevel(validatedRole),
        roleDescription: PermissionManager.getRoleDescription(validatedRole),
      };

      setUser(authenticatedUser);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido ao processar usuário';
      setError(errorMessage);
      console.error('Erro no PermissionsProvider:', err);
    } finally {
      if (isLoaded) {
        setLoading(false);
      }
    }
  }, [clerkUser, isLoaded]);

  // Sincronizar quando o hook do Clerk atualizar
  useEffect(() => {
    syncUserData();
  }, [syncUserData]);

  // Função para forçar atualização (re-sync com Clerk se necessário)
  const refreshUser = useCallback(async () => {
    await clerkUser?.reload();
    syncUserData();
  }, [clerkUser, syncUserData]);

  // Funções de verificação de permissões
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      return PermissionManager.hasPermission(user.role, permission);
    },
    [user]
  );

  const canManageRole = useCallback(
    (targetRole: UserRole): boolean => {
      if (!user) return false;
      return PermissionManager.canManageRole(user.role, targetRole);
    },
    [user]
  );

  const canAccessResource = useCallback(
    (resource: string): boolean => {
      if (!user) return false;
      return PermissionManager.canAccessResource(user.role, resource);
    },
    [user]
  );

  const getRoleLevel = useCallback((): number => {
    if (!user) return 0;
    return user.roleLevel;
  }, [user]);

  const getManageableRoles = useCallback((): UserRole[] => {
    if (!user) return [];
    return PermissionManager.getManageableRoles(user.role);
  }, [user]);

  const getAllPermissions = useCallback((): string[] => {
    if (!user) return [];
    return PermissionManager.getAllPermissions(user.role);
  }, [user]);

  const contextValue: PermissionsContextType = {
    user,
    loading,
    error,
    hasPermission,
    canManageRole,
    canAccessResource,
    getRoleLevel,
    getManageableRoles,
    getAllPermissions,
    refreshUser,
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook principal para usar permissões
export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error(
      'usePermissions deve ser usado dentro de um PermissionsProvider'
    );
  }
  return context;
}

// Hook simplificado para verificar autenticação
export function useAuth() {
  const { user, loading, error, refreshUser } = usePermissions();

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    refreshUser,
  };
}

// Hook para verificar permissões específicas
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

// Hook para verificar múltiplas permissões
export function useHasPermissions(permissions: string[]): boolean {
  const { hasPermission } = usePermissions();
  return permissions.every(permission => hasPermission(permission));
}

// Hook para verificar se pode gerenciar uma role
export function useCanManageRole(targetRole: UserRole): boolean {
  const { canManageRole } = usePermissions();
  return canManageRole(targetRole);
}

// Hook para verificar acesso a recursos
export function useCanAccessResource(resource: string): boolean {
  const { canAccessResource } = usePermissions();
  return canAccessResource(resource);
}

// Hook para obter informações da role atual
export function useRoleInfo() {
  const { user } = usePermissions();

  if (!user) {
    return {
      role: null,
      roleLevel: 0,
      roleDescription: '',
      manageableRoles: [],
      allPermissions: [],
    };
  }

  return {
    role: user.role,
    roleLevel: user.roleLevel,
    roleDescription: user.roleDescription,
    manageableRoles: PermissionManager.getManageableRoles(user.role),
    allPermissions: PermissionManager.getAllPermissions(user.role),
  };
}

// Hook para verificar se é admin ou diretor
export function useIsAdmin(): boolean {
  const { user } = usePermissions();
  return user?.role === 'admin' || user?.role === 'diretor';
}

// Hook para verificar se é gerente (qualquer tipo)
export function useIsManager(): boolean {
  const { user } = usePermissions();
  return (
    user?.role === 'gerente_adm' ||
    user?.role === 'gerente_financeiro' ||
    useIsAdmin()
  );
}

// Hook para verificar se é supervisor ou acima
export function useIsSupervisor(): boolean {
  const { user } = usePermissions();
  return user?.role === 'supervisor_tecnico' || useIsManager();
}

// Hook para verificar se é técnico
export function useIsTechnician(): boolean {
  const { user } = usePermissions();
  return user?.role === 'technician';
}

// Hook para verificar se é atendente
export function useIsAtendente(): boolean {
  const { user } = usePermissions();
  return user?.role === 'atendente';
}

// Hook para debug de permissões (apenas em desenvolvimento)
export function usePermissionsDebug() {
  const context = usePermissions();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return {
    ...context,
    roleHierarchy: ROLE_HIERARCHY,
    debugInfo: {
      userRole: context.user?.role,
      userLevel: context.user?.roleLevel,
      allPermissions: context.getAllPermissions(),
      manageableRoles: context.getManageableRoles(),
    },
  };
}

// Componente para renderização condicional baseada em permissões
export function PermissionGate({
  permission,
  permissions,
  role,
  roles,
  resource,
  fallback = null,
  children,
}: {
  permission?: string;
  permissions?: string[];
  role?: UserRole;
  roles?: UserRole[];
  resource?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, hasPermission, canAccessResource } = usePermissions();

  // Verificar role específica
  if (role && user?.role !== role) {
    return <>{fallback}</>;
  }

  // Verificar múltiplas roles
  if (roles && (!user || !roles.includes(user.role))) {
    return <>{fallback}</>;
  }

  // Verificar permissão específica
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Verificar múltiplas permissões (todas devem ser atendidas)
  if (permissions && !permissions.every(p => hasPermission(p))) {
    return <>{fallback}</>;
  }

  // Verificar acesso a recurso
  if (resource && !canAccessResource(resource)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componente para mostrar informações da role (apenas em desenvolvimento)
export function RoleDebugInfo() {
  const debug = usePermissionsDebug();

  if (!debug || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm rounded-lg bg-gray-800 p-4 text-xs text-white z-50 opacity-75 hover:opacity-100 transition-opacity">
      <h4 className="mb-2 font-bold">Debug - Permissões</h4>
      <p>
        <strong>Role:</strong> {debug.user?.role || 'N/A'}
      </p>
      <p>
        <strong>Nível:</strong> {debug.user?.roleLevel || 0}
      </p>
      <p>
        <strong>Permissões:</strong> {debug.getAllPermissions().length}
      </p>
      <p>
        <strong>Pode gerenciar:</strong> {debug.getManageableRoles().join(', ')}
      </p>
    </div>
  );
}
