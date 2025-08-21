'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface StockMovement {
  productId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  reference?: string
  unitCost?: number
  notes?: string
}

interface StockLevel {
  id: string
  productId: string
  quantity: number
  minQuantity: number
  maxQuantity: number
  reservedQuantity: number
  availableQuantity: number
  averageCost: number
  lastMovementAt: string
  status: 'normal' | 'low' | 'out_of_stock' | 'overstocked'
  alerts: string[]
  product: {
    partNumber: string
    description: string
    salePrice: number
    isActive: boolean
  }
}

interface StockFilters {
  productIds?: string[]
  categoryId?: string
  lowStockOnly?: boolean
  includeInactive?: boolean
  limit?: number
  offset?: number
}

export function useStockManagement() {
  const [isLoading, setIsLoading] = useState(false)
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const fetchStockLevels = useCallback(async (filters: StockFilters = {}) => {
    setIsLoading(true)
    try {
      const searchParams = new URLSearchParams()
      
      if (filters.productIds?.length) {
        searchParams.append('productIds', filters.productIds.join(','))
      }
      if (filters.categoryId) {
        searchParams.append('categoryId', filters.categoryId)
      }
      if (filters.lowStockOnly) {
        searchParams.append('lowStockOnly', 'true')
      }
      if (filters.includeInactive) {
        searchParams.append('includeInactive', 'true')
      }
      if (filters.limit) {
        searchParams.append('limit', filters.limit.toString())
      }
      if (filters.offset) {
        searchParams.append('offset', filters.offset.toString())
      }

      const response = await fetch(`/api/produtos/estoque?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar níveis de estoque')
      }

      setStockLevels(result.data)
      setTotalCount(result.meta.total)

      return {
        success: true,
        data: result.data,
        meta: result.meta
      }

    } catch (error) {
      console.error('Erro ao buscar estoque:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar estoque')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createStockMovement = useCallback(async (movement: StockMovement) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/produtos/estoque', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(movement)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao registrar movimentação')
      }

      // Mostrar alertas se houver
      if (result.data.alerts?.length > 0) {
        result.data.alerts.forEach((alert: any) => {
          if (alert.severity === 'critical') {
            toast.error(alert.message)
          } else if (alert.severity === 'warning') {
            toast.warning(alert.message)
          } else {
            toast.info(alert.message)
          }
        })
      }

      toast.success('Movimentação registrada com sucesso!')

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('Erro ao criar movimentação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar movimentação')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getProductStock = useCallback(async (productId: string, options: {
    includeHistory?: boolean
    historyLimit?: number
  } = {}) => {
    setIsLoading(true)
    try {
      const searchParams = new URLSearchParams()
      
      if (options.includeHistory) {
        searchParams.append('includeHistory', 'true')
      }
      if (options.historyLimit) {
        searchParams.append('historyLimit', options.historyLimit.toString())
      }

      const response = await fetch(`/api/produtos/estoque/${productId}?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar estoque do produto')
      }

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('Erro ao buscar estoque do produto:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar estoque')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateStockSettings = useCallback(async (productId: string, settings: {
    minQuantity?: number
    maxQuantity?: number
    reorderPoint?: number
    reorderQuantity?: number
    location?: string
    notes?: string
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/produtos/estoque/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar configurações')
      }

      toast.success('Configurações de estoque atualizadas!')

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar configurações')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getStockAlerts = useCallback(() => {
    return stockLevels.filter(stock => 
      stock.status === 'low' || 
      stock.status === 'out_of_stock' || 
      stock.alerts.length > 0
    )
  }, [stockLevels])

  const getStockSummary = useCallback(() => {
    const summary = {
      totalProducts: stockLevels.length,
      inStock: stockLevels.filter(s => s.quantity > 0).length,
      outOfStock: stockLevels.filter(s => s.quantity === 0).length,
      lowStock: stockLevels.filter(s => s.status === 'low').length,
      totalValue: stockLevels.reduce((sum, s) => sum + (s.quantity * s.averageCost), 0),
      totalAlerts: stockLevels.reduce((sum, s) => sum + s.alerts.length, 0)
    }

    return summary
  }, [stockLevels])

  return {
    // State
    isLoading,
    stockLevels,
    totalCount,
    
    // Actions
    fetchStockLevels,
    createStockMovement,
    getProductStock,
    updateStockSettings,
    
    // Computed
    getStockAlerts,
    getStockSummary
  }
}