/**
 * Componente OrderProductSelector - Seletor de produtos para ordens de serviço
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, ShoppingCart, Package } from 'lucide-react'
import { ProductWithCalculations, OrderItem } from '@/types/product'
import { formatCurrency } from '@/lib/utils/product-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface OrderProductSelectorProps {
  orderId?: string
  selectedItems: OrderItem[]
  onItemsChange: (items: OrderItem[]) => void
  disabled?: boolean
}

export function OrderProductSelector({
  orderId,
  selectedItems,
  onItemsChange,
  disabled = false
}: OrderProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState<ProductWithCalculations[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Buscar produtos
  const fetchProducts = useCallback(async (search: string = '') => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        isActive: 'true',
        limit: '50'
      })
      
      if (search) {
        params.set('search', search)
      }

      const response = await fetch(`/api/produtos?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setProducts(result.data.products)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar produtos quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      fetchProducts(searchTerm)
    }
  }, [isOpen, fetchProducts, searchTerm])

  // Debounce da busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) {
        fetchProducts(searchTerm)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, isOpen, fetchProducts])

  const addProduct = (product: ProductWithCalculations) => {
    const existingItem = selectedItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      // Incrementar quantidade
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      // Adicionar novo item
      const newItem: OrderItem = {
        id: `temp-${Date.now()}`,
        orderId: orderId || '',
        productId: product.id,
        quantity: 1,
        unitPrice: product.salePrice,
        totalPrice: product.salePrice,
        createdAt: new Date(),
        product
      }
      
      onItemsChange([...selectedItems, newItem])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId)
      return
    }

    const updatedItems = selectedItems.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: item.unitPrice * newQuantity
        }
      }
      return item
    })

    onItemsChange(updatedItems)
  }

  const removeProduct = (productId: string) => {
    const updatedItems = selectedItems.filter(item => item.productId !== productId)
    onItemsChange(updatedItems)
  }

  const getProductQuantity = (productId: string) => {
    const item = selectedItems.find(item => item.productId === productId)
    return item?.quantity || 0
  }

  const getTotalValue = () => {
    return selectedItems.reduce((total, item) => total + item.totalPrice, 0)
  }

  const getTotalItems = () => {
    return selectedItems.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <div className="space-y-4">
      {/* Botão para abrir seletor */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={disabled} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produtos
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Selecionar Produtos</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar produtos por part number ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de produtos */}
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Carregando produtos...</p>
                  </div>
                ) : products.length > 0 ? (
                  products.map((product) => {
                    const quantity = getProductQuantity(product.id)
                    
                    return (
                      <Card key={product.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{product.partNumber}</h4>
                              <Badge variant="outline" className="text-xs">
                                {product.profitMargin.toFixed(1)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {product.description}
                            </p>
                            <p className="text-sm font-medium text-green-600 mt-1">
                              {formatCurrency(product.salePrice)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {quantity > 0 ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(product.id, quantity - 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(product.id, quantity + 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addProduct(product)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Adicionar
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de produtos selecionados */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5" />
              Produtos Selecionados ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{item.product?.partNumber}</h4>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(item.unitPrice)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {item.product?.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                      disabled={disabled}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                      disabled={disabled}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right min-w-0">
                    <p className="text-sm font-medium">
                      {formatCurrency(item.totalPrice)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex items-center justify-between pt-2">
              <span className="font-medium">Total dos Produtos:</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(getTotalValue())}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}