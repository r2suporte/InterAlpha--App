/**
 * Serviço para controle de estoque
 */

import { prisma } from '@/lib/prisma'

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  LOSS = 'LOSS',
  RETURN = 'RETURN'
}

export interface StockMovementData {
  productId: string
  type: StockMovementType
  quantity: number
  reason: string
  reference?: string
  userId: string
}

export interface StockAlert {
  productId: string
  product: {
    partNumber: string
    description: string
    quantity: number
    minStock: number
  }
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export class StockService {
  /**
   * Registrar movimentação de estoque
   */
  async recordMovement(data: StockMovementData): Promise<any> {
    const { productId, type, quantity, reason, reference, userId } = data

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      throw new Error('Produto não encontrado')
    }

    // Validar quantidade
    if (quantity <= 0) {
      throw new Error('Quantidade deve ser positiva')
    }

    // Calcular nova quantidade
    let newQuantity = product.quantity
    
    switch (type) {
      case StockMovementType.IN:
      case StockMovementType.RETURN:
        newQuantity += quantity
        break
      case StockMovementType.OUT:
      case StockMovementType.LOSS:
        newQuantity -= quantity
        break
      case StockMovementType.ADJUSTMENT:
        // Para ajuste, a quantidade é o valor final desejado
        newQuantity = quantity
        break
      case StockMovementType.TRANSFER:
        // Para transferência, tratar como saída
        newQuantity -= quantity
        break
      default:
        throw new Error('Tipo de movimentação inválido')
    }

    // Verificar se não ficará negativo
    if (newQuantity < 0) {
      throw new Error('Estoque não pode ficar negativo')
    }

    // Executar em transação
    const result = await prisma.$transaction(async (tx) => {
      // Registrar movimentação
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity: type === StockMovementType.ADJUSTMENT 
            ? quantity - product.quantity // Diferença para ajuste
            : quantity,
          reason,
          reference,
          userId
        },
        include: {
          product: {
            select: {
              partNumber: true,
              description: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      // Atualizar quantidade do produto
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { quantity: newQuantity }
      })

      return { movement, updatedProduct }
    })

    // Verificar alertas de estoque
    await this.checkStockAlerts(productId)

    return result
  }

  /**
   * Entrada de estoque
   */
  async stockIn(productId: string, quantity: number, reason: string, userId: string, reference?: string) {
    return this.recordMovement({
      productId,
      type: StockMovementType.IN,
      quantity,
      reason,
      reference,
      userId
    })
  }

  /**
   * Saída de estoque
   */
  async stockOut(productId: string, quantity: number, reason: string, userId: string, reference?: string) {
    return this.recordMovement({
      productId,
      type: StockMovementType.OUT,
      quantity,
      reason,
      reference,
      userId
    })
  }

  /**
   * Ajuste de estoque
   */
  async adjustStock(productId: string, newQuantity: number, reason: string, userId: string) {
    return this.recordMovement({
      productId,
      type: StockMovementType.ADJUSTMENT,
      quantity: newQuantity,
      reason,
      userId
    })
  }

  /**
   * Baixa automática de estoque (usado em ordens de serviço)
   */
  async automaticStockOut(productId: string, quantity: number, orderId: string, userId: string) {
    return this.recordMovement({
      productId,
      type: StockMovementType.OUT,
      quantity,
      reason: 'Uso em ordem de serviço',
      reference: orderId,
      userId
    })
  }

