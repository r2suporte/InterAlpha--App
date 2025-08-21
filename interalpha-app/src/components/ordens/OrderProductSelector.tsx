'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, QrCode, Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { debounce } from 'lodash'

interface Product {
  id: string
  partNumber: string
  description: string
  costPrice: number
  salePrice: number
  imageUrl?: string
  isActive: boolean
}

interface OrderItem {
  id?: string
  productId: string
  product?: Product
  quantity: number
  unitPrice: number
  totalPrice: number
  description?: string
}

interface OrderProductSelectorProps {
  selectedItems: OrderItem[]
  onItemsChange: (items: OrderItem[]) => void
  disabled?: boolean
  className?: string
}

export function OrderProductSelector({
  selectedItems,
  onItemsChange,
  disabled = false,
  className = ''
}: OrderProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Buscar produtos com debounce
  const searchProducts = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setProducts([])
        setShowResults(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/produtos?search=${encodeURIComponent(term)}&limit=10&active=true`
        )
        
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
          setShowResults(true)
        } else {
          console.error('Erro ao buscar produtos:', response.statusText)
          setProducts([])
          setShowResults(false)
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
        setProducts([])
        setShowResults(false)
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    searchProducts(searchTerm)
  }, [searchTerm, searchProducts])

  // Adicionar produto à seleção
  const addProduct = (product: Product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id)

    if (existingItem) {
      // Incrementar quantidade
      updateItemQuantity(existingItem, existingItem.quantity + 1)
    } else {
      // Adicionar novo item
      const newItem: OrderItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.salePrice,
        totalPrice: product.salePrice
      }

      onItemsChange([...selectedItems, newItem])
    }

    // Limpar busca
    setSearchTerm('')
    setProducts([])
    setShowResults(false)
  }

  // Atualizar quantidade do item
  const updateItemQuantity = (item: OrderItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item)
      return
    }

    const updatedItems = selectedItems.map(i =>
      i.productId === item.productId
        ? {
            ...i,
            quantity: newQuantity,
            totalPrice: i.unitPrice * newQuantity
          }
        : i
    )

    onItemsChange(updatedItems)
  }

  // Atualizar preço unitário do item
  const updateItemPrice = (item: OrderItem, newPrice: number) => {
    if (newPrice < 0) return

    const updatedItems = selectedItems.map(i =>
      i.productId === item.productId
        ? {
            ...i,
            unitPrice: newPrice,
            totalPrice: newPrice * i.quantity
          }
        : i
    )

    onItemsChange(updatedItems)
  }

  // Remover item
  const removeItem = (item: OrderItem) => {
    const updatedItems = selectedItems.filter(i => i.productId !== item.productId)
    onItemsChange(updatedItems)
  }

  // Calcular valor total
  const totalValue = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)

  // Buscar por código de barras (placeholder)
  const handleBarcodeSearch = () => {
    // TODO: Implementar scanner de código de barras
    alert('Scanner de código de barras será implementado em breve')
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Busca de Produtos */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={disabled}
              onFocus={() => {
                if (products.length > 0) {
                  setShowResults(true)
                }
              }}
              onBlur={() => {
                // Delay para permitir clique nos resultados
                setTimeout(() => setShowResults(false), 200)
              }}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleBarcodeSearch}
            disabled={disabled}
            className="px-3"
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </div>

        {/* Resultados da busca */}
        {showResults && products.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 focus:bg-gray-50 focus:outline-none"
                onClick={() => addProduct(product)}
                disabled={disabled}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.partNumber}</div>
                    <div className="text-sm text-gray-600 truncate">{product.description}</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-green-600">
                      R$ {product.salePrice.toFixed(2)}
                    </div>
                    {product.imageUrl && (
                      <div className="text-xs text-gray-400">Com imagem</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mensagem quando não há resultados */}
        {showResults && products.length === 0 && searchTerm.length >= 2 && !isSearching && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-gray-500">
            Nenhum produto encontrado para "{searchTerm}"
          </div>
        )}
      </div>

      {/* Lista de Itens Selecionados */}
      {selectedItems.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-medium text-gray-900">Produtos Selecionados</h3>
            <p className="text-sm text-gray-600">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'} selecionado{selectedItems.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="divide-y">
            {selectedItems.map((item, index) => (
              <div key={item.productId} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Informações do produto */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {item.product?.partNumber || item.productId}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {item.product?.description}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        Obs: {item.description}
                      </div>
                    )}
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-3">
                    {/* Quantidade */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item, item.quantity - 1)}
                        disabled={disabled || item.quantity <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item, parseInt(e.target.value) || 1)}
                        className="w-16 text-center h-8"
                        min="1"
                        disabled={disabled}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item, item.quantity + 1)}
                        disabled={disabled}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Preço Unitário */}
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItemPrice(item, parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        disabled={disabled}
                        className="text-right h-8"
                        placeholder="0,00"
                      />
                    </div>

                    {/* Total */}
                    <div className="w-20 text-right font-medium text-gray-900">
                      R$ {item.totalPrice.toFixed(2)}
                    </div>

                    {/* Remover */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Geral */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total dos Produtos:</span>
              <span className="text-lg font-bold text-gray-900">
                R$ {totalValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há itens */}
      {selectedItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Nenhum produto selecionado</div>
          <div className="text-xs mt-1">
            Use a busca acima para adicionar produtos à ordem
          </div>
        </div>
      )}
    </div>
  )
}