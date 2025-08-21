import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { z } from 'zod'

// Schema para movimentação de estoque
const stockMovementSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  type: z.enum(['in', 'out', 'adjustment'], { 
    errorMap: () => ({ message: 'Tipo deve ser: in (entrada), out (saída) ou adjustment (ajuste)' })
  }),
  quantity: z.number().int().min(1, 'Quantidade deve ser um número inteiro positivo'),
  reason: z.string().min(1, 'Motivo é obrigatório').max(200),
  reference: z.string().max(100).optional(), // Referência externa (ordem de serviço, nota fiscal, etc.)
  unitCost: z.number().min(0).optional(), // Para entradas
  notes: z.string().max(500).optional()
})

// Schema para consulta de estoque
const stockQuerySchema = z.object({
  productIds: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  lowStockOnly: z.boolean().default(false),
  includeInactive: z.boolean().default(false),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0)
})

/**
 * GET /api/produtos/estoque - Consultar níveis de estoque
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
    
    // Extrair parâmetros de consulta
    const queryParams = {
      productIds: searchParams.get('productIds')?.split(',').filter(Boolean),
      categoryId: searchParams.get('categoryId'),
      lowStockOnly: searchParams.get('lowStockOnly') === 'true',
      includeInactive: searchParams.get('includeInactive') === 'true',
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    }
    
    const validatedQuery = stockQuerySchema.parse(queryParams)
    
    // Buscar informações de estoque
    const stockData = await getStockLevels(validatedQuery)
    
    return NextResponse.json({
      success: true,
      data: stockData.items,
      meta: {
        total: stockData.total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        lowStockCount: stockData.lowStockCount,
        outOfStockCount: stockData.outOfStockCount,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao consultar estoque:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parâmetros inválidos',
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
 * POST /api/produtos/estoque - Registrar movimentação de estoque
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
    
    // Validar dados da movimentação
    const validatedMovement = stockMovementSchema.parse(body)
    
    // Verificar se produto existe
    const product = await ProductService.getProductById(validatedMovement.productId)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }
    
    // Buscar estoque atual
    const currentStock = await getCurrentStock(validatedMovement.productId)
    
    // Validar movimentação de saída
    if (validatedMovement.type === 'out' && currentStock.quantity < validatedMovement.quantity) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Estoque insuficiente. Disponível: ${currentStock.quantity}, Solicitado: ${validatedMovement.quantity}`,
          currentStock: currentStock.quantity
        },
        { status: 409 }
      )
    }
    
    // Registrar movimentação
    const movement = await createStockMovement({
      ...validatedMovement,
      userId,
      previousQuantity: currentStock.quantity
    })
    
    // Atualizar estoque atual
    const newQuantity = calculateNewQuantity(
      currentStock.quantity, 
      validatedMovement.type, 
      validatedMovement.quantity
    )
    
    await updateCurrentStock(validatedMovement.productId, newQuantity, {
      lastMovementId: movement.id,
      updatedBy: userId
    })
    
    // Verificar alertas de estoque baixo
    const alerts = await checkStockAlerts(validatedMovement.productId, newQuantity)
    
    return NextResponse.json({
      success: true,
      data: {
        movement,
        newStock: {
          productId: validatedMovement.productId,
          quantity: newQuantity,
          previousQuantity: currentStock.quantity,
          change: newQuantity - currentStock.quantity
        },
        alerts
      },
      message: 'Movimentação de estoque registrada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao registrar movimentação de estoque:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
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
 * Busca níveis de estoque
 */
async function getStockLevels(query: any) {
  try {
    // TODO: Implementar busca real no banco
    // const stockItems = await prisma.productStock.findMany({
    //   where: {
    //     ...(query.productIds && { productId: { in: query.productIds } }),
    //     ...(query.categoryId && { product: { categoryId: query.categoryId } }),
    //     ...(query.lowStockOnly && { quantity: { lte: prisma.raw('minQuantity') } }),
    //     ...(query.includeInactive ? {} : { product: { isActive: true } })
    //   },
    //   include: {
    //     product: {
    //       select: {
    //         partNumber: true,
    //         description: true,
    //         salePrice: true,
    //         isActive: true
    //       }
    //     },
    //     lastMovement: {
    //       select: {
    //         type: true,
    //         createdAt: true,
    //         user: { select: { name: true } }
    //       }
    //     }
    //   },
    //   orderBy: { updatedAt: 'desc' },
    //   take: query.limit,
    //   skip: query.offset
    // })
    
    // Mock data para demonstração
    const mockStockItems = [
      {
        id: 'stock-1',
        productId: 'prod-1',
        quantity: 25,
        minQuantity: 10,
        maxQuantity: 100,
        reservedQuantity: 5,
        availableQuantity: 20,
        averageCost: 45.50,
        lastMovementAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        product: {
          partNumber: 'PROD-001',
          description: 'Produto de exemplo 1',
          salePrice: 75.00,
          isActive: true
        },
        lastMovement: {
          type: 'out',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          user: { name: 'João Silva' }
        },
        status: 'normal', // normal, low, out_of_stock, overstocked
        alerts: []
      },
      {
        id: 'stock-2',
        productId: 'prod-2',
        quantity: 5,
        minQuantity: 10,
        maxQuantity: 50,
        reservedQuantity: 2,
        availableQuantity: 3,
        averageCost: 95.00,
        lastMovementAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        product: {
          partNumber: 'PROD-002',
          description: 'Produto com estoque baixo',
          salePrice: 150.00,
          isActive: true
        },
        lastMovement: {
          type: 'out',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          user: { name: 'Maria Santos' }
        },
        status: 'low',
        alerts: ['Estoque abaixo do mínimo']
      },
      {
        id: 'stock-3',
        productId: 'prod-3',
        quantity: 0,
        minQuantity: 5,
        maxQuantity: 30,
        reservedQuantity: 0,
        availableQuantity: 0,
        averageCost: 25.00,
        lastMovementAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        product: {
          partNumber: 'PROD-003',
          description: 'Produto sem estoque',
          salePrice: 40.00,
          isActive: true
        },
        lastMovement: {
          type: 'out',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          user: { name: 'Carlos Lima' }
        },
        status: 'out_of_stock',
        alerts: ['Produto sem estoque']
      }
    ]
    
    // Aplicar filtros
    let filteredItems = mockStockItems
    
    if (query.lowStockOnly) {
      filteredItems = filteredItems.filter(item => 
        item.status === 'low' || item.status === 'out_of_stock'
      )
    }
    
    if (query.productIds) {
      filteredItems = filteredItems.filter(item => 
        query.productIds.includes(item.productId)
      )
    }
    
    const lowStockCount = mockStockItems.filter(item => item.status === 'low').length
    const outOfStockCount = mockStockItems.filter(item => item.status === 'out_of_stock').length
    
    return {
      items: filteredItems,
      total: filteredItems.length,
      lowStockCount,
      outOfStockCount
    }
    
  } catch (error) {
    console.error('Erro ao buscar níveis de estoque:', error)
    return { items: [], total: 0, lowStockCount: 0, outOfStockCount: 0 }
  }
}

