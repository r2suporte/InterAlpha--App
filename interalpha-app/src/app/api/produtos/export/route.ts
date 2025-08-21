import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { productFiltersSchema } from '@/lib/validations/product'
import { addCalculationsToProducts } from '@/lib/utils/product-utils'

/**
 * GET /api/produtos/export - Exportar produtos em CSV
 * POST /api/produtos/export - Exportar produtos com filtros específicos
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
    
    // Extrair filtros da query string
    const filters = {
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') || 'partNumber',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      page: 1,
      limit: 10000 // Exportar todos os produtos
    }

    // Validar filtros
    const validatedFilters = productFiltersSchema.parse(filters)

    // Buscar produtos
    const result = await ProductService.getProducts(validatedFilters)
    const productsWithCalculations = addCalculationsToProducts(result.products)

    // Gerar CSV
    const csvData = generateCSV(productsWithCalculations)

    // Retornar arquivo CSV
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="produtos_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Erro na exportação de produtos:', error)
    
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
 * POST /api/produtos/export - Exportar com filtros avançados
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
      filters = {}, 
      format = 'csv',
      includeCalculations = true,
      includeImages = false,
      includeHistory = false
    } = body

    // Construir filtros avançados
    const advancedFilters = {
      search: filters.search,
      isActive: filters.isActive,
      sortBy: filters.sortBy || 'partNumber',
      sortOrder: filters.sortOrder || 'asc',
      page: 1,
      limit: 10000,
      // Filtros específicos para exportação
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
    let products = result.products

    // Adicionar cálculos se solicitado
    if (includeCalculations) {
      products = addCalculationsToProducts(products)
    }

    // Gerar arquivo baseado no formato
    let fileContent: string
    let mimeType: string
    let fileExtension: string

    switch (format.toLowerCase()) {
      case 'json':
        fileContent = generateJSON(products, { includeImages, includeHistory })
        mimeType = 'application/json'
        fileExtension = 'json'
        break
      case 'excel':
      case 'xlsx':
        fileContent = generateExcel(products, { includeCalculations, includeImages })
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileExtension = 'xlsx'
        break
      default:
        fileContent = generateCSV(products, { includeCalculations, includeImages })
        mimeType = 'text/csv; charset=utf-8'
        fileExtension = 'csv'
    }

    const fileName = `produtos_${new Date().toISOString().split('T')[0]}.${fileExtension}`

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Erro na exportação avançada:', error)
    
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
 * Gerar arquivo CSV
 */
function generateCSV(products: any[], options: any = {}): string {
  const { includeCalculations = true, includeImages = false } = options

  // Cabeçalhos do CSV
  const headers = [
    'Part Number',
    'Descrição',
    'Preço de Custo (R$)',
    'Preço de Venda (R$)',
    'Status',
    'Criado em',
    'Criado por'
  ]

  if (includeCalculations) {
    headers.push('Margem (%)', 'Lucro (R$)', 'Status da Margem')
  }

  if (includeImages) {
    headers.push('URL da Imagem')
  }

  // Dados dos produtos
  const rows = products.map(product => {
    const row = [
      product.partNumber,
      `"${product.description.replace(/"/g, '""')}"`, // Escapar aspas
      product.costPrice.toFixed(2).replace('.', ','),
      product.salePrice.toFixed(2).replace('.', ','),
      product.isActive ? 'Ativo' : 'Inativo',
      new Date(product.createdAt).toLocaleDateString('pt-BR'),
      product.creator?.name || product.creator?.email || 'N/A'
    ]

    if (includeCalculations && product.profitMargin !== undefined) {
      row.push(
        product.profitMargin.toFixed(2).replace('.', ','),
        product.profitAmount.toFixed(2).replace('.', ','),
        product.marginStatus === 'positive' ? 'Positiva' : 
        product.marginStatus === 'negative' ? 'Negativa' : 'Neutra'
      )
    }

    if (includeImages) {
      row.push(product.imageUrl || '')
    }

    return row
  })

  // Combinar cabeçalhos e dados
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  
  // Adicionar BOM para UTF-8
  return '\uFEFF' + csvContent
}

/**
 * Gerar arquivo JSON
 */
function generateJSON(products: any[], options: any = {}): string {
  const { includeImages = false, includeHistory = false } = options

  const exportData = products.map(product => {
    const data: any = {
      partNumber: product.partNumber,
      description: product.description,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      creator: product.creator?.name || product.creator?.email
    }

    if (product.profitMargin !== undefined) {
      data.calculations = {
        profitMargin: product.profitMargin,
        profitAmount: product.profitAmount,
        marginStatus: product.marginStatus
      }
    }

    if (includeImages && product.imageUrl) {
      data.imageUrl = product.imageUrl
    }

    if (includeHistory && product.orderItems) {
      data.usageHistory = product.orderItems.map((item: any) => ({
        orderId: item.order.id,
        orderTitle: item.order.titulo,
        quantity: item.quantity,
        date: item.order.createdAt
      }))
    }

    return data
  })

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    products: exportData
  }, null, 2)
}

/**
 * Gerar arquivo Excel (simulado como CSV com separador de ponto e vírgula)
 */
function generateExcel(products: any[], options: any = {}): string {
  // Para uma implementação real do Excel, seria necessário usar uma biblioteca como 'xlsx'
  // Por enquanto, retornamos CSV com separador de ponto e vírgula (formato Excel brasileiro)
  
  const { includeCalculations = true, includeImages = false } = options

  const headers = [
    'Part Number',
    'Descrição',
    'Preço de Custo',
    'Preço de Venda',
    'Status',
    'Criado em',
    'Criado por'
  ]

  if (includeCalculations) {
    headers.push('Margem (%)', 'Lucro (R$)', 'Status da Margem')
  }

  if (includeImages) {
    headers.push('URL da Imagem')
  }

  const rows = products.map(product => {
    const row = [
      product.partNumber,
      product.description.replace(/"/g, '""'),
      product.costPrice.toFixed(2).replace('.', ','),
      product.salePrice.toFixed(2).replace('.', ','),
      product.isActive ? 'Ativo' : 'Inativo',
      new Date(product.createdAt).toLocaleDateString('pt-BR'),
      product.creator?.name || product.creator?.email || 'N/A'
    ]

    if (includeCalculations && product.profitMargin !== undefined) {
      row.push(
        product.profitMargin.toFixed(2).replace('.', ','),
        product.profitAmount.toFixed(2).replace('.', ','),
        product.marginStatus === 'positive' ? 'Positiva' : 
        product.marginStatus === 'negative' ? 'Negativa' : 'Neutra'
      )
    }

    if (includeImages) {
      row.push(product.imageUrl || '')
    }

    return row.map(cell => `"${cell}"`).join(';')
  })

  const csvContent = [
    headers.map(h => `"${h}"`).join(';'),
    ...rows
  ].join('\n')
  
  return '\uFEFF' + csvContent
}