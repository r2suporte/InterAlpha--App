/**
 * API para Estatísticas de Produtos
 * GET /api/produtos/stats - Obter estatísticas gerais
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { productService } from '@/lib/services/product-service'

/**
 * GET /api/produtos/stats - Obter estatísticas de produtos
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter estatísticas
    const stats = await productService.getProductStats()

    // Obter produtos mais vendidos
    const topProducts = await productService.getTopSellingProducts(5)

    return NextResponse.json({
      success: true,
      data: {
        stats,
        topProducts: topProducts.map(product => ({
          id: product.id,
          partNumber: product.partNumber,
          description: product.description,
          totalSold: product.totalSold,
          salePrice: product.salePrice
        }))
      }
    })

  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}