import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'

/**
 * GET /api/produtos/estoque/[productId] - Consultar estoque específico de um produto
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const { productId } = params
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const historyLimit = parseInt(searchParams.get('historyLimit') || '20')
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se produto existe
    const product = await ProductService.getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Buscar informações de estoque
    const stockInfo = await getProductStockInfo(productId, {
      includeHistory,
      historyLimit
    })
    
    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          partNumber: product.partNumber,
          description: product.description,
          salePrice: product.salePrice,
          costPrice: product.costPrice
        },
        stock: stockInfo.current,
        history: includeHistory ? stockInfo.history : undefined,
        alerts: stockInfo.alerts,
        statistics: stockInfo.statistics
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao consultar estoque do produto:', error)
    
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
 * PUT /api/produtos/estoque/[productId] - Atualizar configurações de estoque
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
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

    const { productId } = params
    const body = await request.json()
    
    const {
      minQuantity,
      maxQuantity,
      reorderPoint,
      reorderQuantity,
      location,
      notes
    } = body
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se produto existe
    const product = await ProductService.getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Validar dados
    if (minQuantity !== undefined && minQuantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantidade mínima não pode ser negativa' },
        { status: 400 }
      )
    }
    
    if (maxQuantity !== undefined && minQuantity !== undefined && maxQuantity < minQuantity) {
      return NextResponse.json(
        { success: false, error: 'Quantidade máxima deve ser maior que a mínima' },
        { status: 400 }
      )
    }

    // Atualizar configurações de estoque
    const updatedStock = await updateStockSettings(productId, {
      minQuantity,
      maxQuantity,
      reorderPoint,
      reorderQuantity,
      location,
      notes,
      updatedBy: userId
    })
    
    return NextResponse.json({
      success: true,
      data: updatedStock,
      message: 'Configurações de estoque atualizadas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar configurações de estoque:', error)
    
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
 * Busca informações completas de estoque do produto
 */
async function getProductStockInfo(productId: string, options: {
  includeHistory: boolean
  historyLimit: number
}) {
  try {
    // TODO: Implementar busca real
    // const stockInfo = await prisma.productStock.findUnique({
    //   where: { productId },
    //   include: {
    //     movements: options.includeHistory ? {
    //       orderBy: { createdAt: 'desc' },
    //       take: options.historyLimit,
    //       include: {
    //         user: { select: { name: true, email: true } }
    //       }
    //     } : false
    //   }
    // })
    
    // Mock data
    const mockStockInfo = {
      current: {
        productId,
        quantity: 25,
        minQuantity: 10,
        maxQuantity: 100,
        reorderPoint: 15,
        reorderQuantity: 50,
        reservedQuantity: 5,
        availableQuantity: 20,
        averageCost: 45.50,
        totalValue: 1137.50, // quantity * averageCost
        location: 'Estoque A - Prateleira 3',
        lastMovementAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        notes: 'Produto com boa rotatividade'
      },
      history: options.includeHistory ? [
        {
          id: 'mov-1',
          type: 'out',
          quantity: 3,
          reason: 'Usado em ordem de serviço #1234',
          reference: 'OS-1234',
          previousQuantity: 28,
          newQuantity: 25,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          user: { name: 'João Silva', email: 'joao@empresa.com' }
        },
        {
          id: 'mov-2',
          type: 'in',
          quantity: 20,
          reason: 'Compra - Nota Fiscal 12345',
          reference: 'NF-12345',
          unitCost: 44.00,
          previousQuantity: 8,
          newQuantity: 28,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          user: { name: 'Maria Santos', email: 'maria@empresa.com' }
        },
        {
          id: 'mov-3',
          type: 'adjustment',
          quantity: 8,
          reason: 'Ajuste de inventário',
          reference: 'INV-2024-01',
          previousQuantity: 10,
          newQuantity: 8,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          user: { name: 'Carlos Lima', email: 'carlos@empresa.com' }
        }
      ] : undefined,
      alerts: [
        // Nenhum alerta no momento - estoque normal
      ],
      statistics: {
        totalMovements: 15,
        totalIn: 120,
        totalOut: 95,
        averageMonthlyUsage: 12,
        daysOfStock: Math.floor(25 / (12 / 30)), // quantidade atual / uso médio diário
        turnoverRate: 4.2, // rotatividade anual
        lastPurchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastUsageDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    }
    
    // Verificar alertas
    const alerts = []
    if (mockStockInfo.current.quantity <= mockStockInfo.current.reorderPoint) {
      alerts.push({
        type: 'reorder_needed',
        message: `Estoque atingiu ponto de reposição (${mockStockInfo.current.quantity} ≤ ${mockStockInfo.current.reorderPoint})`,
        severity: 'warning',
        suggestedAction: `Reabastecer com ${mockStockInfo.current.reorderQuantity} unidades`
      })
    }
    
    if (mockStockInfo.current.quantity <= mockStockInfo.current.minQuantity) {
      alerts.push({
        type: 'low_stock',
        message: `Estoque abaixo do mínimo (${mockStockInfo.current.quantity} ≤ ${mockStockInfo.current.minQuantity})`,
        severity: 'warning'
      })
    }
    
    mockStockInfo.alerts = alerts
    
    return mockStockInfo
    
  } catch (error) {
    console.error('Erro ao buscar informações de estoque:', error)
    return {
      current: null,
      history: [],
      alerts: [],
      statistics: {}
    }
  }
}

/**
 * Atualiza configurações de estoque
 */
async function updateStockSettings(productId: string, settings: any) {
  try {
    // TODO: Implementar atualização real
    // const updatedStock = await prisma.productStock.upsert({
    //   where: { productId },
    //   update: {
    //     minQuantity: settings.minQuantity,
    //     maxQuantity: settings.maxQuantity,
    //     reorderPoint: settings.reorderPoint,
    //     reorderQuantity: settings.reorderQuantity,
    //     location: settings.location,
    //     notes: settings.notes,
    //     updatedBy: settings.updatedBy,
    //     updatedAt: new Date()
    //   },
    //   create: {
    //     productId,
    //     quantity: 0,
    //     minQuantity: settings.minQuantity || 0,
    //     maxQuantity: settings.maxQuantity || 1000,
    //     reorderPoint: settings.reorderPoint || 0,
    //     reorderQuantity: settings.reorderQuantity || 0,
    //     location: settings.location,
    //     notes: settings.notes,
    //     createdBy: settings.updatedBy,
    //     updatedBy: settings.updatedBy,
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // })
    
    // Mock updated stock
    const mockUpdatedStock = {
      productId,
      minQuantity: settings.minQuantity,
      maxQuantity: settings.maxQuantity,
      reorderPoint: settings.reorderPoint,
      reorderQuantity: settings.reorderQuantity,
      location: settings.location,
      notes: settings.notes,
      updatedBy: settings.updatedBy,
      updatedAt: new Date()
    }
    
    console.log('Stock Settings Updated:', mockUpdatedStock)
    return mockUpdatedStock
    
  } catch (error) {
    console.error('Erro ao atualizar configurações de estoque:', error)
    throw error
  }
}