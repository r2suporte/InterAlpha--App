'use client'

import { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Stats {
  total: number
  pendentes: number
  pagos: number
  valorTotal: number
  valorPendente: number
}

export default function EstatisticasPagamentos() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pendentes: 0,
    pagos: 0,
    valorTotal: 0,
    valorPendente: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/pagamentos/estatisticas', {
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
              <CreditCard className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar estatísticas</h3>
              <p className="mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <CreditCard className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-gray-500">pagamentos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <div className="h-2 w-2 bg-yellow-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendentes}</div>
          <p className="text-xs text-gray-500">
            {formatCurrency(stats.valorPendente)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagos</CardTitle>
          <div className="h-2 w-2 bg-green-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pagos}</div>
          <p className="text-xs text-gray-500">confirmados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.valorTotal)}
          </div>
          <p className="text-xs text-gray-500">recebido</p>
        </CardContent>
      </Card>
    </div>
  )
}

function EstatisticasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-12 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-20 mt-1 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}