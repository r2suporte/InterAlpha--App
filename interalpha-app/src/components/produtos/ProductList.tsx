/**
 * Componente ProductList - Lista de produtos com filtros
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, Plus, Grid, List, SortAsc, SortDesc } from 'lucide-react'
import { ProductWithCalculations, ProductFilters, ProductSearchResult } from '@/types/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from './ProductCard'
import { ProductSearch } from './ProductSearch'

interface ProductListProps {
  initialData?: ProductSearchResult
  onProductEdit?: (id: string) => void
  onProductDelete?: (id: string) => void
  onProductView?: (id: string) => void
  onProductDuplicate?: (id: string) => void
}

export function ProductList({
  initialData,
  onProductEdit,
  onProductDelete,
  onProductView,
  onProductDuplicate
}: ProductListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<ProductWithCalculations[]>(initialData?.products || [])
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0)
  const [currentPage, setCurrentPage] = useState(initialData?.currentPage || 1)
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filtros
  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get('search') || '',
    isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20')
  })

  // Buscar produtos
  const fetchProducts = useCallback(async (newFilters: ProductFilters) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value))
        }
      })

      const response = await fetch(`/api/produtos?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setProducts(result.data.products)
        setTotalCount(result.data.totalCount)
        setCurrentPage(result.data.currentPage)
        setTotalPages(result.data.totalPages)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Atualizar URL quando filtros mudarem
  const updateURL = useCallback((newFilters: ProductFilters) => {
    const params = new URLSearchParams()
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })

    router.push(`/produtos?${params.toString()}`, { scroll: false })
  }, [router])

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFilters(updatedFilters)
    updateURL(updatedFilters)
    fetchProducts(updatedFilters)
  }, [filters, updateURL, fetchProducts])

  // Mudar página
  const changePage = useCallback((page: number) => {
    const updatedFilters = { ...filters, page }
    setFilters(updatedFilters)
    updateURL(updatedFilters)
    fetchProducts(updatedFilters)
  }, [filters, updateURL, fetchProducts])

  // Handlers
  const handleSearch = (search: string) => {
    applyFilters({ search })
  }

  const handleSortChange = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    applyFilters({ sortBy: sortBy as any, sortOrder })
  }

  const handleStatusFilter = (isActive: string) => {
    applyFilters({ 
      isActive: isActive === 'all' ? undefined : isActive === 'true' 
    })
  }

  const handleNewProduct = () => {
    router.push('/produtos/novo')
  }

  const handleProductEdit = (id: string) => {
    if (onProductEdit) {
      onProductEdit(id)
    } else {
      router.push(`/produtos/${id}/editar`)
    }
  }

  const handleProductView = (id: string) => {
    if (onProductView) {
      onProductView(id)
    } else {
      router.push(`/produtos/${id}`)
    }
  }

  const handleProductDelete = async (id: string) => {
    if (onProductDelete) {
      onProductDelete(id)
    } else {
      // Implementar exclusão padrão
      try {
        const response = await fetch(`/api/produtos/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          // Recarregar lista
          fetchProducts(filters)
        }
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
      }
    }
  }

  const handleProductDuplicate = (id: string) => {
    if (onProductDuplicate) {
      onProductDuplicate(id)
    } else {
      router.push(`/produtos/${id}/duplicar`)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (!initialData) {
      fetchProducts(filters)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">
            {totalCount} produto{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Alternar visualização */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={handleNewProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <ProductSearch
                value={filters.search || ''}
                onChange={handleSearch}
                placeholder="Buscar por part number ou descrição..."
              />
            </div>

            {/* Status */}
            <Select
              value={filters.isActive === undefined ? 'all' : String(filters.isActive)}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-')
                applyFilters({ sortBy: sortBy as any, sortOrder: sortOrder as 'asc' | 'desc' })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="partNumber-asc">Part Number A-Z</SelectItem>
                <SelectItem value="partNumber-desc">Part Number Z-A</SelectItem>
                <SelectItem value="description-asc">Descrição A-Z</SelectItem>
                <SelectItem value="description-desc">Descrição Z-A</SelectItem>
                <SelectItem value="costPrice-asc">Menor Custo</SelectItem>
                <SelectItem value="costPrice-desc">Maior Custo</SelectItem>
                <SelectItem value="salePrice-asc">Menor Preço</SelectItem>
                <SelectItem value="salePrice-desc">Maior Preço</SelectItem>
                <SelectItem value="profitMargin-desc">Maior Margem</SelectItem>
                <SelectItem value="profitMargin-asc">Menor Margem</SelectItem>
                <SelectItem value="createdAt-desc">Mais Recentes</SelectItem>
                <SelectItem value="createdAt-asc">Mais Antigos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros ativos */}
          {(filters.search || filters.isActive !== undefined) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Filtros ativos:</span>
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Busca: {filters.search}
                  <button
                    onClick={() => applyFilters({ search: '' })}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.isActive !== undefined && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.isActive ? 'Ativo' : 'Inativo'}
                  <button
                    onClick={() => applyFilters({ isActive: undefined })}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyFilters({ search: '', isActive: undefined })}
                className="text-xs"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de produtos */}
      {isLoading ? (
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleProductEdit}
              onDelete={handleProductDelete}
              onView={handleProductView}
              onDuplicate={handleProductDuplicate}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece cadastrando seu primeiro produto'
                }
              </p>
              <Button onClick={handleNewProduct}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {currentPage} de {totalPages} ({totalCount} produtos)
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              Anterior
            </Button>
            
            {/* Números das páginas */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changePage(page)}
                    disabled={isLoading}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}