  /**
   * Obter saldo atual de um produto
   */
  async getCurrentStock(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        partNumber: true,
        description: true,
        quantity: true,
        minStock: true,
        maxStock: true,
        stockUnit: true
      }
    })

    if (!product) {
      throw new Error('Produto não encontrado')
    }

    return product
  }

  /**
   * Histórico de movimentações de um produto
   */
  async getMovementHistory(productId: string, limit = 50) {
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return movements
  }

  /**
   * Relatório de estoque
   */
  async getStockReport(filters?: {
    lowStock?: boolean
    outOfStock?: boolean
    category?: string
    search?: string
  }) {
    const where: any = {
      isActive: true
    }

    if (filters?.lowStock) {
      where.quantity = { lte: prisma.product.fields.minStock }
    }

    if (filters?.outOfStock) {
      where.quantity = 0
    }

    if (filters?.search) {
      where.OR = [
        { partNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        partNumber: true,
        description: true,
        quantity: true,
        minStock: true,
        maxStock: true,
        stockUnit: true,
        costPrice: true,
        salePrice: true,
        createdAt: true
      },
      orderBy: [
        { quantity: 'asc' }, // Produtos com menor estoque primeiro
        { partNumber: 'asc' }
      ]
    })

    // Calcular estatísticas
    const stats = {
      totalProducts: products.length,
      lowStockProducts: products.filter(p => p.quantity <= p.minStock).length,
      outOfStockProducts: products.filter(p => p.quantity === 0).length,
      totalStockValue: products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0),
      averageStockLevel: products.length > 0 
        ? products.reduce((sum, p) => sum + p.quantity, 0) / products.length 
        : 0
    }

    return {
      products,
      stats
    }
  }

  /**
   * Verificar alertas de estoque
   */
  async checkStockAlerts(productId?: string): Promise<StockAlert[]> {
    const where: any = { isActive: true }
    
    if (productId) {
      where.id = productId
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        partNumber: true,
        description: true,
        quantity: true,
        minStock: true,
        maxStock: true
      }
    })

    const alerts: StockAlert[] = []

    for (const product of products) {
      // Estoque zerado
      if (product.quantity === 0) {
        alerts.push({
          productId: product.id,
          product,
          alertType: 'OUT_OF_STOCK',
          severity: 'CRITICAL'
        })
      }
      // Estoque baixo
      else if (product.quantity <= product.minStock) {
        const severity = product.quantity <= (product.minStock * 0.5) ? 'HIGH' : 'MEDIUM'
        alerts.push({
          productId: product.id,
          product,
          alertType: 'LOW_STOCK',
          severity
        })
      }
      // Estoque alto (se maxStock definido)
      else if (product.maxStock && product.quantity > product.maxStock) {
        alerts.push({
          productId: product.id,
          product,
          alertType: 'OVERSTOCK',
          severity: 'LOW'
        })
      }
    }

    // Enviar notificações se necessário
    if (alerts.length > 0) {
      await this.sendStockAlerts(alerts)
    }

    return alerts
  }

  /**
   * Enviar alertas de estoque
   */
  private async sendStockAlerts(alerts: StockAlert[]) {
    try {
      // Importar dinamicamente para evitar dependência circular
      const { handleLowStockAlert } = await import('@/services/notifications/product-event-handlers')
      
      for (const alert of alerts) {
        if (alert.alertType === 'LOW_STOCK' || alert.alertType === 'OUT_OF_STOCK') {
          // Converter para formato esperado pelo handler
          const product = {
            id: alert.productId,
            partNumber: alert.product.partNumber,
            description: alert.product.description,
            stock: alert.product.quantity,
            minStock: alert.product.minStock
          }
          
          await handleLowStockAlert(product as any)
        }
      }
    } catch (error) {
      console.error('Erro ao enviar alertas de estoque:', error)
      // Não falhar a operação por causa da notificação
    }
  }

  /**
   * Produtos com estoque baixo
   */
  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        quantity: { lte: prisma.product.fields.minStock }
      },
      select: {
        id: true,
        partNumber: true,
        description: true,
        quantity: true,
        minStock: true,
        stockUnit: true
      },
      orderBy: { quantity: 'asc' }
    })

    return products
  }

  /**
   * Produtos sem estoque
   */
  async getOutOfStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        quantity: 0
      },
      select: {
        id: true,
        partNumber: true,
        description: true,
        minStock: true,
        stockUnit: true
      },
      orderBy: { partNumber: 'asc' }
    })

    return products
  }

  /**
   * Movimentações recentes
   */
  async getRecentMovements(limit = 20) {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: {
          select: {
            partNumber: true,
            description: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return movements
  }

  /**
   * Estatísticas de estoque
   */
  async getStockStats() {
    const [
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalMovements,
      recentMovements
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ 
        where: { 
          isActive: true,
          quantity: { lte: prisma.product.fields.minStock }
        }
      }),
      prisma.product.count({ 
        where: { 
          isActive: true,
          quantity: 0
        }
      }),
      prisma.stockMovement.count(),
      prisma.stockMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          }
        }
      })
    ])

    // Calcular valor total do estoque
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        quantity: true,
        costPrice: true
      }
    })

    const totalStockValue = products.reduce(
      (sum, product) => sum + (product.quantity * product.costPrice),
      0
    )

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalMovements,
      recentMovements,
      totalStockValue,
      averageProductValue: totalProducts > 0 ? totalStockValue / totalProducts : 0
    }
  }
}