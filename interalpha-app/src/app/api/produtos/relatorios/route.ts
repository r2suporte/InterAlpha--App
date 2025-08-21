import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { formatCurrency, formatPercentage } from '@/lib/utils/product-utils'
import { z } from 'zod'

// Schema para filtros de relatório
const reportFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minMargin: z.number().optional(),
  reportType: z.enum(['summary', 'detailed', 'performance', 'inventory']).default('summary')
})

/**
 * GET /api/produtos/relatorios - Gerar relatórios de produtos
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Extrair e validar filtros
    const filters = {
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      categoryId: searchParams.get('categoryId'),
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      minMargin: searchParams.get('minMargin') ? parseFloat(searchParams.get('minMargin')!) : undefined,
      reportType: (searchParams.get('reportType') as any) || 'summary'
    }
    
    const validatedFilters = reportFiltersSchema.parse(filters)
    
    // Gerar relatório baseado no tipo
    let reportData
    switch (validatedFilters.reportType) {
      case 'summary':
        reportData = await generateSummaryReport(validatedFilters)
        break
      case 'detailed':
        reportData = await generateDetailedReport(validatedFilters)
        break
      case 'performance':
        reportData = await generatePerformanceReport(validatedFilters)
        break
      case 'inventory':
        reportData = await generateInventoryReport(validatedFilters)
        break
      default:
        reportData = await generateSummaryReport(validatedFilters)
    }
    
    // Registrar geração de relatório
    await logReportGeneration(userId, validatedFilters.reportType, validatedFilters)
    
    return NextResponse.json({
      success: true,
      data: reportData,
      filters: validatedFilters,
      generatedAt: new Date().toISOString(),
      generatedBy: userId
    })

  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Filtros inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/produtos/relatorios - Gerar relatório personalizado
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      filters = {}, 
      columns = [], 
      groupBy = [], 
      orderBy = [],
      format = 'json',
      includeCharts = false
    } = body
    
    // Validar filtros
    const validatedFilters = reportFiltersSchema.parse(filters)
    
    // Gerar relatório personalizado
    const reportData = await generateCustomReport({
      filters: validatedFilters,
      columns,
      groupBy,
      orderBy,
      includeCharts
    })
    
    if (format === 'csv') {
      const csvData = generateReportCSV(reportData)
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio_produtos_${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache'
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: reportData,
      configuration: {
        filters: validatedFilters,
        columns,
        groupBy,
        orderBy,
        format,
        includeCharts
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao gerar relatório personalizado:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * Gera relatório resumo
 */
