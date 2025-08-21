'use client'

import { useState, useEffect } from 'react'
import { Users, Wrench, CreditCard, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  activeClients: number
  openServiceOrders: number
  monthlyRevenue: number
  growthPercentage: number
  recentMetrics: {
    newClientsThisWeek: number
    completedOrdersThisWeek: number
    pendingPayments: number
    averageOrderValue: number
  }
  trends: {
    clientsGrowth: number
    revenueGrowth: number
    ordersGrowth: number
    satisfactionScore: number
  }
}

export default function EstatisticasDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    openServiceOrders: 0,
    monthlyRevenue: 0,
    growthPercentage: 0,
    recentMetrics: {
      newClientsThisWeek: 0,
      completedOrdersThisWeek: 0,
      pendingPayments: 0,
      averageOrderValue: 0
    },
    trends: {
      clientsGrowth: 0,
      revenueGrowth: 0,
      ordersGrowth: 0,
      satisfactionScore: 0
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/dashboard/stats', {
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error('Erro ao carregar estatísticas')
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (isLoading) {
    return <EstatisticasSkeleton />
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="col-span-full border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Erro ao carregar estatísticas: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm underline hover:no-underline"
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Clientes Ativos
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Users className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.activeClients}</div>
          <p className="text-sm text-gray-500">
            +{stats.recentMetrics.newClientsThisWeek} esta semana
          </p>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            O.S. em Aberto
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Wrench className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.openServiceOrders}</div>
          <p className="text-sm text-gray-500">
            {stats.recentMetrics.completedOrdersThisWeek} concluídas esta semana
          </p>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Receita do Mês
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(stats.monthlyRevenue)}
          </div>
          <p className="text-sm text-gray-500">
            Ticket médio: {formatCurrency(stats.recentMetrics.averageOrderValue)}
          </p>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Crescimento
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats.growthPercentage > 0 ? '+' : ''}{stats.growthPercentage.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-500">
            Satisfação: {stats.trends.satisfactionScore.toFixed(1)}/5.0
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function EstatisticasSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-0 shadow-lg">
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
    </div>
  )
}