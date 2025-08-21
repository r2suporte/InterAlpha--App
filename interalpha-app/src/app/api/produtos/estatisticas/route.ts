import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'

/**
 * GET /api/produtos/estatisticas - Estatísticas de produtos para Client Components
 * Usado por: ProductsStats, Dashboard, etc.
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

    // Buscar estatísticas usando o serviço
    const stats = await ProductService.getProductStats()

    // Adicionar estatísticas calculadas adicionais
    const enhancedStats = {
      ...stats,
      inactiveProducts: stats.totalProducts - stats.activeProducts,
      activePercentage: stats.totalProducts > 0 
        ? Math.round((stats.activeProducts / stats.totalProducts) * 100) 
        : 0,
      averagePrice: stats.totalProducts > 0 
        ? stats.totalValue / stats.totalProducts 
        : 0,
      marginStatus: getMarginStatus(stats.averageMargin),
      trends: {
        // Para implementação futura - comparação com período anterior
        productsGrowth: 0,
        marginTrend: 'stable',
        valueTrend: 'stable'
      }
    }

    // Simular um pequeno delay para mostrar loading states
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json({
      success: true,
      data: enhancedStats,
      timestamp: new Date().toISOString(),
      cached: false
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas de produtos:', error)
    
    // Retornar estatísticas zeradas em caso de erro
    return NextResponse.json({
      success: true,
      data: {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        averageMargin: 0,
        totalValue: 0,
        averagePrice: 0,
        activePercentage: 0,
        marginStatus: 'neutral',
        topProducts: [],
        trends: {
          productsGrowth: 0,
          marginTrend: 'stable',
          valueTrend: 'stable'
        }
      },
      timestamp: new Date().toISOString(),
      error: 'Dados não disponíveis'
    })
  }
}

/**
 * Determina o status da margem baseado no valor
 */
function getMarginStatus(margin: number): 'excellent' | 'good' | 'fair' | 'poor' | 'neutral' {
  if (margin >= 50) return 'excellent'
  if (margin >= 30) return 'good'
  if (margin >= 15) return 'fair'
  if (margin > 0) return 'poor'
  return 'neutral'
}