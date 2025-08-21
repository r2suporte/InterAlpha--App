'use client'

import { useState, useEffect } from 'react'
import { Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  total: number
  pendentes: number
  emAndamento: number
  concluidas: number
}

export default function EstatisticasCards() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pendentes: 0,
    emAndamento: 0,
    concluidas: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/ordens-servico/estatisticas', {
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Wrench className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <div className="h-2 w-2 bg-yellow-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendentes}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.emAndamento}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          <div className="h-2 w-2 bg-green-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.concluidas}</div>
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}