/**
 * Busca estoque atual de um produto
 */
async function getCurrentStock(productId: string) {
  try {
    // TODO: Implementar busca real
    // const stock = await prisma.productStock.findUnique({
    //   where: { productId }
    // })
    
    // Mock data
    return {
      productId,
      quantity: 25,
      minQuantity: 10,
      reservedQuantity: 5
    }
    
  } catch (error) {
    console.error('Erro ao buscar estoque atual:', error)
    return { productId, quantity: 0, minQuantity: 0, reservedQuantity: 0 }
  }
}

/**
 * Cria movimentação de estoque
 */
async function createStockMovement(data: any) {
  try {
    // TODO: Implementar criação real
    // const movement = await prisma.stockMovement.create({
    //   data: {
    //     productId: data.productId,
    //     type: data.type,
    //     quantity: data.quantity,
    //     reason: data.reason,
    //     reference: data.reference,
    //     unitCost: data.unitCost,
    //     notes: data.notes,
    //     userId: data.userId,
    //     previousQuantity: data.previousQuantity,
    //     newQuantity: calculateNewQuantity(data.previousQuantity, data.type, data.quantity),
    //     createdAt: new Date()
    //   }
    // })
    
    // Mock movement
    const mockMovement = {
      id: `mov-${Date.now()}`,
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      reference: data.reference,
      unitCost: data.unitCost,
      notes: data.notes,
      userId: data.userId,
      previousQuantity: data.previousQuantity,
      newQuantity: calculateNewQuantity(data.previousQuantity, data.type, data.quantity),
      createdAt: new Date()
    }
    
    console.log('Stock Movement Created:', mockMovement)
    return mockMovement
    
  } catch (error) {
    console.error('Erro ao criar movimentação de estoque:', error)
    throw error
  }
}

/**
 * Calcula nova quantidade baseada no tipo de movimentação
 */
function calculateNewQuantity(currentQuantity: number, type: string, quantity: number): number {
  switch (type) {
    case 'in':
      return currentQuantity + quantity
    case 'out':
      return Math.max(0, currentQuantity - quantity)
    case 'adjustment':
      return quantity // Para ajustes, a quantidade é o valor final
    default:
      return currentQuantity
  }
}

/**
 * Atualiza estoque atual
 */
async function updateCurrentStock(productId: string, newQuantity: number, metadata: any) {
  try {
    // TODO: Implementar atualização real
    // await prisma.productStock.upsert({
    //   where: { productId },
    //   update: {
    //     quantity: newQuantity,
    //     lastMovementId: metadata.lastMovementId,
    //     updatedBy: metadata.updatedBy,
    //     updatedAt: new Date()
    //   },
    //   create: {
    //     productId,
    //     quantity: newQuantity,
    //     minQuantity: 0,
    //     maxQuantity: 1000,
    //     lastMovementId: metadata.lastMovementId,
    //     createdBy: metadata.updatedBy,
    //     updatedBy: metadata.updatedBy,
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // })
    
    console.log('Stock Updated:', { productId, newQuantity, metadata })
    
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error)
    throw error
  }
}

/**
 * Verifica alertas de estoque
 */
async function checkStockAlerts(productId: string, newQuantity: number) {
  try {
    const alerts = []
    
    // TODO: Buscar configurações de alerta do produto
    const minQuantity = 10 // Mock
    const maxQuantity = 100 // Mock
    
    if (newQuantity <= 0) {
      alerts.push({
        type: 'out_of_stock',
        message: 'Produto sem estoque',
        severity: 'critical'
      })
    } else if (newQuantity <= minQuantity) {
      alerts.push({
        type: 'low_stock',
        message: `Estoque baixo (${newQuantity} unidades)`,
        severity: 'warning'
      })
    } else if (newQuantity >= maxQuantity) {
      alerts.push({
        type: 'overstocked',
        message: `Estoque acima do máximo (${newQuantity} unidades)`,
        severity: 'info'
      })
    }
    
    return alerts
    
  } catch (error) {
    console.error('Erro ao verificar alertas de estoque:', error)
    return []
  }
}