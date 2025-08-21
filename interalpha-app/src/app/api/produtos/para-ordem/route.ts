import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { addCalculationsToProduct } from '@/lib/utils/product-utils'

/**
 * GET /api/produtos/para-ordem - Buscar produtos para adicionar em ordens de serviço
 * Usado por: OrderProductSelector, ProductPicker, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default true
    const includeStock = searchParams.get('includeStock') === 'true'
    const orderId = searchParams.get('orderId') // Para excluir produtos já adicionados

    // Buscar produtos ativos para seleção
    const products = await ProductService.searchProductsForOrder(search, limit)

    // Filtrar apenas ativos se solicitado
    const filteredProducts = activeOnly 
      ? products.filter(p => p.isActive !== false)
      : products

    // Adicionar informações específicas para ordens
    const productsForOrder = await Promise.all(
      filteredProducts.map(async (product) => {
        const productWithCalc = addCalculationsToProduct(product)
        
        // Verificar se produto já está na ordem (se orderId fornecido)
        let alreadyInOrder = false
        if (orderId) {
          // TODO: Implementar verificação se produto já está na ordem
          // const orderItems = await getOrderItems(orderId)
          // alreadyInOrder = orderItems.some(item => item.productId === product.id)
        }

        return {
          id: product.id,
          partNumber: product.partNumber,
          description: product.description,
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
          profitMargin: productWithCalc.profitMargin,
          formattedSalePrice: productWithCalc.formattedSalePrice,
          
          // Dados específicos para seleção em ordens
          label: `${product.partNumber} - ${product.description}`,
          value: product.id,
          subtitle: `${productWithCalc.formattedSalePrice} (Margem: ${productWithCalc.profitMargin.toFixed(1)}%)`,
          
          // Informações de estoque (se disponível)
          ...(includeStock && {
            quantity: product.quantity || 0,
            minStock: product.minStock || 0,
            stockStatus: getStockStatus(product.quantity || 0, product.minStock || 0)
          }),
          
          // Status na ordem atual
          alreadyInOrder,
          
          // Dados para cálculos
          calculationData: {
            unitPrice: product.salePrice,
            suggestedQuantity: 1,
            maxQuantity: includeStock ? (product.quantity || 999) : 999
          }
        }
      })
    )

    // Ordenar por relevância (produtos mais usados primeiro)
    productsForOrder.sort((a, b) => {
      // Priorizar produtos não adicionados à ordem
      if (a.alreadyInOrder !== b.alreadyInOrder) {
        return a.alreadyInOrder ? 1 : -1
      }
      
      // Depois por relevância da busca
      const aScore = calculateSearchRelevance(a, search)
      const bScore = calculateSearchRelevance(b, search)
      return bScore - aScore
    })

    return NextResponse.json({
      success: true,
      data: productsForOrder,
      search,
      total: productsForOrder.length,
      hasMore: productsForOrder.length === limit,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar produtos para ordem:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        data: []
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/produtos/para-ordem - Busca avançada para seleção em ordens
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      search = '',
      filters = {},
      orderId,
      includeStock = false,
      includeUsageHistory = false
    } = body

    // Construir filtros específicos para ordens
    const orderFilters = {
      search,
      isActive: filters.isActive !== false, // Default true para ordens
      sortBy: 'partNumber',
      sortOrder: 'asc' as const,
      page: 1,
      limit: filters.limit || 50,
      // Filtros específicos
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      category: filters.category
    }

    // Buscar produtos
    const result = await ProductService.getProducts(orderFilters)
    
    // Processar produtos para uso em ordens
    const productsForOrder = result.products.map(product => {
      const productWithCalc = addCalculationsToProduct(product)
      
      return {
        id: product.id,
        partNumber: product.partNumber,
        description: product.description,
        salePrice: product.salePrice,
        imageUrl: product.imageUrl,
        
        // Formatação para UI
        label: `${product.partNumber} - ${product.description}`,
        subtitle: productWithCalc.formattedSalePrice,
        
        // Dados para cálculos na ordem
        unitPrice: product.salePrice,
        availableQuantity: includeStock ? (product.quantity || 999) : 999,
        
        // Histórico de uso (se solicitado)
        ...(includeUsageHistory && {
          recentUsage: product.orderItems?.slice(0, 3).map((item: any) => ({
            orderId: item.order.id,
            quantity: item.quantity,
            date: item.order.createdAt
          })) || []
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: productsForOrder,
      pagination: result.pagination,
      filters: orderFilters
    })

  } catch (error) {
    console.error('Erro na busca avançada para ordem:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        data: []
      },
      { status: 500 }
    )
  }
}

/**
 * Calcular relevância da busca
 */
function calculateSearchRelevance(product: any, search: string): number {
  if (!search) return 0
  
  const searchLower = search.toLowerCase()
  const partNumberLower = product.partNumber.toLowerCase()
  const descriptionLower = product.description.toLowerCase()
  
  let score = 0
  
  // Part number exato
  if (partNumberLower === searchLower) score += 100
  // Part number começa com busca
  else if (partNumberLower.startsWith(searchLower)) score += 80
  // Part number contém busca
  else if (partNumberLower.includes(searchLower)) score += 60
  
  // Descrição começa com busca
  if (descriptionLower.startsWith(searchLower)) score += 40
  // Descrição contém busca
  else if (descriptionLower.includes(searchLower)) score += 20
  
  return score
}

/**
 * Determinar status do estoque
 */
function getStockStatus(quantity: number, minStock: number): 'ok' | 'low' | 'out' {
  if (quantity <= 0) return 'out'
  if (quantity <= minStock) return 'low'
  return 'ok'
}