/**
 * Componente para proteger conteúdo baseado em permissões
 */

'use client'

import { ReactNode } from 'react'
import { useEmployee } from '@/hooks/use-employee'
import { Permission, EmployeeRole } from '@/lib/auth/permissions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock } from 'lucide-react'

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission
  role?: EmployeeRole
  roles?: EmployeeRole[]
  fallback?: ReactNode
  showError?: boolean
}

export function PermissionGuard({
  children,
  permission,
  role,
  roles,
  fallback,
  showError = true
}: PermissionGuardProps) {
  const { employee, loading, hasPermission } = useEmployee()

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se não há funcionário logado
  if (!employee) {
    if (fallback) return <>{fallback}</>
    
    if (showError) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Você precisa estar logado para acessar este conteúdo.
          </AlertDescription>
        </Alert>
      )
    }
    
    return null
  }

  // Verificar permissão específica
  if (permission && !hasPermission(permission)) {
    if (fallback) return <>{fallback}</>
    
    if (showError) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Você não tem permissão para acessar este conteúdo.
          </AlertDescription>
        </Alert>
      )
    }
    
    return null
  }

  // Verificar role específico
  if (role && employee.role !== role) {
    if (fallback) return <>{fallback}</>
    
    if (showError) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Este conteúdo é restrito ao cargo: {role}
          </AlertDescription>
        </Alert>
      )
    }
    
    return null
  }

  // Verificar múltiplos roles
  if (roles && !roles.includes(employee.role)) {
    if (fallback) return <>{fallback}</>
    
    if (showError) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Este conteúdo é restrito a cargos específicos.
          </AlertDescription>
        </Alert>
      )
    }
    
    return null
  }

  // Se passou em todas as verificações, mostrar o conteúdo
  return <>{children}</>
}

// Componente para mostrar conteúdo apenas para admins
export function AdminOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <PermissionGuard
      roles={[EmployeeRole.ADMIN, EmployeeRole.GERENTE_ADM]}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

// Componente para mostrar conteúdo baseado em permissão
export function RequirePermission({ 
  children, 
  permission, 
  fallback 
}: { 
  children: ReactNode
  permission: Permission
  fallback?: ReactNode 
}) {
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}