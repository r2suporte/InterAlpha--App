/**
 * Serviço para dashboard de produtos com métricas
 */

import { prisma } from '@/lib/prisma'

export interface DashboardMetrics {
  overview: {
    totalProducts: number
    activeProducts: number
    totalCategories: number
    lowStockProducts: number
    outOfStockProducts: number
    totalStockValue: number
    averageMargin: number
  }
  topProducts: {
    mostSold: Array<{
      id: string
      partNumber: string
      description: string
      totalSold: number
      revenue: number
    }>
    highestMargin: Array<{
      id: string
      partNumber: string
      description: string
      margin: number
      marginPercent: number
    }>
    mostProfitable: Array<{
      id: string
      partNumber: string
      description: string
      profit: number
      totalSold: number
    }>
  }
  categoryStats: Array<{
    id: string
    name: string
    productCount: number
    totalValue: number
    averagePrice: number
  }>
  stockAlerts: Array<{
    id: string
    partNumber: string
    description: string
    currentStock: number
    minStock: number
    alertType: 'LOW_STOCK' | 'OUT_OF_STOCK'
  }>
  recentActivity: Array<{
    type: 'PRODUCT_CREATED' | 'STOCK_MOVEMENT' | 'ORDER_ITEM'
    description: string
    timestamp: Date
    productId?: string
    productName?: string
  }>
}

export class DashboardService {
  /**
   * Obter métricas completas do dashboard
   */
  async getMetrics(period = 30): Promise<DashboardMetrics> {
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - period)

    const [
      overview,
      topProducts,
      categoryStats,
      stockAlerts,
      recentActivity
    ] = await Promise.all([
      this.getOverviewMetrics(),
      this.getTopProducts(period),
      this.getCategoryStats(),
      this.getStockAlerts(),
      this.getRecentActivity(20)
    ])

