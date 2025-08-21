'use client'

import { useState, useEffect } from 'react'
import { Package, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/utils/product-utils'

interface ProductStatsData {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  averageMargin: number
  totalValue: number
  averagePrice: number
  activePercentage: number
  marginStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'neutral'
  topProducts: Array<{
    id: string
    partNumber: string
    description: string
    timesUsed: number
  }>
  trends: {
    productsGrowth: number
    marginTrend: 'up' | 'down' | 'stable'
    valueTrend: 'up' | 'down' | 'stable'
  }
}

export default function ProductsStats() {
  const [stats, setStats] = useState<ProductStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/produtos/estatisticas', {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Erro ao carregar estatísticas: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const getMarginStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50'
      case 'good':
        return 'text-blue-600 bg-blue-50'
      case 'fair':
        return 'text-yellow-600 bg-yellow-50'
      case 'poor':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getMarginStatusText = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'Excelente'
      case 'good':
        return 'Boa'
      case 'fair':
        return 'Razoável'
      case 'poor':
        return 'Baixa'
      default:
        return 'Neutra'
    }
  }

  if (loading) {
    return <ProductsStatsSkeleton />
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total de Produtos */}
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Total de Produtos
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Package className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalProducts}</div>
          <p className="text-sm text-gray-500">
            {stats.activeProducts} ativos, {stats.inactiveProducts} inativos
          </p>
          {stats.trends.productsGrowth !== 0 && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`h-4 w-4 mr-1 ${
                stats.trends.productsGrowth > 0 ? 'text-green-600' : 'text-red-600'
              }`} />
              <span className={`text-sm font-medium ${
                stats.trends.productsGrowth > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.trends.productsGrowth > 0 ? '+' : ''}{stats.trends.productsGrowth}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos Ativos */}
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Produtos Ativos
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Package className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">{stats.activeProducts}</div>
          <p className="text-sm text-gray-500">
            {formatPercentage(stats.activePercentage, 0)} do total
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.activePercentage}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Margem Média */}
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Margem Média
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatPercentage(stats.averageMargin)}
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            getMarginStatusColor(stats.marginStatus)
          }`}>
            {getMarginStatusText(stats.marginStatus)}
          </div>
        </CardContent>
      </Card>

      {/* Valor Total do Catálogo */}
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600">
            Valor do Catálogo
          </CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(stats.totalValue)}
          </div>
          <p className="text-sm text-gray-500">
            Média: {formatCurrency(stats.averagePrice)}
          </p>
        </CardContent>
      </Card>

      {/* Produtos Mais Utilizados */}
      {stats.topProducts.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg"></div>
              Produtos Mais Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50/50 to-transparent rounded-xl border border-gray-100/50"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                    'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.partNumber}</p>
                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">{product.timesUsed}</p>
                    <p className="text-xs text-gray-500">usos</p>
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
function ProductsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={`stats-${i}`} className="border-0 shadow-lg">
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
              <div key={`top-products-${i}`} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}