async function generateSummaryReport(filters: any) {
  try {
    // Buscar dados básicos
    const products = await ProductService.getProducts({
      isActive: filters.isActive,
      limit: 10000 // Buscar todos para relatório
    })
    
    // Calcular estatísticas
    const totalProducts = products.products.length
    const activeProducts = products.products.filter(p => p.isActive !== false).length
    const inactiveProducts = totalProducts - activeProducts
    
    const totalValue = products.products.reduce((sum, p) => sum + (p.salePrice || 0), 0)
    const totalCost = products.products.reduce((sum, p) => sum + (p.costPrice || 0), 0)
    const totalMargin = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0
    
    // Produtos por faixa de preço
    const priceRanges = {
      'até R$ 50': products.products.filter(p => (p.salePrice || 0) <= 50).length,
      'R$ 51 - R$ 100': products.products.filter(p => (p.salePrice || 0) > 50 && (p.salePrice || 0) <= 100).length,
      'R$ 101 - R$ 500': products.products.filter(p => (p.salePrice || 0) > 100 && (p.salePrice || 0) <= 500).length,
      'acima de R$ 500': products.products.filter(p => (p.salePrice || 0) > 500).length
    }
    
    // Produtos por margem
    const marginRanges = {
      'Margem Negativa': products.products.filter(p => {
        const margin = (p.costPrice || 0) > 0 ? (((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 0)) * 100 : 0
        return margin < 0
      }).length,
      '0% - 20%': products.products.filter(p => {
        const margin = (p.costPrice || 0) > 0 ? (((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 0)) * 100 : 0
        return margin >= 0 && margin <= 20
      }).length,
      '21% - 50%': products.products.filter(p => {
        const margin = (p.costPrice || 0) > 0 ? (((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 0)) * 100 : 0
        return margin > 20 && margin <= 50
      }).length,
      'acima de 50%': products.products.filter(p => {
        const margin = (p.costPrice || 0) > 0 ? (((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 0)) * 100 : 0
        return margin > 50
      }).length
    }
    
    return {
      overview: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        totalValue: formatCurrency(totalValue),
        totalCost: formatCurrency(totalCost),
        averageMargin: formatPercentage(totalMargin)
      },
      distributions: {
        priceRanges,
        marginRanges
      },
      topProducts: {
        highestValue: products.products
          .sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0))
          .slice(0, 5)
          .map(p => ({
            partNumber: p.partNumber,
            description: p.description,
            salePrice: formatCurrency(p.salePrice || 0)
          })),
        highestMargin: products.products
          .map(p => ({
            ...p,
            margin: (p.costPrice || 0) > 0 ? (((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 0)) * 100 : 0
          }))
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 5)
          .map(p => ({
            partNumber: p.partNumber,
            description: p.description,
            margin: formatPercentage(p.margin)
          }))
      }
    }
    
  } catch (error) {
    console.error('Erro ao gerar relatório resumo:', error)
    throw error
  }
}

/**
 * Gera relatório detalhado
 */
async function generateDetailedReport(filters: any) {
  try {
    const products = await ProductService.getProducts({
      isActive: filters.isActive,
      limit: 10000
    })
    
    const detailedProducts = products.products.map(product => {
      const margin = (product.costPrice || 0) > 0 
        ? (((product.salePrice || 0) - (product.costPrice || 0)) / (product.costPrice || 0)) * 100 
        : 0
      
      const profit = (product.salePrice || 0) - (product.costPrice || 0)
      
      return {
        partNumber: product.partNumber,
        description: product.description,
        costPrice: product.costPrice || 0,
        salePrice: product.salePrice || 0,
        margin: margin,
        profit: profit,
        isActive: product.isActive,
        hasImage: !!product.imageUrl,
        createdAt: product.createdAt,
        timesUsed: product._count?.orderItems || 0,
        // Classificações
        priceCategory: (product.salePrice || 0) <= 50 ? 'Baixo' : 
                      (product.salePrice || 0) <= 100 ? 'Médio' : 
                      (product.salePrice || 0) <= 500 ? 'Alto' : 'Premium',
        marginCategory: margin < 0 ? 'Negativa' :
                       margin <= 20 ? 'Baixa' :
                       margin <= 50 ? 'Boa' : 'Excelente',
        usageCategory: (product._count?.orderItems || 0) === 0 ? 'Não usado' :
                       (product._count?.orderItems || 0) <= 5 ? 'Pouco usado' :
                       (product._count?.orderItems || 0) <= 20 ? 'Uso médio' : 'Muito usado'
      }
    })
    
    return {
      products: detailedProducts,
      summary: {
        totalProducts: detailedProducts.length,
        averagePrice: detailedProducts.reduce((sum, p) => sum + p.salePrice, 0) / detailedProducts.length,
        averageMargin: detailedProducts.reduce((sum, p) => sum + p.margin, 0) / detailedProducts.length,
        totalProfit: detailedProducts.reduce((sum, p) => sum + p.profit, 0)
      }
    }
    
  } catch (error) {
    console.error('Erro ao gerar relatório detalhado:', error)
    throw error
  }
}

/**
 * Gera relatório de performance
 */
async function generatePerformanceReport(filters: any) {
  try {
    // TODO: Implementar com dados reais de uso em ordens
    const mockPerformanceData = {
      topSellingProducts: [
        { partNumber: 'PROD-001', description: 'Produto A', timesUsed: 45, revenue: 2250.00 },
        { partNumber: 'PROD-002', description: 'Produto B', timesUsed: 32, revenue: 1600.00 },
        { partNumber: 'PROD-003', description: 'Produto C', timesUsed: 28, revenue: 1400.00 }
      ],
      mostProfitableProducts: [
        { partNumber: 'PROD-004', description: 'Produto D', totalProfit: 1500.00, margin: 75.0 },
        { partNumber: 'PROD-005', description: 'Produto E', totalProfit: 1200.00, margin: 60.0 }
      ],
      unusedProducts: [
        { partNumber: 'PROD-006', description: 'Produto F', daysSinceCreated: 120 },
        { partNumber: 'PROD-007', description: 'Produto G', daysSinceCreated: 90 }
      ],
      trends: {
        monthlyUsage: [
          { month: '2024-01', usage: 156 },
          { month: '2024-02', usage: 189 },
          { month: '2024-03', usage: 203 }
        ],
        categoryPerformance: [
          { category: 'Eletrônicos', usage: 234, revenue: 11700.00 },
          { category: 'Ferramentas', usage: 156, revenue: 7800.00 }
        ]
      }
    }
    
    return mockPerformanceData
    
  } catch (error) {
    console.error('Erro ao gerar relatório de performance:', error)
    throw error
  }
}

/**
 * Gera relatório de inventário
 */
async function generateInventoryReport(filters: any) {
  try {
    const products = await ProductService.getProducts({
      isActive: filters.isActive,
      limit: 10000
    })
    
    const inventoryData = {
      totalValue: products.products.reduce((sum, p) => sum + (p.salePrice || 0), 0),
      totalCost: products.products.reduce((sum, p) => sum + (p.costPrice || 0), 0),
      productsByStatus: {
        active: products.products.filter(p => p.isActive !== false).length,
        inactive: products.products.filter(p => p.isActive === false).length
      },
      valueDistribution: {
        lowValue: products.products.filter(p => (p.salePrice || 0) < 50).length,
        mediumValue: products.products.filter(p => (p.salePrice || 0) >= 50 && (p.salePrice || 0) < 200).length,
        highValue: products.products.filter(p => (p.salePrice || 0) >= 200).length
      },
      // TODO: Integrar com sistema de estoque real
      stockStatus: {
        inStock: products.products.length, // Mock - assumir que todos estão em estoque
        outOfStock: 0,
        lowStock: 0
      }
    }
    
    return inventoryData
    
  } catch (error) {
    console.error('Erro ao gerar relatório de inventário:', error)
    throw error
  }
}

/**
 * Gera relatório personalizado
 */
async function generateCustomReport(config: any) {
  try {
    // TODO: Implementar geração de relatório personalizado baseado na configuração
    const mockCustomReport = {
      data: [],
      charts: config.includeCharts ? [] : undefined,
      summary: {},
      configuration: config
    }
    
    return mockCustomReport
    
  } catch (error) {
    console.error('Erro ao gerar relatório personalizado:', error)
    throw error
  }
}

/**
 * Gera CSV do relatório
 */
function generateReportCSV(reportData: any): string {
  // TODO: Implementar geração de CSV baseada nos dados do relatório
  return 'Part Number,Descrição,Preço de Custo,Preço de Venda,Margem\n'
}

/**
 * Registra geração de relatório para auditoria
 */
async function logReportGeneration(userId: string, reportType: string, filters: any) {
  try {
    console.log('Report Generated:', {
      userId,
      reportType,
      filters,
      timestamp: new Date().toISOString()
    })
    
    // TODO: Integrar com sistema de auditoria
  } catch (error) {
    console.error('Erro ao registrar geração de relatório:', error)
  }
}