import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'

/**
 * GET /api/produtos/search - Busca rápida de produtos para autocomplete
 * Usado por: ProductSearch, OrderProductSelector, etc.
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
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Validar query mínima
    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Digite pelo menos 2 caracteres para buscar'
      })
    }

    // Buscar produtos para seleção
    const products = await ProductService.searchProductsForOrder(query, limit)

    // Filtrar apenas ativos se solicitado
    const filteredProducts = activeOnly 
      ? products.filter((p: any) => p.isActive !== false)
      : products

    // Formatar para autocomplete
    const formattedProducts = filteredProducts.map((product: any) => ({
      id: product.id,
      partNumber: product.partNumber,
      description: product.description,
      salePrice: product.salePrice,
      imageUrl: product.imageUrl,
      label: `${product.partNumber} - ${product.description}`,
      value: product.id,
      subtitle: `R$ ${product.salePrice.toFixed(2)}`,
      // Dados adicionais para o frontend
      searchScore: calculateSearchScore(product, query)
    }))

    // Ordenar por relevância
    formattedProducts.sort((a, b) => b.searchScore - a.searchScore)

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      query,
      total: formattedProducts.length,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache por 1 minuto
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Erro na busca de produtos:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        data: [],
        query: '',
        total: 0
      },
      { status: 500 }
    )
  }
}

/**
 * Calcula score de relevância para ordenação dos resultados
 */
function calculateSearchScore(product: any, query: string): number {
  const queryLower = query.toLowerCase()
  const partNumberLower = product.partNumber.toLowerCase()
  const descriptionLower = product.description.toLowerCase()
  
  let score = 0
  
  // Part number exato = maior score
  if (partNumberLower === queryLower) {
    score += 100
  }
  // Part number começa com query
  else if (partNumberLower.startsWith(queryLower)) {
    score += 80
  }
  // Part number contém query
  else if (partNumberLower.includes(queryLower)) {
    score += 60
  }
  
  // Descrição começa com query
  if (descriptionLower.startsWith(queryLower)) {
    score += 40
  }
  // Descrição contém query
  else if (descriptionLower.includes(queryLower)) {
    score += 20
  }
  
  // Bonus para produtos mais utilizados (se disponível)
  if (product.timesUsed) {
    score += Math.min(product.timesUsed, 10)
  }
  
  return score
}