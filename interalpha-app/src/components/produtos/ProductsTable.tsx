'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Package, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatPercentage, getMarginStatusClass } from '@/lib/utils/product-utils'
import { SORT_OPTIONS } from '@/lib/constants/products'
import { ProductWithCalculations, MarginStatus } from '@/types/product'
import { debounce } from '@/lib/utils/product-utils'
import Image from 'next/image'
import Link from 'next/link'

interface ProductsTableProps {
  initialProducts?: ProductWithCalculations[]
  onProductSelect?: (product: ProductWithCalculations) => void
  onProductEdit?: (productId: string) => void
  onProductDelete?: (productId: string) => void
  showActions?: boolean
}

interface Filters {
  search: string
  isActive?: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export default function ProductsTable({
  initialProducts = [],
  onProductSelect,
  onProductEdit,
  onProductDelete,
  showActions = true
}: ProductsTableProps) {
  const [products, setProducts] = useState<ProductWithCalculations[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    isActive: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }))
    }, 300),
    []
  )

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.isActive !== undefined) params.set('isActive', filters.isActive.toString())
      params.set('sortBy', filters.sortBy)
      params.set('sortOrder', filters.sortOrder)
      params.set('page', filters.page.toString())
      params.set('limit', filters.limit.toString())

      const response = await fetch(`/api/produtos?${params.toString()}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Erro ao carregar produtos: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
        setPagination(result.pagination)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch products when filters change
  useEffect(() => {
    fetchProducts()
  }, [filters.search, filters.isActive, filters.sortBy, filters.sortOrder, filters.page])

  // Handle search input
  const handleSearchChange = (value: string) => {
    debouncedSearch(value)
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }



  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inativo</Badge>
    )
  }

  // Loading skeleton
  if (loading && products.length === 0) {
    return <ProductsTableSkeleton />
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Produtos
          {pagination.total > 0 && (
            <Badge variant="outline" className="ml-2">
              {pagination.total} {pagination.total === 1 ? 'produto' : 'produtos'}
            </Badge>
          )}
        </CardTitle>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por part number ou descrição..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.isActive?.toString() || 'all'}
            onValueChange={(value) => 
              handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Ativo</SelectItem>
              <SelectItem value="false">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="text-center py-8 text-red-600">
            <Package className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar produtos</h3>
            <p className="mb-4">{error}</p>
            <Button onClick={fetchProducts} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-4">
            {/* Lista de Produtos */}
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50/50 to-transparent rounded-xl border border-gray-100/50 hover:shadow-md transition-all duration-200 ${
                    onProductSelect ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onProductSelect?.(product)}
                >
                  {/* Imagem do Produto */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.description}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Informações do Produto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {product.partNumber}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            Custo: {product.formattedCostPrice}
                          </span>
                          <span className="text-xs text-gray-500">
                            Venda: {product.formattedSalePrice}
                          </span>
                        </div>
                      </div>

                      {/* Status e Margem */}
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getMarginStatusClass(product.marginStatus as MarginStatus)}>
                          {formatPercentage(product.profitMargin)}
                        </Badge>
                        {getStatusBadge(product.isActive)}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  {showActions && (
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/produtos/${product.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onProductEdit?.(product.id)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onProductDelete?.(product.id)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Mostrando {((filters.page - 1) * filters.limit) + 1} a{' '}
                  {Math.min(filters.page * filters.limit, pagination.total)} de{' '}
                  {pagination.total} produtos
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev || loading}
                    onClick={() => handlePageChange(filters.page - 1)}
                  >
                    Anterior
                  </Button>

                  <span className="text-sm text-gray-600">
                    Página {filters.page} de {pagination.pages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext || loading}
                    onClick={() => handlePageChange(filters.page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm">
              {filters.search || filters.isActive !== undefined
                ? 'Tente ajustar os filtros de busca'
                : 'Cadastre o primeiro produto para começar'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Skeleton loading component
function ProductsTableSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-4" />
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={`product-skeleton-${i}`} className="flex items-center gap-4 p-4 rounded-xl border">
              <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}