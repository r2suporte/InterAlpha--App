/**
 * Hook para gerenciar produtos em ordens de serviço
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { OrderItem } from '@/types/product'

interface UseOrderProductsProps {
  orderId?: string
  initialItems?: OrderItem[]
}

export function useOrderProducts({ orderId, initialItems = [] }: UseOrderProductsProps = {}) {
  const [items, setItems] = useState<OrderItem[]>(initialItems)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar itens existentes da ordem
  const loadOrderItems = useCallback(async (orderIdToLoad: string) => {
    if (!orderIdToLoad) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ordens-servico/${orderIdToLoad}/items`)
      const result = await response.json()

      if (result.success) {
        setItems(result.data)
      } else {
        setError(result.error || 'Erro ao carregar itens')
      }
    } catch (err) {
      console.error('Erro ao carregar itens da ordem:', err)
      setError('Erro ao carregar itens da ordem')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Salvar itens da ordem
  const saveOrderItems = useCallback(async (orderIdToSave: string, itemsToSave: OrderItem[]) => {
    if (!orderIdToSave) return false

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ordens-servico/${orderIdToSave}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: itemsToSave })
      })

      const result = await response.json()

      if (result.success) {
        setItems(result.data)
        return true
      } else {
        setError(result.error || 'Erro ao salvar itens')
        return false
      }
    } catch (err) {
      console.error('Erro ao salvar itens da ordem:', err)
      setError('Erro ao salvar itens da ordem')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Adicionar produto
  const addProduct = useCallback((productId: string, unitPrice: number, quantity: number = 1) => {
    const existingItemIndex = items.findIndex(item => item.productId === productId)
    
    if (existingItemIndex >= 0) {
      // Atualizar quantidade do item existente
      const updatedItems = [...items]
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
        totalPrice: (updatedItems[existingItemIndex].quantity + quantity) * unitPrice
      }
      setItems(updatedItems)
    } else {
      // Adicionar novo item
      const newItem: OrderItem = {
        id: `temp-${Date.now()}-${Math.random()}`,
        orderId: orderId || '',
        productId,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        createdAt: new Date()
      }
      setItems(prev => [...prev, newItem])
    }
  }, [items, orderId])

  // Atualizar quantidade
  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId)
      return
    }

    setItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: item.unitPrice * newQuantity
        }
      }
      return item
    }))
  }, [])

  // Remover produto
  const removeProduct = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId))
  }, [])

  // Atualizar preço unitário
  const updateUnitPrice = useCallback((productId: string, newUnitPrice: number) => {
    setItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          unitPrice: newUnitPrice,
          totalPrice: item.quantity * newUnitPrice
        }
      }
      return item
    }))
  }, [])

  // Limpar todos os itens
  const clearItems = useCallback(() => {
    setItems([])
  }, [])

  // Calcular totais
  const totals = {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: items.reduce((sum, item) => sum + item.totalPrice, 0),
    itemCount: items.length
  }

  // Validações
  const validation = {
    hasItems: items.length > 0,
    allItemsValid: items.every(item => 
      item.quantity > 0 && 
      item.unitPrice > 0 && 
      item.productId
    )
  }

  // Carregar itens quando orderId mudar
  useEffect(() => {
    if (orderId && orderId !== 'new') {
      loadOrderItems(orderId)
    }
  }, [orderId, loadOrderItems])

  return {
    // Estado
    items,
    isLoading,
    error,
    totals,
    validation,

    // Ações
    setItems,
    addProduct,
    updateQuantity,
    removeProduct,
    updateUnitPrice,
    clearItems,
    loadOrderItems,
    saveOrderItems,

    // Utilitários
    getItem: (productId: string) => items.find(item => item.productId === productId),
    hasProduct: (productId: string) => items.some(item => item.productId === productId),
    getQuantity: (productId: string) => items.find(item => item.productId === productId)?.quantity || 0
  }
}