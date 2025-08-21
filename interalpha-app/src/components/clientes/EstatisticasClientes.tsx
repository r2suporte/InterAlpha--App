'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, TrendingUp, Building } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EstatisticasData {
  total: number
  novosEsteMs: number
  ativos: number
  inativos: number
  porTipo: {
    cpf: number
    cnpj: number
  }
  crescimento: {
    percentual: number
    periodo: string
  }
}

export default function EstatisticasClientes() {
  const [stats, setStats] = useState<EstatisticasData>({
    total: 0,
    novosEsteMs: 0,
    ativos: 0,
    inativos: 0,
    porTipo: { cpf: 0, cnpj: 0 },
    crescimento: { percentual: 0, periodo: 'últimos 30 dias' }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/clientes/estatisticas', {
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

  if (isLoading) {
    return <EstatisticasSkeleton />
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-full">
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-gray-500">
            {stats.porTipo.cpf} CPF • {stats.porTipo.cnpj} CNPJ
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Novos Este Mês</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.novosEsteMs}</div>
          <p className="text-xs text-gray-500">
            {stats.crescimento.percentual > 0 ? '+' : ''}{stats.crescimento.percentual}% vs mês anterior
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ativos}</div>
          <p className="text-xs text-gray-500">
            {stats.inativos} inativos
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Empresas</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.porTipo.cnpj}</div>
          <p className="text-xs text-gray-500">
            {((stats.porTipo.cnpj / stats.total) * 100).toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function EstatisticasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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