    return {
      overview,
      topProducts,
      categoryStats,
      stockAlerts,
      recentActivity
    }
  }

  /**
   * Métricas gerais
   */
  private async getOverviewMetrics() {
    const [
      totalProducts,
      activeProducts,
      totalCategories,
      lowStockProducts,
      outOfStockProducts,
      products
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productCategory.count({ where: { isActive: true } }),
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
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          quantity: true,
          costPrice: true,
          salePrice: true
        }
      })
    ])

    // Calcular valor total do estoque
    const totalStockValue = products.reduce(
      (sum, product) => sum + (product.quantity * product.costPrice),
      0
    )

    // Calcular margem média
    const averageMargin = products.length > 0
      ? products.reduce((sum, product) => {
          const margin = ((product.salePrice - product.costPrice) / product.costPrice) * 100
          return sum + margin
        }, 0) / products.length
      : 0

    return {
      totalProducts,
      activeProducts,
      totalCategories,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      averageMargin
    }
  }

  /**
   * Top produtos por diferentes critérios
   */
  private async getTopProducts(period: number) {
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - period)

    // Produtos mais vendidos (baseado em OrderItems)
    const mostSold = await prisma.product.findMany({
      select: {
        id: true,
        partNumber: true,
        description: true,
        orderItems: {
          select: {
            quantity: true,
            totalPrice: true
          },
          where: {
            createdAt: { gte: periodStart }
          }
        }
      },
      where: { isActive: true }
    })

    const mostSoldProcessed = mostSold
      .map(product => {
        const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const revenue = product.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
        return {
          id: product.id,
          partNumber: product.partNumber,
          description: product.description,
          totalSold,
          revenue
        }
      })
      .filter(p => p.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10)

    // Produtos com maior margem
    const highestMargin = await prisma.product.findMany({
      select: {
        id: true,
        partNumber: true,
        description: true,
        costPrice: true,
        salePrice: true
      },
      where: { isActive: true },
      orderBy: { salePrice: 'desc' },
      take: 50
    })

    const highestMarginProcessed = highestMargin
      .map(product => {
        const margin = product.salePrice - product.costPrice
        const marginPercent = ((margin / product.costPrice) * 100)
        return {
          id: product.id,
          partNumber: product.partNumber,
          description: product.description,
          margin,
          marginPercent
        }
      })
      .sort((a, b) => b.marginPercent - a.marginPercent)
      .slice(0, 10)

    // Produtos mais lucrativos
    const mostProfitable = mostSold
      .map(product => {
        const productData = highestMargin.find(p => p.id === product.id)
        if (!productData) return null
        
        const unitProfit = productData.salePrice - productData.costPrice
        const profit = unitProfit * product.totalSold
        
        return {
          id: product.id,
          partNumber: product.partNumber,
          description: product.description,
          profit,
          totalSold: product.totalSold
        }
      })
      .filter(Boolean)
      .sort((a, b) => b!.profit - a!.profit)
      .slice(0, 10) as any[]

    return {
      mostSold: mostSoldProcessed,
      highestMargin: highestMarginProcessed,
      mostProfitable
    }
  }

  /**
   * Estatísticas por categoria
   */
  private async getCategoryStats() {
    const categories = await prisma.productCategory.findMany({
      where: { isActive: true },
      include: {
        products: {
          select: {
            salePrice: true,
            costPrice: true,
            quantity: true
          },
          where: { isActive: true }
        }
      }
    })

    return categories.map(category => {
      const productCount = category.products.length
      const totalValue = category.products.reduce(
        (sum, product) => sum + (product.quantity * product.costPrice),
        0
      )
      const averagePrice = productCount > 0
        ? category.products.reduce((sum, product) => sum + product.salePrice, 0) / productCount
        : 0

      return {
        id: category.id,
        name: category.name,
        productCount,
        totalValue,
        averagePrice
      }
    })
  }

  /**
   * Alertas de estoque
   */
  private async getStockAlerts() {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { quantity: 0 },
          { quantity: { lte: prisma.product.fields.minStock } }
        ]
      },
      select: {
        id: true,
        partNumber: true,
        description: true,
        quantity: true,
        minStock: true
      },
      orderBy: { quantity: 'asc' }
    })

    return products.map(product => ({
      id: product.id,
      partNumber: product.partNumber,
      description: product.description,
      currentStock: product.quantity,
      minStock: product.minStock,
      alertType: product.quantity === 0 ? 'OUT_OF_STOCK' as const : 'LOW_STOCK' as const
    }))
  }

  /**
   * Atividade recente
   */
  private async getRecentActivity(limit: number) {
    const [recentProducts, recentMovements, recentOrders] = await Promise.all([
      // Produtos criados recentemente
      prisma.product.findMany({
        select: {
          id: true,
          partNumber: true,
          description: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit / 3
      }),
      
      // Movimentações de estoque recentes
      prisma.stockMovement.findMany({
        select: {
          type: true,
          quantity: true,
          reason: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              partNumber: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit / 3
      }),
      
      // Itens de ordem recentes
      prisma.orderItem.findMany({
        select: {
          quantity: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              partNumber: true,
              description: true
            }
          },
          order: {
            select: {
              titulo: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit / 3
      })
    ])

    const activities: any[] = []

    // Adicionar produtos criados
    recentProducts.forEach(product => {
      activities.push({
        type: 'PRODUCT_CREATED',
        description: `Produto ${product.partNumber} foi criado`,
        timestamp: product.createdAt,
        productId: product.id,
        productName: product.partNumber
      })
    })

    // Adicionar movimentações
    recentMovements.forEach(movement => {
      activities.push({
        type: 'STOCK_MOVEMENT',
        description: `${movement.type === 'IN' ? 'Entrada' : 'Saída'} de ${movement.quantity} ${movement.product.partNumber}`,
        timestamp: movement.createdAt,
        productId: movement.product.id,
        productName: movement.product.partNumber
      })
    })

    // Adicionar itens de ordem
    recentOrders.forEach(item => {
      activities.push({
        type: 'ORDER_ITEM',
        description: `${item.quantity} ${item.product.partNumber} usado em "${item.order.titulo}"`,
        timestamp: item.createdAt,
        productId: item.product.id,
        productName: item.product.partNumber
      })
    })

    // Ordenar por data e limitar
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Métricas de performance por período
   */
  async getPerformanceMetrics(days = 30) {
    const periods = []
    const now = new Date()

    // Criar períodos (últimos X dias)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      periods.push({
        date: date.toISOString().split('T')[0],
        start: date,
        end: nextDate
      })
    }

    // Buscar dados para cada período
    const performanceData = await Promise.all(
      periods.map(async period => {
        const [productsCreated, stockMovements, orderItems] = await Promise.all([
          prisma.product.count({
            where: {
              createdAt: {
                gte: period.start,
                lt: period.end
              }
            }
          }),
          prisma.stockMovement.count({
            where: {
              createdAt: {
                gte: period.start,
                lt: period.end
              }
            }
          }),
          prisma.orderItem.aggregate({
            where: {
              createdAt: {
                gte: period.start,
                lt: period.end
              }
            },
            _sum: {
              totalPrice: true,
              quantity: true
            },
            _count: true
          })
        ])

        return {
          date: period.date,
          productsCreated,
          stockMovements,
          orderItems: orderItems._count,
          revenue: orderItems._sum.totalPrice || 0,
          quantitySold: orderItems._sum.quantity || 0
        }
      })
    )

    return performanceData
  }
}