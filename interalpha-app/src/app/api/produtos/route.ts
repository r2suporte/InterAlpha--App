import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { productFiltersSchema } from '@/lib/validations/product'
import { PAGINATION } from '@/lib/constants/products'

/**
 * GET /api/produtos - Listagem dinâmica de produtos para Client Components
 * Usado por: ProductsTable, ProductSearch, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const { searchParams } = new URL(request.url)
    
    // Extrair parâmetros de filtro
    const filters = {
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), PAGINATION.MAX_LIMIT)
    }

    // Validar filtros
    const validatedFilters = productFiltersSchema.parse(filters)

    // Buscar produtos usando o serviço
    const result = await ProductService.getProducts(validatedFilters)

    // Adicionar metadados úteis para o frontend
    const response = {
      success: true,
      data: result.products,
      pagination: result.pagination,
      filters: validatedFilters,
      timestamp: new Date().toISOString(),
      cached: false // Para implementação futura de cache
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Erro na API de produtos:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        data: [],
        pagination: {
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/produtos - Busca avançada de produtos
 * Para filtros complexos que não cabem na query string
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const body = await request.json()
    const { filters = {}, search = '' } = body

    // Construir filtros avançados
    const advancedFilters = {
      search,
      isActive: filters.isActive,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc',
      page: filters.page || 1,
      limit: Math.min(filters.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
      // Filtros adicionais para busca avançada
      minCostPrice: filters.minCostPrice,
      maxCostPrice: filters.maxCostPrice,
      minSalePrice: filters.minSalePrice,
      maxSalePrice: filters.maxSalePrice,
      minMargin: filters.minMargin,
      maxMargin: filters.maxMargin,
      createdAfter: filters.createdAfter,
      createdBefore: filters.createdBefore
    }

    // Buscar produtos
    const result = await ProductService.getProducts(advancedFilters)

    return NextResponse.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      filters: advancedFilters,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na busca avançada de produtos:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        data: [],
        pagination: {
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      { status: 500 }
    )
  }
}