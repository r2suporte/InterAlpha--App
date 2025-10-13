/**
 * Componente de Proteção de Rota
 * Protege rotas com base em roles e permissões
 */

'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import {
  useAuth,
  useCanAccessResource,
  useHasPermission,
} from '@/hooks/use-permissions';
import { PermissionManager, UserRole } from '@/lib/auth/permissions';

/**
 * Componente de Proteção de Rota
 * Protege rotas com base em roles e permissões
 */

/**
 * Componente de Proteção de Rota
 * Protege rotas com base em roles e permissões
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  requiredResource?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredPermissions,
  requiredResource,
  fallback,
  redirectTo = '/login',
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const hasSpecificPermission = useHasPermission(requiredPermission || '');
  const canAccessSpecificResource = useCanAccessResource(
    requiredResource || ''
  );
  const router = useRouter();

  // Verificar autenticação
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [loading, isAuthenticated, router, redirectTo]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Se não autenticado, não renderizar nada (redirecionamento já foi feito)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Verificar role específica
  if (requiredRole && user.role !== requiredRole) {
    return showAccessDenied ? <AccessDenied /> : fallback || null;
  }

  // Verificar múltiplas roles
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return showAccessDenied ? <AccessDenied /> : fallback || null;
  }

  // Verificar permissão específica
  if (requiredPermission && !hasSpecificPermission) {
    return showAccessDenied ? <AccessDenied /> : fallback || null;
  }

  // Verificar múltiplas permissões
  if (
    requiredPermissions &&
    !requiredPermissions.every(permission =>
      PermissionManager.hasPermission(user.role, permission)
    )
  ) {
    return showAccessDenied ? <AccessDenied /> : fallback || null;
  }

  // Verificar acesso a recurso
  if (requiredResource && !canAccessSpecificResource) {
    return showAccessDenied ? <AccessDenied /> : fallback || null;
  }

  // Verificar hierarquia de roles (se o usuário tem nível suficiente)
  if (
    requiredRole &&
    PermissionManager.getRoleLevel(user.role) <
      PermissionManager.getRoleLevel(requiredRole)
  ) {
    return showAccessDenied ? <AccessDenied /> : fallback || null;
  }

  return <>{children}</>;
}

// Componente de acesso negado
function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Acesso Negado</h2>
        <p className="mb-6 text-gray-600">
          Você não tem permissão para acessar esta página.
        </p>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}

// Componentes de conveniência para roles específicas
export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      requiredRoles={['admin', 'diretor']}
      fallback={fallback}
      showAccessDenied={false}
    >
      {children}
    </ProtectedRoute>
  );
}

export function ManagerOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      requiredRoles={['admin', 'diretor', 'gerente_adm', 'gerente_financeiro']}
      fallback={fallback}
      showAccessDenied={false}
    >
      {children}
    </ProtectedRoute>
  );
}

export function TechnicianOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      requiredRole="technician"
      fallback={fallback}
      showAccessDenied={false}
    >
      {children}
    </ProtectedRoute>
  );
}

export function SupervisorOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      requiredRoles={['admin', 'diretor', 'gerente_adm', 'supervisor_tecnico']}
      fallback={fallback}
      showAccessDenied={false}
    >
      {children}
    </ProtectedRoute>
  );
}
