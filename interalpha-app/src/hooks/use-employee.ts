/**
 * Hook para gerenciar dados do funcionário logado
 */

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { EmployeeRole, hasPermission, Permission, ROLE_LABELS } from '@/lib/auth/permissions'

export interface EmployeeData {
  id: string
  clerkId: string
  name: string
  email: string
  role: EmployeeRole
  department?: string
  avatar?: string
  isActive: boolean
  permissions: Permission[]
  lastLoginAt?: Date
}

export function useEmployee() {
  const { user, isLoaded } = useUser()
  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEmployeeData() {
      if (!isLoaded || !user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Buscar dados do funcionário na API
        const response = await fetch('/api/auth/me')
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados do funcionário')
        }

        const data = await response.json()
        
        if (data.success) {
          setEmployee(data.employee)
        } else {
          throw new Error(data.error || 'Funcionário não encontrado')
        }
      } catch (err) {
        console.error('Erro ao carregar funcionário:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setEmployee(null)
      } finally {
        setLoading(false)
      }
    }

    loadEmployeeData()
  }, [user, isLoaded])

  // Funções utilitárias
  const hasPermissionCheck = (permission: Permission): boolean => {
    if (!employee) return false
    return hasPermission(employee.role, permission)
  }

  const getRoleLabel = (): string => {
    if (!employee) return ''
    return ROLE_LABELS[employee.role] || employee.role
  }

  const getInitials = (): string => {
    if (!employee) return ''
    return employee.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarUrl = (): string => {
    if (employee?.avatar) return employee.avatar
    if (user?.imageUrl) return user.imageUrl
    return ''
  }

  return {
    employee,
    loading,
    error,
    isLoaded: isLoaded && !loading,
    
    // Dados formatados
    displayName: employee?.name || user?.fullName || '',
    email: employee?.email || user?.emailAddresses?.[0]?.emailAddress || '',
    roleLabel: getRoleLabel(),
    initials: getInitials(),
    avatarUrl: getAvatarUrl(),
    
    // Verificações de permissão
    hasPermission: hasPermissionCheck,
    isAdmin: employee ? [EmployeeRole.ADMIN, EmployeeRole.GERENTE_ADM].includes(employee.role) : false,
    canManageEmployees: hasPermissionCheck(Permission.MANAGE_EMPLOYEES),
    canApprovePayments: hasPermissionCheck(Permission.APPROVE_PAYMENTS),
    
    // Funções
    refresh: () => {
      if (isLoaded && user) {
        setLoading(true)
        // Recarregar dados
      }
    }
  }
}