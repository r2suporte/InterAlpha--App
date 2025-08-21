'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Shield, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EmployeeStatsData {
  total: number
  active: number
  inactive: number
  byRole: Record<string, number>
  byDepartment: Record<string, number>
  recentLogins: number
}

const ROLE_LABELS: Record<string, string> = {
  'ADMIN': 'Administradores',
  'GERENTE_ADM': 'Gerentes Administrativos',
  'GERENTE_FINANCEIRO': 'Gerentes Financeiros',
  'SUPERVISOR_TECNICO': 'Supervisores Técnicos',
  'TECNICO': 'Técnicos',
  'ATENDENTE': 'Atendentes'
}

const ROLE_COLORS: Record<string, string> = {
  'ADMIN': 'bg-red-100 text-red-800',
  'GERENTE_ADM': 'bg-orange-100 text-orange-800',
  'GERENTE_FINANCEIRO': 'bg-green-100 text-green-800',
  'SUPERVISOR_TECNICO': 'bg-purple-100 text-purple-800',
  'TECNICO': 'bg-blue-100 text-blue-800',
  'ATENDENTE': 'bg-gray-100 text-gray-800'
}

export default function EmployeeStats() {
  const [stats, setStats] = useState<EmployeeStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/funcionarios/stats')
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || 'Erro ao carregar estatísticas')
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      setError('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <EmployeeStatsSkeleton />
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <Users className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar estatísticas</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const activePercentage = stats.total > 0 ? (stats.active / stats.total) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total de Funcionários */}
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Total de Funcionários
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Users className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</div>
          <p className="text-sm text-gray-500">
            {stats.active} ativos, {stats.inactive} inativos
          </p>
        </CardContent>
      </Card>

      {/* Funcionários Ativos */}
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Funcionários Ativos
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <UserCheck className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.active}</div>
          <p className="text-sm text-gray-500">
            {activePercentage.toFixed(1)}% do total
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${activePercentage}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionários Inativos */}
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-red-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Funcionários Inativos
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <UserX className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.inactive}</div>
          <p className="text-sm text-gray-500">
            {stats.total > 0 ? ((stats.inactive / stats.total) * 100).toFixed(1) : 0}% do total
          </p>
        </CardContent>
      </Card>

      {/* Logins Recentes */}
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Logins Recentes
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Calendar className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.recentLogins}</div>
          <p className="text-sm text-gray-500">
            Últimos 7 dias
          </p>
        </CardContent>
      </Card>

      {/* Distribuição por Cargo */}
      {Object.keys(stats.byRole).length > 0 && (
        <Card className="md:col-span-2 lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Distribuição por Cargo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(stats.byRole).map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/50 to-transparent rounded-xl border border-gray-100/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={ROLE_COLORS[role] || 'bg-gray-100 text-gray-800'}>
                      {ROLE_LABELS[role] || role}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">
                      {stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Departamento */}
      {Object.keys(stats.byDepartment).length > 0 && (
        <Card className="md:col-span-2 lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Distribuição por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(stats.byDepartment).map(([department, count]) => (
                <div
                  key={department}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/50 to-transparent rounded-xl border border-gray-100/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
                    <span className="font-medium text-gray-900">{department}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">
                      {stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Skeleton loading component
function EmployeeStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={`employee-stats-skeleton-${i}`} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2" />
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
          </CardContent>
        </Card>
      ))}

      <Card className="md:col-span-2 lg:col-span-4 border-0 shadow-lg">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={`department-skeleton-${i}`} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}